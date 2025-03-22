import { createClient } from "@/utils/supabase/server";
import NewMessages from "./components/new-messages";
import LeaveChatroomButton from "./components/leave-chatroom-button";

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
    console.error("Error fetching chatroom:", chatroomError);
    return <div>Error loading chatroom</div>;
  }

  const { data: chatroomMembers, error: membersError } = await supabase
    .from("Chatroom_Members")
    .select("id")
    .eq("chatroom_id", chatroomId);

  if (membersError) {
    console.error("Error fetching chatroom members:", membersError);
    return <div>Error loading chatroom</div>;
  }

  const memberIds = chatroomMembers?.map((member) => member.id) || [];

  if (memberIds.length === 0) {
    console.log("No members found for chatroom:", chatroomId);
    return <NewMessages chatHistory={[]} chatroomId={chatroomId} />;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("Messages")
    .select("*")
    .in("member_id", memberIds)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold">{chatroom.name}</h1>
        <LeaveChatroomButton
          chatroomId={chatroomId}
          classroomId={chatroom.classroom_id}
        />
      </div>
      <div className="flex-grow overflow-auto">
        <NewMessages chatHistory={messages ?? []} chatroomId={chatroomId} />
      </div>
    </div>
  );
};

export default ChatroomPage;
