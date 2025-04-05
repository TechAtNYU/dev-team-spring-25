// import { createClient } from "@/utils/supabase/server"; // notice how it uses the server one since we don't have "useclient" so the default is server side component
"use client";

// import { getCurrentUserId, retrieveClassroomData } from "../../classroom/actions";

import { useContext } from "react";
import ClassroomManagementButtons from "./buttons";
import Link from "next/link";
import { UserContext } from "@/app/lib/userContext/userContext";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClassroomManagementPage() {
  const {classroomId} = useParams<{  classroomId: string }>()
  
  const userContext = useContext(UserContext);
  // If the userContext is undefined still, give loading visual
  if (!userContext) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  // get the data and setter from the context (these are just a regular useState, so treat them like that)
  // const { setUserAndClassData, userAndClassData } = userContext;
  // const userId = userAndClassData.userData.id;

  return (
    <div>
      <h1>Hello this is classroom {classroomId}</h1>
      <ClassroomManagementButtons classroomId={Number(classroomId)} userContext={userContext} />
      <Link href={`/classroom`} passHref>
        <button
          type="button"
          className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
        >
          Classroom Page
        </button>
      </Link>
    </div>
  );
}
