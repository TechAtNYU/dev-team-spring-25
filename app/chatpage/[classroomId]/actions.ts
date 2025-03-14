"use server";

import { createClient } from "@/utils/supabase/server";
// import { UUID } from "crypto";

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

export async function getRagflowDatasetId(classroomId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Classroom")
    .select("ragflow_dataset_id")
    .eq("id", classroomId)
    .single();

  if (error) {
    console.error("Error fetching classroom:", error);
    throw new Error(`Failed to fetch classroom: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No classroom found with id: ${classroomId}`);
  }

  return data.ragflow_dataset_id;
}

const API_URL = process.env.RAGFLOW_API_URL + "/api" || "";
const API_KEY = process.env.RAGFLOW_API_KEY;

export async function getOrCreateAssistant(datasetId: string) {
  const existingChat = await findChatAssistant(datasetId);
  if (existingChat) {
    return existingChat;
  }

  return await createChatAssistant(datasetId);
}

async function findChatAssistant(datasetId: string) {
  try {
    const res = await fetch(
      `${API_URL}/v1/chats?page=1&page_size=10&orderby=create_time&desc=true&name=${datasetId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`Failed to fetch chats: ${res.statusText}`);

    const data = await res.json();

    if (data.code === 102) {
      console.warn("No chat assistant found for dataset:", datasetId);
      return null;
    }

    return data.data?.length ? data.data[0] : null;
  } catch (error) {
    console.error("Error fetching chat assistant:", error);
    return null;
  }
}

async function createChatAssistant(datasetId: string) {
  const newAssistant = {
    dataset_ids: [datasetId],
    name: `${datasetId}`,
  };

  try {
    const res = await fetch(`${API_URL}/v1/chats`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAssistant),
    });

    if (!res.ok) throw new Error("Failed to create chat assistant");

    //console.log(res);
    return await res.json();
  } catch (error) {
    console.error("Error creating chat assistant:", error);
    return null;
  }
}

export async function getOrCreateSession(userID: string, assistantID: string) {
  const existingSession = await findSessionID(assistantID, userID);
  //console.log(existingSession);
  if (existingSession) {
    return existingSession;
  }

  return await createSession(assistantID, userID);
}

async function findSessionID(assistantID: string, userID: string) {
  try {
    const res = await fetch(
      `${API_URL}/v1/chats/${assistantID}/sessions?page=1&page_size=10&orderby=create_time&desc=true&user_id=${userID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);

    const data = await res.json();

    if (data.code === 102 || !data.data?.length) {
      console.warn(
        `No session found for assistant ${assistantID} and user ${userID}`
      );
      return null;
    }

    return data.data[0]; // Return the first session if available
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

async function createSession(assistantID: string, userID: string) {
  const newSession = {
    assistant_id: assistantID,
    user_id: userID,
    name: `Session_${userID}`,
  };

  try {
    const res = await fetch(`${API_URL}/v1/chats/${assistantID}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newSession),
    });

    if (!res.ok) throw new Error("Failed to create session");

    return await res.json();
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
}
