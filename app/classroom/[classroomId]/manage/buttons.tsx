// import { createClient } from "@/utils/supabase/server"; // notice how it uses the server one since we don't have "useclient" so the default is server side component
// "use client";

// import { getCurrentUserId, retrieveClassroomData } from "../../classroom/actions";
"use client";

import InviteMember from "./inviteMember";
import Link from "next/link";
// import MemberList from "../../classroom/memberList";
import {
  changeClassroomName,
  deleteClassroom,
  setArchiveStatusClassroom,
} from "../../actions";
import { optimisticUpdateAndFetchClassroomData } from "../../clientUtils";
import { getUserAndClassroomData } from "@/app/lib/userContext/contextFetcher";
import { UserContextType } from "@/app/lib/userContext/userContext";
import { Skeleton } from "@/components/ui/skeleton";
import MemberList from "../../memberList";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function ClassroomManagementButtons({
  classroomId,
  userContext,
}: {
  classroomId: number;
  userContext: UserContextType;
}) {
  //   const userId = await getCurrentUserId();
  //   const classData = await retrieveClassroomData(userId);
  const classroomIdNumber = Number(classroomId);
  const { setUserAndClassData, userAndClassData } = userContext;
  const router = useRouter();
  // const searchParams = useSearchParams();

  const classroomInfo = userAndClassData.classroomsData.find(
    (x) => x.id === classroomId
  );
  if (!classroomInfo) {
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

  const handleChangeClassroomName = async (classroomId: number) => {
    const newName = window.prompt("Enter new class name:");
    if (newName !== null && newName !== "") {
      optimisticUpdateAndFetchClassroomData(
        classroomId,
        async () => changeClassroomName(classroomId, newName),
        { name: newName },
        setUserAndClassData,
        refreshClassrooms
      );
    }
  };

  const refreshClassrooms = async () => {
    const refreshedData = await getUserAndClassroomData();
    if (refreshedData) {
      setUserAndClassData(refreshedData);
    }
  };

  const deleteClassroomFunction = async (classroomId: number) => {
    const confirmation = window.confirm(
      "Are you sure? This action can't be undone."
    );
    if (confirmation) {
      const delete_success = new URL("/classroom")
      delete_success.searchParams.append("delete_success",classroomId.toString())
      router.replace(delete_success.toString());

      optimisticUpdateAndFetchClassroomData(
        classroomId,
        async () => deleteClassroom(classroomId),
        "remove",
        setUserAndClassData
      );
      toast({
        title: "Successfully deleted classroom.",
      });

      // Redirect to the classrooms page after deletion
    } else {
      console.log("Classroom deletion cancelled."); //TODO: remove log message
    }
  };

  // const deletedClassSuccess = searchParams.get("delete_success");
  // if (deletedClassSuccess && !isNaN(Number(deletedClassSuccess))) {
  //   const deleteClassInfo = userAndClassData.classroomsData.find(
  //     (x) => x.id === Number(deletedClassSuccess)
  //   );
  //   if (deleteClassInfo) {
  //     toast({
  //       description: (
  //         <div>
  //           Successfully deleted classroom{" "}
  //           <span className="font-bold">{deleteClassInfo.name}</span>!
  //         </div>
  //       ),
  //       duration: 20000,
  //     });
  //   }
  // }

  return (
    <div>
      {"Look at the class info: " + classroomInfo.name}
      <Link href={`upload`} passHref>
        <button
          type="button"
          className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
        >
          Upload Materials
        </button>
      </Link>
      {/* ARCHIVE BUTTON */}
      <button
        type="button"
        className="me-2 rounded-lg border border-red-700 px-5 py-2.5 text-center text-sm font-medium text-red-700 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
        onClick={() =>
          optimisticUpdateAndFetchClassroomData(
            classroomId,
            async () => setArchiveStatusClassroom(classroomId, true),
            { archived: true },
            setUserAndClassData,
            refreshClassrooms
          )
        }
      >
        Archive
      </button>

      <button
        type="button"
        className="me-2 rounded-lg border border-red-700 px-5 py-2.5 text-center text-sm font-medium text-red-700 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
        onClick={() => deleteClassroomFunction(classroomIdNumber)}
      >
        Delete
      </button>

      {/* CHANGE NAME BUTTON */}
      <button
        onClick={() => handleChangeClassroomName(classroomIdNumber)}
        type="button"
        className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
      >
        Change Name
      </button>
      {classroomInfo.Classroom_Members &&
        classroomInfo.Classroom_Members.length > 0 && (
          <MemberList classroom={classroomInfo} enableDeletion={true} />
        )}
      <p>Invite Member:</p>
      <InviteMember classroomId={classroomId} />
    </div>
  );
}
