import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { createChatroom } from "./actions";

const ChatroomsPage = async () => {
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
  const classroomIds =
    classroomMembers?.map((element) => element.classroom_id) || [];

  // Fetch classroom details for user joined classrooms
  const { data: userClassrooms, error: classroomsError } = await supabase
    .from("Classroom")
    .select("id, name")
    .in("id", classroomIds);

  if (classroomsError) {
    throw new Error(`Failed to get classrooms: ${classroomsError.message}`);
  }

  // get all the chatroomsIds that current user joined
  const chatroomIds = [];

  for (const memberId of memberIds) {
    const { data, error } = await supabase
      .from("Chatroom_Members")
      .select("chatroom_id")
      .eq("member_id", memberId);

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
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Chatrooms</h1>
        <form action={createChatroom} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="Chatroom name"
            className="rounded border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none"
            required
          />
          <select
            name="classroom_id"
            className="rounded border border-gray-300 px-3 py-2 text-black focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select a classroom</option>
            {userClassrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            Create Chatroom
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chatrooms.length > 0 ? (
          chatrooms.map((chatroom) => (
            <div key={chatroom.id} className="rounded-lg border p-4 shadow-sm">
              <h2 className="mb-2 text-xl font-semibold">{chatroom.name}</h2>
              <p>{`Classroom_id: ${chatroom.classroom_id}`}</p>
              <Link
                href={`/chatrooms/${chatroom.id}`}
                className="inline-block rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Enter Chatroom
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center">
            <p className="text-gray-500">
              You don&apos;t have any chatrooms yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatroomsPage;
