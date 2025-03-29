"use server";
import { createServiceClient } from "@shared/utils/supabase/service-server";
import { createClient } from "@shared/utils/supabase/server";
import { Tables } from "@shared/utils/supabase/database.types";
import { deleteDataset } from "@shared/lib/ragflow/dataset-client";

export interface ClassroomWithMembers extends Tables<"Classrooms"> {
  Classroom_Members?: Array<{
    id: number;
    classroom_id: number;
    Users: {
      id: string;
      email: string;
      full_name: string;
      avatar_url: string;
    };
  }>;
}
const RAGFLOW_SERVER_URL = process.env.RAGFLOW_API_URL || "";
const RAGFLOW_API_KEY = process.env.RAGFLOW_API_KEY;

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

export async function deleteClassroom(classroom_id: number) {
  // Deleting Associated Supabase
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Classrooms")
    .delete()
    .eq("id", classroom_id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Deleting Associated Chat Assistant
  const chat_assistant_id = data.chat_assistant_id;

  if (chat_assistant_id) {
    const requestChatBody = {
      ids: [chat_assistant_id],
    };

    const chatResponse = await fetch(`${RAGFLOW_SERVER_URL}/api/v1/chats`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RAGFLOW_API_KEY}`,
      },
      body: JSON.stringify(requestChatBody),
    });

    if (!chatResponse.ok) {
      throw new Error(
        `Failed while deleting assistant from Ragflow: ${chatResponse.statusText}`
      );
    }
  } else {
    // If no chat assistant, we don't want to error out
    console.log("No chat assistant found for classroom when deleting");
  }

  // Deleting associated RAGFlow dataset if exists
  if (data.ragflow_dataset_id) {
    deleteDataset(data.id.toString(), data.ragflow_dataset_id);
  }
  // const ragflow_dataset_id = data.ragflow_dataset_id;

  // if (!ragflow_dataset_id) {
  //   throw new Error("No related RAGFlow dataset found for this classroom.");
  // }

  // //gets ids of ragflow_dataset_id
  // const requestBody = {
  //   ids: [ragflow_dataset_id],
  // };

  // //deletes the respective dataset
  // const ragflowResponse = await fetch(`${RAGFLOW_SERVER_URL}/api/v1/datasets`, {
  //   method: "DELETE",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${RAGFLOW_API_KEY}`,
  //   },
  //   body: JSON.stringify(requestBody),
  // });

  // if (!ragflowResponse.ok) {
  //   throw new Error(
  //     `Failed to delete dataset from Ragflow: ${ragflowResponse.statusText}`
  //   );
  // }

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
//     .from("Classrooms")
//     .select("admin_user_id")
//     .eq("id", classroom_id);

//   if (error) {
//     throw new Error(error.message);
//   }

//   return data[0]?.admin_user_id || null;
// }

export async function getUserClassrooms() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("Classrooms").select(`
      *,
      Classroom_Members (
        id,
        classroom_id,
        Users (
          id, 
          email,
          full_name,
          avatar_url
        )
      )
    `);
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

export async function changeClassroomName(
  classroom_id: number,
  newName: string
) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("Classrooms")
    .update({ name: newName })
    .eq("id", classroom_id)
    .select();

  if (error) {
    console.log("Error changing name");
  }

  //console.log(data[0].name);
  return data;
}

export async function archiveClassroom(classroom_id: number) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("Classrooms")
    .update({ archived: true })
    .eq("id", classroom_id)
    .select();

  if (error) {
    console.error("Error archiving classroom:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function unarchiveClassroom(classroom_id: number) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("Classrooms")
    .update({ archived: false })
    .eq("id", classroom_id)
    .select();

  if (error) {
    console.error("Error unarchiving classroom:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
