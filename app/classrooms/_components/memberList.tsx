"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shared/components/ui/sheet";
import { columns } from "./columns";
import { DataTable } from "@shared/components/ui/data-table";
import { ClassroomWithMembers } from "@shared/lib/userContext/contextFetcher";
import { Trash2, Users } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { Button } from "@shared/components/ui/button";
import { Tables } from "@shared/utils/supabase/database.types";
import { Row } from "@tanstack/react-table";
import { removeMember } from "../actions";

/**
 *
 * @param triggerButton make sure you wrap with a SheetTrigger with an asChild in order for the sheet to work
 * @returns
 */
export default function MemberList({
  classroom,
  userId,
  enableDeletion,
  triggerButton,
}: {
  classroom: ClassroomWithMembers;
  userId: string;
  enableDeletion: boolean;
  triggerButton?: ReactNode;
}) {
  const [members, setMembers] = useState<Tables<"Users">[]>([]);

  useEffect(() => {
    if (classroom.Classroom_Members) {
      setMembers(classroom.Classroom_Members.map((x) => x.Users));
    }
  }, [classroom.Classroom_Members]);

  if (!classroom.Classroom_Members) {
    return <h1>No members found!</h1>;
  }

  // const handleDelete = (memberId: string) => {
  //   console.log("ID:" + memberId);
  // };

  const removeMemberFunction = async (memberId: string) => {
    await removeMember(classroom.id, memberId);
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
  };

  // other table implementation: https://data-table.openstatus.dev/
  if (!enableDeletion) {
    return (
      <Sheet>
        {triggerButton ? (
          triggerButton
        ) : (
          <SheetTrigger asChild>
            <button
              type="button"
              className="me-2 flex items-center rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white dark:focus:ring-green-900"
            >
              Manage Members
              <Users className="ml-2" />
            </button>
          </SheetTrigger>
        )}

        {/* not used: https://github.com/shadcn-ui/ui/issues/16#issuecomment-1602565563 */}
        <SheetContent className="flex w-[55vw] items-center justify-center align-middle sm:max-w-5xl">
          <SheetHeader>
            <SheetTitle>{classroom.name} Members</SheetTitle>
            {/* <SheetDescription>
      Make changes to your profile here. Click save when
      you're done.
    </SheetDescription> */}

            {/* todo future, for smaller screens, make the width even smaller */}
            <div className="w-[50vw]">
              <DataTable
                columns={[
                  ...columns,
                  ...(enableDeletion
                    ? [
                        {
                          id: "actions",
                          cell: ({ row }: { row: Row<Tables<"Users">> }) => {
                            // const adminId = getCurrentUserId();
                            const isAdmin = row.original.id === userId; // Check if the current row is the admin

                            // Only render the delete button if the current row is NOT the admin
                            if (isAdmin) {
                              return null; // Return null, which removes the button from the row
                            }

                            return (
                              <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant={"destructiveGhost"}
                                      size={"iconLg"}
                                      onClick={() =>
                                        removeMemberFunction(row.original.id)
                                      }
                                    >
                                      <Trash2 />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove user</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          },
                        },
                      ]
                    : []),
                ]}
                data={members}
              />
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  } else {
    return (
      <div className="w-[50vw]">
        <DataTable
          columns={[
            ...columns,
            ...(enableDeletion
              ? [
                  {
                    id: "actions",
                    cell: ({ row }: { row: Row<Tables<"Users">> }) => {
                      // const adminId = getCurrentUserId();
                      const isAdmin = row.original.id === userId; // Check if the current row is the admin

                      // Only render the delete button if the current row is NOT the admin
                      if (isAdmin) {
                        return null; // Return null, which removes the button from the row
                      }

                      return (
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={"destructiveGhost"}
                                size={"iconLg"}
                                onClick={() =>
                                  removeMemberFunction(row.original.id)
                                }
                              >
                                <Trash2 />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove user</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    },
                  },
                ]
              : []),
          ]}
          data={members}
        />
      </div>
    );
  }
}
