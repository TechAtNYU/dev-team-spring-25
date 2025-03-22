"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

// export const sendMessageToChatroom = () => {
//   // TODO: Implement this function
// };
//
// export const inviteUserToChatroom = () => {
//   // TODO: Implement this function
// };
//

export const leaveChatroom = async (
  chatroomId: string,
  classroomId: number
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user found");
  }

  // Get user classroom member id
  const { data: classroomMember, error: classroomMemberError } = await supabase
    .from("Classroom_Members")
    .select("id")
    .eq("user_id", user.id)
    .eq("classroom_id", classroomId)
    .single();

  if (classroomMemberError) {
    throw new Error(
      `Failed to find classroom membership: ${classroomMemberError.message}`
    );
  }

  // Get the chatroom membership
  const { data: memberData, error: memberError } = await supabase
    .from("Chatroom_Members")
    .select("id")
    .eq("chatroom_id", chatroomId)
    .eq("member_id", classroomMember?.id)
    .single();

  if (memberError) {
    throw new Error(
      `Failed to find chatroom membership: ${memberError.message}`
    );
  }

  // Delete the membership
  const { error: deleteError } = await supabase
    .from("Chatroom_Members")
    .delete()
    .eq("id", memberData.id);

  if (deleteError) {
    throw new Error(`Failed to leave chatroom: ${deleteError.message}`);
  }

  revalidatePath("/chatrooms");
};
