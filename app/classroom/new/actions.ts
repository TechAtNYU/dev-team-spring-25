"use server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service-server";

// const RAGFLOW_SERVER_URL = process.env.RAGFLOW_API_URL || "";
// const RAGFLOW_API_KEY = process.env.RAGFLOW_API_KEY;

export async function newClassroom(name: string, id: string) {
  //Create a new RAGFlow dataset
  // const timestamp = Date.now();
  // const ragflowName = name + " " + timestamp + " " + id.substring(0, 6);
  // const ragflowResponse = await fetch(`${RAGFLOW_SERVER_URL}/api/v1/datasets`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${RAGFLOW_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     name: ragflowName,
  //   }),
  // });

  // if (!ragflowResponse.ok) {
  //   const error = await ragflowResponse.json();
  //   console.error("Error creating dataset in RAGFlow:", error);
  //   return null;
  // }

  // const ragflowData = await ragflowResponse.json();
  // console.log(ragflowData);
  // const ragflowDatasetId = ragflowData.data.id;

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("Classrooms")
    .insert([
      {
        // ragflow_dataset_id: ragflowDatasetId, #??? TODO:: see if its okay that we moved this to uploading
        name: name,
        admin_user_id: id,
        archived: false,
      },
    ])
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
