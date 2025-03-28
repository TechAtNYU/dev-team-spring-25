"use client";
import { useState } from "react";
import {
  deleteClassroom,
  leaveClassroom,
  retrieveClassroomData,
  changeClassroomName,
  ClassroomWithMembers,
  archiveClassroom,
  unarchiveClassroom,
} from "./actions";
import { Tables } from "@/utils/supabase/database.types";
import InviteMember from "./inviteMember";
import Link from "next/link";
import MemberList from "./memberList";

export default function ClassroomList({
  userId,
  initialAdminData,
  initialMemberData,
}: {
  userId: string;
  initialAdminData: Tables<"Classrooms">[];
  initialMemberData: Tables<"Classrooms">[];
}) {
  const [adminClasses, setAdminClassrooms] = useState(initialAdminData);
  const [memberClasses, setMemberClassrooms] = useState(initialMemberData);

  const deleteClassroomAndFetch = async (classroomId: number) => {
    try {
      await deleteClassroom(classroomId);
      refreshClassrooms();
    } catch (error: unknown) {
      //type unknown for typescript lint
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Error Occured");
      }
    }
  };

  const archiveClassroomAndFetch = async (classroomId: number) => {
    try {
      setAdminClassrooms((prevClasses) =>
        prevClasses.map((classroom) =>
          classroom.id === classroomId
            ? { ...classroom, archived: true }
            : classroom
        )
      );
      await archiveClassroom(classroomId);
      refreshClassrooms();
    } catch {
      console.error("Error occurred while archiving the classroom");
    }
  };

  const unarchiveClassroomAndFetch = async (classroomId: number) => {
    try {
      setAdminClassrooms((prevClasses) =>
        prevClasses.map((classroom) =>
          classroom.id === classroomId
            ? { ...classroom, archived: false }
            : classroom
        )
      );
      await unarchiveClassroom(classroomId);
      refreshClassrooms();
    } catch {
      console.error("Error occurred while archiving the classroom");
    }
  };

  const handleChangeClassroomName = async (classroomId: number) => {
    const newName = window.prompt("Enter new class name:");
    if (newName !== null && newName !== "") {
      setAdminClassrooms((prevClasses) =>
        prevClasses.map((classroom) =>
          classroom.id === classroomId
            ? { ...classroom, name: newName }
            : classroom
        )
      );

      try {
        await changeClassroomName(classroomId, newName);
      } catch (error) {
        console.error("Error changing classroom name:", error);
        setAdminClassrooms((prevClasses) =>
          prevClasses.map((classroom) =>
            classroom.id === classroomId
              ? { ...classroom, name: classroom.name }
              : classroom
          )
        );
      }
    }
  };

  const leaveClassroomAndFetch = async (classroomId: number) => {
    try {
      await leaveClassroom(classroomId, userId);
      refreshClassrooms();
    } catch (error: unknown) {
      //type unknown for typescript lint
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Error Occured");
      }
    }
  };

  const refreshClassrooms = async () => {
    const refreshedData = await retrieveClassroomData(userId);
    if (refreshedData) {
      setAdminClassrooms(refreshedData.validAdminClasses);
      setMemberClassrooms(refreshedData.validNonAdminClasses);
    }
  };

  function mapToListItem(
    classroomList: ClassroomWithMembers[],
    isAdmin: boolean
  ) {
    return classroomList.map((classroom) => {
      return (
        <div key={classroom.id}>
          {!classroom.archived && (
            <>
              <h1 className="text-xl">{classroom.name}</h1>
              <h2>Classroom ID: {classroom.id}</h2>
              <p>
                Ragflow Dataset ID: {classroom.ragflow_dataset_id || "null"}
              </p>
              <p>Join Code: {classroom.join_code || "N/A"}</p>

              {classroom.Classroom_Members &&
                classroom.Classroom_Members.length > 0 && (
                  <MemberList classroom={classroom} />
                )}

              <InviteMember
                classroomId={classroom.id}
                onInviteSuccess={refreshClassrooms}
              />
              <Link href={`../chat/${classroom.id}`} passHref>
                <button
                  type="button"
                  className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
                >
                  Chat!
                </button>
              </Link>
              <button
                type="button"
                className="me-2 rounded-lg border border-red-700 px-5 py-2.5 text-center text-sm font-medium text-red-700 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
                onClick={
                  isAdmin
                    ? () => deleteClassroomAndFetch(classroom.id)
                    : () => leaveClassroomAndFetch(classroom.id)
                }
              >
                {isAdmin ? "Delete Classroom" : "Leave Classroom"}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  className="me-2 rounded-lg border border-red-700 px-5 py-2.5 text-center text-sm font-medium text-red-700 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
                  onClick={() => archiveClassroomAndFetch(classroom.id)}
                >
                  Archive
                </button>
              )}

              {isAdmin && (
                <Link href={`classroom/${classroom.id}/upload`} passHref>
                  <button
                    type="button"
                    className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
                  >
                    Upload Materials
                  </button>
                </Link>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleChangeClassroomName(classroom.id)}
                  type="button"
                  className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
                >
                  Change Name
                </button>
              )}

              <hr className="my-5 h-px border-0 bg-gray-800 dark:bg-white" />
            </>
          )}
        </div>
      );
    });
  }

  function mapToListItemArchived(
    classroomList: ClassroomWithMembers[],
    isAdmin: boolean
  ) {
    return classroomList.map((classroom) => {
      return (
        <div key={classroom.id}>
          {classroom.archived && (
            <>
              <h1 className="text-xl">{classroom.name}</h1>
              <h2>Classroom ID: {classroom.id}</h2>
              <p>
                Ragflow Dataset ID: {classroom.ragflow_dataset_id || "null"}
              </p>

              {classroom.Classroom_Members &&
                classroom.Classroom_Members.length > 0 && (
                  <div>
                    <h3>Members:</h3>
                    <ul>
                      {classroom.Classroom_Members.map((member) => (
                        <li key={member.id}>User ID: {member.id}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* <InviteMember
               classroomId={classroom.id}
               onInviteSuccess={refreshClassrooms}
             /> */}
              {/* <Link href={`../chat/${classroom.id}`} passHref>
               <button
                 type="button"
                 className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
               >
                 Chat!
               </button>
             </Link> */}
              <button
                type="button"
                className="me-2 rounded-lg border border-red-700 px-5 py-2.5 text-center text-sm font-medium text-red-700 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
                onClick={
                  isAdmin
                    ? () => deleteClassroomAndFetch(classroom.id)
                    : () => leaveClassroomAndFetch(classroom.id)
                }
              >
                {isAdmin ? "Delete Classroom" : "Remove Classroom"}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
                  onClick={() => unarchiveClassroomAndFetch(classroom.id)}
                >
                  Unarchive
                </button>
              )}

              <hr className="my-5 h-px border-0 bg-gray-800 dark:bg-white" />
            </>
          )}
        </div>
      );
    });
  }

  return (
    <>
      <h1 className={"mb-5 text-center text-3xl underline"}>My Classrooms</h1>
      <h2 className={"text-center text-2xl"}>Admin Classrooms</h2>
      {/* ADMIN CLASSES */}
      {mapToListItem(adminClasses, true)}
      <hr className="my-5 h-1 border-0 bg-gray-800 dark:bg-white" />
      <h2 className={"text-center text-2xl"}>Member Classrooms</h2>
      {/* NON-ADMIN CLASSES */}
      {mapToListItem(memberClasses, false)}
      <hr className="my-5 h-5 border-0 bg-gray-800 dark:bg-white" />
      <h1 className={"mb-5 text-center text-3xl underline"}>
        Archived Classrooms
      </h1>
      <h2 className={"text-center text-2xl"}>Admin Classrooms</h2>
      {mapToListItemArchived(adminClasses, true)}

      <hr className="my-5 h-1 border-0 bg-gray-800 dark:bg-white" />
      <h2 className={"text-center text-2xl"}>Member Classrooms</h2>
      {/* NON-ADMIN CLASSES */}
      {mapToListItemArchived(memberClasses, false)}
      {/* <Link href="newClassroom/">
          <button
            type="button"
            className="dark:focus:green-red-900 mb-2 me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white"
          >
            Create a Classroom
          </button>
        </Link> */}
      {/* <ArchivedClassroomList
          userId={userId}
          initialAdminData={adminClasses}
          initialMemberData={memberClasses}
        /> */}
    </>
  );
}
