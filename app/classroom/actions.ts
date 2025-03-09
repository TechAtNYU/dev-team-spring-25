// actions.ts
"use server";
//import { createServiceClient } from "@/utils/supabase/service-server";
import { createClient } from "@/utils/supabase/server";

export async function getUserClassrooms() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("Classroom").select(`
      id,
      ragflow_dataset_id,
      Classroom_Members (
        id,
        user_id
      )
    `);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}
