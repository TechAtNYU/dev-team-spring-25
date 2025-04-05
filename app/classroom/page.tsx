// import { createClient } from "@/utils/supabase/server"; // notice how it uses the server one since we don't have "useclient" so the default is server side component
// "use client";

import ClassroomList from "./classroomList";
import Link from "next/link";
export default async function ClassroomPage() {
  // This below moved to classroom list itself since we can only retrieve the class data from context
  // within a client component, dont want to make a whole new retrieve just for a check
  // const classData = await retrieveClassroomData(userId);
  // if (!classData) {
  //   return (
  //     <>
  //       <h1>No classrooms found!</h1>
  //       <NewClassroomButton />
  //     </>
  //   );
  // }
  return (
    <>
      <Link href="newClassroom/">
        <button
          type="button"
          className="dark:focus:green-red-900 mb-2 me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white"
        >
          Create a Classroom
        </button>
      </Link>
      <ClassroomList />
    </>
  );
}
