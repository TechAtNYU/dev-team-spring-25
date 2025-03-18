"use server";
import { createServiceClient } from "@/utils/supabase/service-server";
import { createClient } from "@/utils/supabase/server";

const RAGFLOW_API_KEY: string = process.env.RAGFLOW_API_KEY || "";
const RAGFLOW_SERVER_URL: string = "https://ragflow.dev.techatnyu.org";

// TODO: add complex server tasks to this area and call them from your page when necessary

// this is just a sample server-side action to show how it's done
// export async function insertRandom() {
//   // Notice how we use a createServiceClient instead of createClient from server
//   // this BYPASSES ALL RLS in the case that you have to do some more complex things and we don't
//   // want to write RLS rules for all of it. See our project doc Resources section for more info
//   const supabase = createServiceClient();

//   const { error } = await supabase.from("Classroom_Members").insert({
//     classroom_id: 17,
//     user_id: "05929f55-42bb-42d4-86bd-ddc0c7d12685",
//   });
//   console.log(error);
// }

// export async function getCurrentUserID2() {
//   const supabase = createServiceClient();

//   const { data: { user } } = await supabase.auth.getUser()

//   // // Get the current user using the updated method
//   // const { data: user, error } = await supabase.auth.getUser();

//   // if (error) {
//   //   throw new Error(error.message);
//   // }

//   // if (!user) {
//   //   throw new Error("No user is logged in");
//   // }

//   // return user.id; // Return the current user's ID
// }
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

// export async function getCurrentUserID() {
//   const supabase = await createClient();
//   const { data, error } = await supabase.from("Classroom").select(`
//       id,
//       ragflow_dataset_id,
//       Classroom_Members (
//         id,
//         user_id
//       )
//     `);
//   if (error) {
//     throw new Error(error.message);
//   }
//   return data || [];
// }

export async function deleteClassroom(classroom_id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Classroom")
    .delete()
    .eq("id", classroom_id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  const ragflow_dataset_id = data[0].ragflow_dataset_id;
  console.log("RAGFLOW ID:" + ragflow_dataset_id);

  if (!ragflow_dataset_id) {
    throw new Error("No related dataset found for this classroom.");
  }

  //gets ids of ragflow_dataset_id
  const requestBody = {
    ids: [ragflow_dataset_id],
  };

  //deletes the respective dataset
  const ragflowResponse = await fetch(`${RAGFLOW_SERVER_URL}/api/v1/datasets`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RAGFLOW_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!ragflowResponse.ok) {
    throw new Error(
      `Failed to delete dataset from Ragflow: ${ragflowResponse.statusText}`
    );
  }

  return data || [];
}

export async function leaveClassroom(classroom_id: number, user_id: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("Classroom_Members")
    .delete()
    .eq("classroom_id", classroom_id)
    .eq("user_id", user_id);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

// export async function getClassroomAdminID(classroom_id: number) {
//   const supabase = await createClient();
//   const { data, error } = await supabase
//     .from("Classroom")
//     .select("admin_user_id")
//     .eq("id", classroom_id);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data[0]?.admin_user_id || null;
// }

export async function getUserClassrooms() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("Classroom").select();
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function retrieveClassroomData(userId: string) {
  const classrooms = await getUserClassrooms();

  // if (!classrooms || classrooms.length === 0) {
  //   return;
  // }

  const validAdminClasses = classrooms.filter(
    (classroom) => classroom.admin_user_id == userId
  );

  const validNonAdminClasses = classrooms.filter(
    (classroom) => classroom.admin_user_id != userId
  );

  return { validAdminClasses, validNonAdminClasses };
}

export async function inviteMemberToClassroom(
  email: string,
  classroom_id: number
) {
  const supabase = createServiceClient();

  const { data: users, error: userError } = await supabase
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();

  if (userError || !users) {
    throw new Error("User does not exist");
  }

  //checks for duplicate
  const { data: member } = await supabase
    .from("Classroom_Members")
    .select("id")
    .eq("classroom_id", classroom_id)
    .eq("user_id", users.id);

  if (member && member.length > 0) {
    throw new Error("User already in the classroom");
  }

  //insert if no errors
  const { error: insertError } = await supabase
    .from("Classroom_Members")
    .insert({
      classroom_id: classroom_id,
      user_id: users.id,
    });

  if (insertError) {
    throw new Error("Error inserting classroom member");
  }
  return true;
}
