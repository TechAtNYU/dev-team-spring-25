import { createClient } from "@shared/utils/supabase/server";
import { redirect } from "next/navigation";
import config from "../config";
import DeleteChatroomButton from "./components/delete-chatroom-button";
import InviteChatroomButton from "./components/invite-chatroom-dialog";
import LeaveChatroomButton from "./components/leave-chatroom-button";
import MessageArea from "./components/message-area";
import { Users } from "lucide-react";

const ChatroomPage = async ({
  params,
}: {
  params: Promise<{ chatroomId: string }>;
}) => {
  const { chatroomId } = await params;
  const supabase = await createClient();

  // Get current chatroom details
  const { data: chatroom, error: chatroomError } = await supabase
    .from("Chatrooms")
    .select("*")
    .eq("id", chatroomId)
    .single();

  if (chatroomError) {
    redirect("/chatrooms");
  }

  // get all chatroom members details
  const { data: chatroomMembers, error: chatroomMembersError } = await supabase
    .from("Chatroom_Members")
    .select(
      `
      *,
      Classroom_Members (
        id,
        user_id,
        classroom_id,
        Users(
          id,
          full_name,
          avatar_url
        )
      ),
      Chatrooms (
        ragflow_session_id
      )
    `
    )
    .eq("chatroom_id", chatroomId)
    .eq("is_active", true);

  if (chatroomMembersError) {
    console.error("Error fetching chatroom members:", chatroomMembersError);
    throw new Error("Error fetching chatroom members");
  }

  const classroomId = chatroomMembers[0].Classroom_Members.classroom_id;
  const assistantId = chatroomMembers[0].Chatrooms.ragflow_session_id;

  // Get current Chatroom Member
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No authenticated user found");
  }

  const currentUser = user.id;

  const currentMember = chatroomMembers.find(
    (member) => member.Classroom_Members.user_id === currentUser
  );

  // If user is not in this chatroom redirect to /error
  // TODO: We might need to create an chatroom unauthroized page
  if (!currentMember) {
    redirect("/error");
  }

  // Get messages
  const { data: messageRaw, error: messagesError } = await supabase
    .from("Messages")
    .select(
      `
      *,
      Chatroom_Members (
        id,
        chatroom_id,
        Classroom_Members (
          Users (
            id,
            full_name,
            avatar_url
          )
        )
      )
    `
    )
    .eq("chatroom_id", chatroomId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    throw new Error("Error fetching messages");
  }

  // serialize llm messages
  const messages = messageRaw
    ? messageRaw.map((message) => {
        const { Chatroom_Members, ...newMessage } = message;
        return {
          // HACK: llm response has member_id set to null and special user_id and full_name reserved for LLM
          user_id: Chatroom_Members?.Classroom_Members.Users.id ?? config.llmId,
          full_name:
            Chatroom_Members?.Classroom_Members.Users.full_name ??
            config.llmName,
          avatar_url:
            Chatroom_Members?.Classroom_Members.Users.avatar_url ??
            config.llmAvatar,
          ...newMessage,
        };
      })
    : [];

  return (
    <div className="flex h-[83vh] flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{chatroom.name}</h1>
          <h2 className="flex flex-row gap-4 text-2xl font-medium tracking-tight text-muted-foreground">
            <Users className="self-center" /> Collaborative Chatroom
          </h2>
        </div>
        <div className="flex gap-2">
          {currentUser !== chatroom.creater_user_id ? (
            <LeaveChatroomButton
              chatroomId={chatroomId}
              classroomId={classroomId}
            />
          ) : (
            <DeleteChatroomButton
              chatroomId={chatroomId}
              classroomId={classroomId}
              assistantId={assistantId}
            />
          )}
          <InviteChatroomButton
            chatroomId={chatroomId}
            classroomId={classroomId}
            chatroomMembers={chatroomMembers}
          />
        </div>
      </div>

      <MessageArea
        chatHistory={messages}
        chatroomId={chatroomId}
        chatroomMemberRecord={currentMember}
        supabaseClientUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
        supabaseClientKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
      />
    </div>
  );
};

export default ChatroomPage;
