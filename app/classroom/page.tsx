// import { createClient } from "@/utils/supabase/server"; // notice how it uses the server one since we don't have "useclient" so the default is server side component
// "use client";

import { getCurrentUserId, retrieveClassroomData } from "./actions";
import ClassroomList from "./classroomList";
import NewClassroomButton from "./newClassroomButton";
export default async function ClassroomPage() {
  const userId = await getCurrentUserId();

  const classData = await retrieveClassroomData(userId);

  return (
    <>
      <div style={{ padding: 20 }}>
        <h1>User ID: {userId}</h1>
        <NewClassroomButton />
        <ClassroomList
          userId={userId}
          initialAdminData={classData?.validAdminClasses}
          initialMemberData={classData?.validNonAdminClasses}
        />
      </div>
    </>
  );
}
