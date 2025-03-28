import { createClient } from "@shared/utils/supabase/server";
import InviteForm from "../../../modules/chatrooms/components/invite-form";
import Link from "next/link";

export default async function InvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No authenticated user found");
  }
  const currentUser = user.id;

  // get all the classrooms that current user joined
  const { data: classroomMembers, error: memberError } = await supabase
    .from("Classroom_Members")
    .select("id, classroom_id")
    .eq("user_id", currentUser);

  if (memberError) {
    throw new Error(`Failed to get classroom members: ${memberError.message}`);
  }

  const memberIds = classroomMembers?.map((element) => element.id) || [];

  // get all the chatroomsIds that current user joined
  const chatroomIds = [];

  for (const memberId of memberIds) {
    const { data, error } = await supabase
      .from("Chatroom_Members")
      .select("chatroom_id")
      .eq("member_id", memberId)
      .eq("is_active", true);

    if (data && !error) {
      for (const element of data) {
        chatroomIds.push(element.chatroom_id);
      }
    }
  }

  // get all the chatrooms that current user joined
  const chatrooms = [];

  for (const chatroomId of chatroomIds) {
    const { data, error } = await supabase
      .from("Chatrooms")
      .select("*")
      .eq("id", chatroomId)
      .single();

    if (data && !error) {
      chatrooms.push(data);
    }
  }

  return (
    <div className="container mx-auto max-w-md p-6">
      <div className="mb-4">
        <Link
          href="/chatrooms"
          className="text-indigo-600 hover:text-indigo-800"
        >
          &larr; Back to Chatrooms
        </Link>
      </div>

      <InviteForm chatrooms={chatrooms || []} />
    </div>
  );
}
