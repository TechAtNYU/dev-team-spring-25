"use client";

import {
  ClassroomWithMembers,
  UserWithClassroomsData,
} from "../lib/userContext/contextFetcher";

/**
 * Called "optimistic" because it changes the data in the UI (eg. the name or deletes
 * the classroom) without waiting for it to see if the actual database was successful.
 * So the flow: update the UI, call the action, refresh with the actual database data
 * (which 99% of the time) will match what you optimistically update with anyway
 * Check uses of this below
 * @param classroomId classId to change
 * @param action action callback to call, just provide an async
 * @param newValue the value to optimistically update the classroom with
 */
export const optimisticUpdateAndFetchClassroomData = async <
  K extends keyof ClassroomWithMembers,
>(
  classroomId: number,
  action: () => Promise<unknown>,
  newValue: { [k in K]: ClassroomWithMembers[k] } | "remove",
  setUserAndClassDataFunction: React.Dispatch<
    React.SetStateAction<UserWithClassroomsData>
  >,
  refreshFunction?: () => Promise<unknown>
) => {
  setUserAndClassDataFunction((prevData) => ({
    userData: prevData.userData,
    classroomsData: prevData.classroomsData.flatMap((classroom) => {
      console.log(classroom.name);
      if (classroom.id === classroomId) {
        return newValue === "remove" ? [] : { ...classroom, ...newValue };
      }
      return classroom;
    }),
  }));
  await action();
  if (refreshFunction) {
    refreshFunction();
  }
};
