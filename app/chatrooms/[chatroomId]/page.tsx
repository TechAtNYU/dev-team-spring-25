import { createClient } from "@shared/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import LeaveChatroomButton from "./components/leave-chatroom-button";
import NewMessages from "./components/new-messages";
import { sendMessageToChatroom } from "../actions";

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
        Users(
          id,
          full_name,
          avatar_url
        )
      )
    `
    )
    .eq("chatroom_id", chatroomId)
    .eq("is_active", true);

  if (chatroomMembersError) {
    console.error("Error fetching chatroom members:", chatroomMembersError);
    throw new Error("Error fetching chatroom members");
  }

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

  // If user is not in this chatroom redirect to /chatrooms
  if (!currentMember) {
    redirect("/chatrooms");
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

  const messages = messageRaw
    ? messageRaw.map((message) => {
        const { Chatroom_Members, ...newMessage } = message;
        return {
          // HACK: llm response has member_id set to null and there is special user_id and full_name reserved for LLM
          user_id: Chatroom_Members?.Classroom_Members.Users.id ?? "llm",
          full_name:
            Chatroom_Members?.Classroom_Members.Users.full_name ??
            "AI Assistant",
          avatar_url:
            Chatroom_Members?.Classroom_Members.Users.avatar_url ?? "",
          ...newMessage,
        };
      })
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold">{chatroom.name}</h1>
        <div className="flex gap-2">
          {currentUser !== chatroom.creater_user_id && (
            <LeaveChatroomButton chatroomId={chatroomId} />
          )}
          <Link
            href="/chatrooms"
            className="rounded bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
          >
            Back to Chatrooms
          </Link>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <NewMessages chatHistory={messages} chatroomId={chatroomId} />
      </div>
      <div className="border-t p-4 text-black">
        <form action={sendMessageToChatroom} className="flex gap-2">
          <input type="hidden" name="chatroomId" value={chatroomId} />
          <input
            type="hidden"
            name="chatroomMemberId"
            value={currentMember.id}
          />
          <input
            type="text"
            name="message"
            placeholder="Type your message..."
            className="flex-grow rounded border p-2"
            required
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatroomPage;
