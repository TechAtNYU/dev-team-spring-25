"use server";

import { createClient } from "@shared/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getRagflowDatasetId,
  sendMessage,
} from "@/app/chat/[classroomId]/actions";
import {
  deleteSession,
  findChatAssistant,
  getOrCreateAssistant,
  getOrCreateSession,
  llmToChatroom,
} from "./helpers";

export const createChatroom = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user found");
  }

  const name = (formData.get("name") as string) || "New Chatroom";
  const classroom_id = parseInt(formData.get("classroom_id") as string);

  // Create a new chatroom
  const { data: chatroomData, error: chatroomError } = await supabase
    .from("Chatrooms")
    .insert([
      {
        name,
        classroom_id,
        creater_user_id: user.id,
      },
    ])
    .select("*")
    .single();

  if (chatroomError) {
    throw new Error(`Failed to create chatroom: ${chatroomError.message}`);
  }

  // Get the user's classroom member ID
  const { data: memberData, error: memberError } = await supabase
    .from("Classroom_Members")
    .select("id")
    .eq("user_id", user.id)
    .eq("classroom_id", classroom_id)
    .single();

  if (memberError) {
    throw new Error(`Failed to get member ID: ${memberError.message}`);
  }

  // Add the user to the chatroom
  const { error: chatMemberError } = await supabase
    .from("Chatroom_Members")
    .insert([
      {
        chatroom_id: chatroomData.id,
        member_id: memberData.id,
      },
    ]);

  if (chatMemberError) {
    throw new Error(
      `Failed to add user to chatroom: ${chatMemberError.message}`
    );
  }

  revalidatePath("/chatrooms");
};

export const deleteChatroom = async (
  chatroomId: string,
  classroomId: number
) => {
  const supabase = await createClient();

  const assistantId = await findChatAssistant(classroomId, chatroomId);

  if (assistantId) {
    console.log("found session. delete session for chatroom");
    await deleteSession(chatroomId, assistantId);
  }

  const { error: chatroomError } = await supabase
    .from("Chatrooms")
    .delete()
    .eq("id", chatroomId);

  if (chatroomError) {
    throw new Error(`Failed to delete chatroom: ${chatroomError.message}`);
  }

  revalidatePath("/chatrooms");
};

export const sendMessageToChatroom = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user found");
  }

  const chatroomId = formData.get("chatroomId") as string;
  let content = (formData.get("message") as string).trim();
  const chatroomMemberId = parseInt(formData.get("chatroomMemberId") as string);

  if (!content || !chatroomMemberId || !chatroomId) {
    throw new Error(
      "Chatroom ID, chatroom member ID, and message content are required"
    );
  }

  // Check if the message starts with "/ask" and trim it
  const isAskCommand = content.startsWith("/ask ");
  if (isAskCommand) {
    content = content.substring(5).trim();
    if (!content) {
      throw new Error("Message content is required after the /ask command");
    }
  }

  // Insert the message
  const { error: messageError } = await supabase.from("Messages").insert([
    {
      content,
      member_id: chatroomMemberId,
      chatroom_id: chatroomId,
      is_ask: isAskCommand,
    },
  ]);

  if (messageError) {
    throw new Error(`Failed to send message: ${messageError.message}`);
  }

  // Handle user "/ask" command
  if (isAskCommand) {
    askLLM(chatroomId);
  }

  revalidatePath(`/chatrooms/${chatroomId}`);
};

export const inviteUserToChatroom = async (formData: FormData) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user found");
  }

  const chatroomId = formData.get("chatroom_id") as string;
  const inviteeEmail = formData.get("email") as string;

  if (!chatroomId || !inviteeEmail) {
    throw new Error("Chatroom ID and invitee email are required");
  }

  // Get the chatroom members
  const { data: chatroomMembers, error: chatroomMembersError } = await supabase
    .from("Chatroom_Members")
    .select(
      `
      *,
      Chatrooms!inner(
        id,
        classroom_id
      )
    `
    )
    .eq("Chatrooms.id", chatroomId);

  if (chatroomMembersError) {
    throw new Error(`Failed to find chatroom: ${chatroomMembersError.message}`);
  }

  // Find the invitee user by email
  const { data: inviteeUser, error: userError } = await supabase
    .from("Users")
    .select("id")
    .eq("email", inviteeEmail.trim())
    .single();

  if (userError) {
    throw new Error(`Failed to find user with email ${inviteeEmail}`);
  }

  if (!inviteeUser) {
    throw new Error(`No user found with email ${inviteeEmail}`);
  }

  // Get chatroom details
  const { data: chatroom, error: chatroomError } = await supabase
    .from("Chatrooms")
    .select(
      `
      *,
      Classrooms(
        id
      )
    `
    )
    .eq("id", chatroomId)
    .single();

  if (chatroomError) {
    throw new Error(`Failed to find chatroom: ${chatroomError.message}`);
  }

  // Get classroom members for the classroom associated with this chatroom
  let classroomMemberId = null;

  const { data: classroomMembers, error: classroomMembersError } =
    await supabase
      .from("Classroom_Members")
      .select("id, user_id")
      .eq("classroom_id", chatroom.Classrooms.id);

  if (classroomMembersError) {
    throw new Error(
      `Failed to get classroom members: ${classroomMembersError.message}`
    );
  }

  // Check if the invitee is a member of the classroom. If not cannot invite
  for (const classroomMember of classroomMembers) {
    if (classroomMember.user_id === inviteeUser.id) {
      classroomMemberId = classroomMember.id;
      break;
    }
  }

  // If not a classroom member, the member cannot be invited
  if (!classroomMemberId) {
    throw new Error(
      `Invitee is not in the classroom associated with this chatroom`
    );
  }

  // If already a member of the chatroom, cannot invite the invitee
  const isInChatroom = chatroomMembers.find(
    (member) =>
      member.member_id === classroomMemberId && member.is_active === true
  );

  if (isInChatroom) {
    throw new Error(`Invitee is already in the chatroom`);
  }

  // Check if the user was previously in the chatroom but is now inactive
  const inactiveMember = chatroomMembers.find(
    (member) =>
      member.member_id === classroomMemberId && member.is_active === false
  );

  if (inactiveMember) {
    // Reactivate the member instead of creating a new record
    const { error: updateError } = await supabase
      .from("Chatroom_Members")
      .update({ is_active: true })
      .eq("id", inactiveMember.id);

    if (updateError) {
      throw new Error(
        `Failed to reactivate user in chatroom: ${updateError.message}`
      );
    }
  } else {
    // Add the user to the chatroom
    const { error: addChatroomMemberError } = await supabase
      .from("Chatroom_Members")
      .insert([
        {
          chatroom_id: chatroomId,
          member_id: classroomMemberId,
          is_active: true,
        },
      ]);

    if (addChatroomMemberError) {
      throw new Error(
        `Failed to add user to chatroom: ${addChatroomMemberError.message}`
      );
    }
  }

  revalidatePath("/chatrooms");
  return {
    success: true,
    message: `Successfully invited ${inviteeEmail} to the chatroom`,
  };
};

