"use client";

import { createContext, useState } from "react";
import { ClassroomWithMembers, UserWithClassroomsData } from "./contextFetcher";

export type UserContextType = {
  userAndClassData: UserWithClassroomsData;
  setUserAndClassData: React.Dispatch<
    React.SetStateAction<UserWithClassroomsData>
  >;
  setClassroomData: (
    stateSetFunction: React.Dispatch<
      React.SetStateAction<UserWithClassroomsData>
    >,
    newClassroomData: ClassroomWithMembers[]
  ) => void;
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export default function UserContextProvider({
  userAndClassDataInitial,
  children,
}: {
  userAndClassDataInitial: UserWithClassroomsData;
  children: React.ReactNode;
}) {
  const [userAndClassData, setUserAndClassData] =
    useState<UserWithClassroomsData>(userAndClassDataInitial);
  return (
    <UserContext.Provider
      value={{ userAndClassData, setUserAndClassData, setClassroomData }}
    >
      {children}
    </UserContext.Provider>
  );
}

const setClassroomData = (
  stateSetFunction: React.Dispatch<
    React.SetStateAction<UserWithClassroomsData>
  >,
  newClassroomData: ClassroomWithMembers[]
) => {
  stateSetFunction((prevData) => {
    // TODO: if we really dont allow nulls into context, then we dont need this default val
    const setUser = prevData?.userData ?? {
      id: "",
      app_metadata: {},
      user_metadata: {},
      aud: "",
      created_at: "",
    };
    return { userData: setUser, classroomsData: newClassroomData };
  });
};
