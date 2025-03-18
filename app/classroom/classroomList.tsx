"use client";
import { useState } from "react";
import {
  deleteClassroom,
  leaveClassroom,
  retrieveClassroomData,
  ClassroomWithMembers,
} from "./actions";
import InviteMember from "./inviteMember";
import Link from "next/link";

export default function ClassroomList({
  userId,
  initialAdminData,
  initialMemberData,
}: {
  userId: string;
  initialAdminData: ClassroomWithMembers[];
  initialMemberData: ClassroomWithMembers[];
}) {
  const [adminClasses, setAdminClassrooms] =
    useState<ClassroomWithMembers[]>(initialAdminData);
  const [memberClasses, setMemberClassrooms] =
    useState<ClassroomWithMembers[]>(initialMemberData);

  const deleteClassroomAndFetch = async (classroomId: number) => {
    try {
      await deleteClassroom(classroomId);
      const adClass = await retrieveClassroomData(userId);
      if (adClass) {
        setAdminClassrooms(adClass.validAdminClasses);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Error Occurred");
      }
    }
  };

  const leaveClassroomAndFetch = async (classroomId: number) => {
    try {
      await leaveClassroom(classroomId, userId);
      const adClass = await retrieveClassroomData(userId);
      if (adClass) {
        setMemberClassrooms(adClass.validNonAdminClasses);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Error Occurred");
      }
    }
  };

  function mapToListItem(
    classroomList: ClassroomWithMembers[],
    isAdmin: boolean
  ) {
    return classroomList.map((classroom) => {
      return (
        <div key={classroom.id}>
          <h1 className="text-xl">{classroom.name}</h1>
          <h2>Classroom ID: {classroom.id}</h2>
          <p>Ragflow Dataset ID: {classroom.ragflow_dataset_id || "null"}</p>

          {classroom.Classroom_Members &&
            classroom.Classroom_Members.length > 0 && (
              <div>
                <h3>Members:</h3>
                <ul>
                  {classroom.Classroom_Members.map((member) => (
                    <li key={member.id}>User ID: {member.user_id}</li>
                  ))}
                </ul>
              </div>
            )}

          <InviteMember classroomId={classroom.id} />
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
            <Link href={`../upload/${classroom.id}`} passHref>
              <button
                type="button"
                className="me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
              >
                Upload Materials
              </button>
            </Link>
          )}

          <hr className="my-5 h-px border-0 bg-gray-800 dark:bg-white" />
        </div>
      );
    });
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>User ID: {userId}</h1>
      <h1 className="mb-5 text-center text-3xl underline">My Classrooms</h1>
      <h2 className="text-center text-2xl">Admin Classrooms</h2>
      {mapToListItem(adminClasses, true)}
      <hr className="my-5 h-1 border-0 bg-gray-800 dark:bg-white" />
      <h2 className="text-center text-2xl">Member Classrooms</h2>
      {mapToListItem(memberClasses, false)}
      <Link href="newClassroom/">
        <button
          type="button"
          className="dark:focus:green-red-900 mb-2 me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white"
        >
          Create a Classroom
        </button>
      </Link>
    </div>
  );
}