export const leaveChatroom = async (chatroomId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user found");
  }

  // Get the chatroom membership
  const { data: memberData, error: memberError } = await supabase
    .from("Chatroom_Members")
    .select(
      `
      id,
      chatroom_id,
      Classroom_Members!inner (
        user_id
      )
    `
    )
    .eq("chatroom_id", chatroomId)
    .eq("Classroom_Members.user_id", user.id)
    .single();

  if (memberError) {
    throw new Error(
      `Failed to find chatroom membership: ${memberError.message}`
    );
  }

  // Update the membership to set is_active to false instead of deleting
  const { error: updateError } = await supabase
    .from("Chatroom_Members")
    .update({ is_active: false })
    .eq("id", memberData.id);

  if (updateError) {
    throw new Error(`Failed to leave chatroom: ${updateError.message}`);
  }

  revalidatePath("/chatrooms");
};

export const askLLM = async (chatroomId: string) => {
  const supabase = await createClient();

  const { data: chatroom, error: chatroomError } = await supabase
    .from("Chatrooms")
    .select("classroom_id")
    .eq("id", chatroomId)
    .single();

  if (chatroomError) {
    throw new Error(`Failed to find chatroom: ${chatroomError.message}`);
  }

  // get all messages that is new
  const { data: messageRaw, error: messagesError } = await supabase
    .from("Messages")
    .select(
      `
      *,
      Chatroom_Members!inner (
        Classroom_Members (
          Users (
            full_name
          )
        )
      )
    `
    )
    .eq("is_new", true)
    .eq("chatroom_id", chatroomId)
    .eq("Chatroom_Members.is_active", true)
    .order("created_at", { ascending: true });

  if (messagesError || !messageRaw) {
    console.error("Error fetching messages:", messagesError);
    throw new Error("Error fetching messages or messages is null");
  }

  const messages = messageRaw.map((message) => {
    const { Chatroom_Members, ...newMessage } = message;
    return {
      id: newMessage.id,
      created_at: newMessage.created_at,
      content: newMessage.content,
      is_ask: newMessage.is_ask,
      full_name:
        Chatroom_Members?.Classroom_Members.Users.full_name || "Unknown User",
    };
  });

  // HACK: We might need better prompt engineering at some point to optomize performance
  const prompt = `
Below is the chat history before your last response (if any) in JSON:

${JSON.stringify(messages)}
  `;

  const datasetId = await getRagflowDatasetId(chatroom.classroom_id);

  if (!datasetId) {
    llmToChatroom(chatroomId, "No dataset found!");
    return;
  }

  const assistant = await getOrCreateAssistant(
    chatroomId,
    datasetId,
    chatroom.classroom_id
  );

  if (!assistant.id) {
    llmToChatroom(chatroomId, "Dataset is empty");
    return;
  }

  const chatSessionId = await getOrCreateSession(
    chatroomId,
    assistant.id,
    chatroom.classroom_id
  );

  const response: string = await sendMessage(
    prompt,
    assistant.id,
    chatSessionId
  );

  llmToChatroom(chatroomId, response);

  // mark all messages as not new message
  const messageIds = messages.map((message) => message.id);
  // console.log(messageIds);

  const { error: messageMarkError } = await supabase
    .from("Messages")
    .update({ is_new: false })
    .in("id", messageIds);

  if (messageMarkError) {
    throw new Error(
      `Failed to mark messages as not new: ${messageMarkError.message}`
    );
  }
};
