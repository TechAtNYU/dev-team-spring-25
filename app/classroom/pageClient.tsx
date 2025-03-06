// import { signInWithGoogle } from "../auth/actions";
"use client";
import { createClient } from "@/utils/supabase/client"; // Notice we use the client one here
import { useEffect, useState } from "react";
import { insertRandom } from "./actions";

// THIS IS THE BAD WAY TO DO THIS, CLASSROOM SHOULD DELETE THIS LATER
//  WE WANT TO DO THE SERVER SIDE COMPONENTS AS MUCH AS POSSIBLE
// we use the client one here instead (which might be required for some small interactive components
// within a page). Notice how it uses useEffect, etc.
export default function ClassroomPage() {
  const supabase = createClient();

  const [classrooms, setClassrooms] = useState<Array<{ id?: number }>>([]);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("Classroom").select();
      if (!data) {
        return;
      }
      setClassrooms(data);
    }
    fetchData();
  }, [supabase]);

  return (
    <>
      <div>
        {classrooms.map((x) => {
          return x.id;
        })}
      </div>
      {/* I added this button with the server action (see action.ts in this directory
        in order to show how an action might be triggered from a  */}
      <button onClick={insertRandom}>test</button>
    </>
  );
}
