"use server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service-server";

export async function newClassroom(name: string, id: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("Classrooms")
    .insert([{ name: name, admin_user_id: id }])
    .select("id");

  if (error) {
    console.error("Error inserting classroom:", error);
    return null;
  }

  // add yourself to member list
  if (data && data.length > 0) {
    const classroomId = data[0].id;
    console.log("Classroom ID:", classroomId);
    const { error } = await supabase
      .from("Classroom_Members")
      .insert([{ classroom_id: classroomId, user_id: id }])
      .select();

    if (error) {
      console.error("Error inserting admin to classroom member list:", error);
      return null;
    }
  }

  return data;
}

export async function getCurrentUserId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw Error("No authenticated user found");
  }
  return user.id;
}
