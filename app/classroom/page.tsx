// page.tsx
import { getUserClassrooms } from "./actions";
//import { createClient } from "@/utils/supabase/server";

export default async function ClassroomPage() {
  //const supabase = await createClient();

  const classrooms = await getUserClassrooms();

  if (!classrooms || classrooms.length === 0) {
    return <div>No classrooms found!</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Classrooms</h1>
      {classrooms.map((classroom) => (
        <div key={classroom.id}>
          <h2>Classroom ID: {classroom.id}</h2>
          <p>Ragflow Dataset ID: {classroom.ragflow_dataset_id || "null"}</p>
        </div>
      ))}
    </div>
  );
}
