// import { createClient } from "@/utils/supabase/server"; // notice how it uses the server one since we don't have "useclient" so the default is server side component
// "use client";

// import { getCurrentUserId, retrieveClassroomData } from "../../classroom/actions";
"use client";

import Link from "next/link";
// import MemberList from "../../classroom/memberList";
import {
  changeClassroomName,
  deleteClassroom,
  setArchiveStatusClassroom,
} from "../../actions";
import { optimisticUpdateAndFetchClassroomData } from "../../clientUtils";
import {
  ClassroomWithMembers,
  getUserAndClassroomData,
  UserWithClassroomsData,
} from "@shared/lib/userContext/contextFetcher";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shared/components/ui/alert-dialog";
import { Dispatch, SetStateAction, useTransition } from "react";
import { User } from "@supabase/supabase-js";
import SaveClassroomDialog from "../../_components/saveClassroomDialog";
import { Skeleton } from "@shared/components/ui/skeleton";
import MemberList from "../../_components/memberList";
import InviteMember from "./_components/inviteMember";
import { Archive, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";

export default function ClassroomManagementButtons({
  userData,
  classroomData,
  setUserAndClassCallback,
}: {
  userData: User;
  classroomData: ClassroomWithMembers;
  setUserAndClassCallback: Dispatch<SetStateAction<UserWithClassroomsData>>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  //   optimisticUpdateAndFetchClassroomData(
  //     classroomId,
  //     async () => changeClassroomName(classroomId, newName),
  //     { name: newName },
  //     setUserAndClassData,
  //     refreshClassrooms
  //   );
  // };
  const refreshClassrooms = async () => {
    const refreshedData = await getUserAndClassroomData();
    if (refreshedData) {
      setUserAndClassCallback(refreshedData);
    }
  };

  const handleChangeClassroomName = async (newName: string) => {
    return await optimisticUpdateAndFetchClassroomData(
      async () => changeClassroomName(classroomData.id, newName),
      { name: newName },
      setUserAndClassCallback,
      classroomData.id,
      refreshClassrooms
    );
  };

  const deleteClassroomFunction = async () => {
    router.push(`/classrooms`);
    startTransition(async () => {
      await deleteClassroom(classroomData.id);
    });
    toast.success("Successfully deleted classroom");
    // const confirmation = window.confirm(
    //   "Are you sure? This action can't be undone."
    // );
    // if (confirmation) {

    // const delete_success = new URL("/classroom");
    // delete_success.searchParams.append(
    //   "delete_success",
    //   classroomId.toString()
    // );
    // redirect(delete_success)

    refreshClassrooms();
  };

  const archiveClassroomCallback = async () => {
    // optimisticUpdateAndFetchClassroomData(
    //   classroomId,
    //   async () => setArchiveStatusClassroom(classroomId, true),
    //   { archived: true },
    //   setUserAndClassData,
    //   refreshClassrooms
    // );
    setArchiveStatusClassroom(classroomData.id, true);
    toast.success("Successfully archived classroom");
    router.push(`/classrooms`);
    // router.push(`/classroom?archive_success=${classroomData.id.toString()}`);
    refreshClassrooms();
  };

  return (
    <div>
      <h1>Managing Classroom - {classroomData.name}</h1>
      {/* <Link href={`upload`} passHref>
        <button
          type="button"
          className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
        >
          Upload Materials
        </button>
      </Link> */}
      {/* <TooltipUtil
              trigger={
                <Button
                  type="button"
                  variant={"ghost"}
                  size={"iconLg"}
                  asChild
                  // className="me-2 rounded-lg border px-5 py-2.5 text-center text-sm font-medium hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
                >
                  <Link href={`upload`} passHref><Upload /></Link>
                  
                </Button>
              }
              content={"Upload Materials"}
            /> */}
      <div className="mb-4 mt-4 flex items-center gap-4">
        <Button
          variant="outline"
          className="flex w-fit items-center gap-2 px-4 py-2"
          asChild
        >
          <Link href="upload" passHref className="flex items-center gap-2">
            <Upload /> Upload
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex gap-2"
          // effect={"hoverUnderline"}
          onClick={() => archiveClassroomCallback()}
        >
          <Archive /> Archive
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="flex gap-2"
              // effect={"hoverUnderline"}
            >
              <Trash2 /> Delete
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                classroom.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={() => deleteClassroomFunction()}
              >
                {isPending && <Loader2 className="animate-spin" />} Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <InviteMember classroomId={classroomData.id} />
      </div>

      <SaveClassroomDialog
        // isDialogOpen={isDialogOpen}
        // setIsDialogOpen={setIsDialogOpen}
        optimisticUpdateCallback={handleChangeClassroomName}
        actionText="update"
      />
      {/* <p>Invite Member:</p> */}

      {classroomData.Classroom_Members &&
      classroomData.Classroom_Members.length > 0 ? (
        <MemberList
          classroom={classroomData}
          enableDeletion={true}
          userId={userData.id}
        />
      ) : (
        <Skeleton></Skeleton>
      )}
    </div>
  );
}
