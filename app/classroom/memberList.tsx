"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shared/components/ui/sheet";
import { ClassroomWithMembers } from "./actions";
import { columns } from "./columns";
import { DataTable } from "@shared/components/ui/data-table";

export default function MemberList({
  classroom,
}: {
  classroom: ClassroomWithMembers;
}) {
  if (!classroom.Classroom_Members) {
    return <h1>No members found!</h1>;
  }
  // other table implementation: https://data-table.openstatus.dev/
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button>Show Members</button>
      </SheetTrigger>
      {/* not used: https://github.com/shadcn-ui/ui/issues/16#issuecomment-1602565563 */}
      <SheetContent className="flex w-[55vw] items-center justify-center align-middle sm:max-w-5xl">
        {/* for some reason chanding the width doesn't actually do anything */}
        <SheetHeader>
          <SheetTitle>{classroom.name} Members</SheetTitle>
          {/* <SheetDescription>
      Make changes to your profile here. Click save when
      you're done.
    </SheetDescription> */}

          {/* todo future, for smaller screens, make the width even smaller */}
          <div className="w-[50vw]">
            <DataTable
              columns={columns}
              data={classroom.Classroom_Members.map((x) => x.Users)}
            />
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
