"use server";
import { createServiceClient } from "@/utils/supabase/service-server";

// TODO: add complex server tasks to this area and call them from your page when necessary

// this is just a sample server-side action to show how it's done
export async function insertRandom() {
  // Notice how we use a createServiceClient instead of createClient from server
  // this BYPASSES ALL RLS in the case that you have to do some more complex things and we don't
  // want to write RLS rules for all of it. See our project doc Resources section for more info
  const supabase = createServiceClient();

  const { error } = await supabase.from("Classroom_Members").insert({
    classroom_id: 17,
    user_id: "05929f55-42bb-42d4-86bd-ddc0c7d12685",
  });
  console.log(error);
}
