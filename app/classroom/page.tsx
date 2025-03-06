// import { signInWithGoogle } from "../auth/actions";
import { createClient } from "@/utils/supabase/server"; // notice how it uses the server one since we don't have "useclient" so the default is server side component
import { insertRandom } from "./actions";

export default async function ClassroomPage() {
  //TODO: this is where you do the assigned Classroom tasks (with maybe some things being moved to the actions.ts)
  const supabase = await createClient();
  const { data } = await supabase.from("Classroom").select();
  if (!data) {
    return <div>No data!</div>;
  }

  return (
    <>
      <div>
        {data.map((x) => {
          return <div key={x.id}>{x.id}</div>;
        })}
      </div>
      <button className={"border-2 border-solid"} onClick={insertRandom}>
        insert test
      </button>
    </>
  );
}
