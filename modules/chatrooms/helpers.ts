import { createClient } from "@shared/utils/supabase/server";
import { createServiceClient } from "@shared/utils/supabase/service-server";

// TODO: these helpers should probably be combined with the actions in /chat

const API_URL = process.env.RAGFLOW_API_URL + "/api" || "";
const API_KEY = process.env.RAGFLOW_API_KEY;

export const findChatAssitantAndUpdate = async (
  datasetId: string | null,
  chatroomId: string,
  classroomId: number
) => {
  if (!datasetId) {
    return null;
  }
  const name = `${datasetId}-${chatroomId}`;

  console.log("Finding existing assitant on ragflow");

  try {
    const res = await fetch(`${API_URL}/v1/chats?name=${name}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    if (!res.ok) throw new Error("Failed to find chat assistant");

    const resJson = await res.json();

    if (resJson.code !== 0) {
      return null;
    }

    const data = resJson.data[0].id;

    // update assistant on supabase
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("Classrooms")
      .update({ chatroom_assistant_id: data })
      .eq("id", classroomId);

    if (error) {
      throw new Error(`Failed to update classroom: ${error}`);
    }

    return data;
  } catch (error) {
    console.error("Error finding chat assistant:", error);
    return null;
  }
};

export const findChatAssistant = async (
  classroomId: number,
  chatroomId: string
) => {
  try {
    const supabase = await createClient();

    const res = await supabase
      .from("Classrooms")
      .select("chatroom_assistant_id, ragflow_dataset_id")
      .eq("id", classroomId)
      .single();

    if (res.error) throw new Error(`Failed to fetch chats: ${res.error}`);

    const data =
      res.data.chatroom_assistant_id ||
      (await findChatAssitantAndUpdate(
        res.data.ragflow_dataset_id,
        chatroomId,
        classroomId
      ));

    // console.log(data);

    return data;
  } catch (error) {
    console.error("Error fetching chat assistant:", error);
    return null;
  }
};

export const createChatAssistant = async (
  chatroomId: string,
  classroomId: number,
  datasetId: string
) => {
  const newAssistant = {
    dataset_ids: [datasetId],
    name: `${datasetId}-${chatroomId}`,
    llm: {
      frequency_penalty: 0.7,
      presence_penalty: 0.4,
      temperature: 0.1,
      top_p: 0.3,
    },
    prompt: {
      prompt: `You are an advanced language model named 'Classroom LM' participating in a collaborative chat with a group of users. Your primary goal is to assist students with factual, well-structured answers based on the knowledge base provided. If the knowledge base has relevant content, use it to generate responses. If not, provide the best possible answer based on your general understanding. 

In addition to answering questions, you can **generate exam materials** when requested. This includes:

- **Multiple-choice questions** (4 options each, one correct)
- **Short answer questions**
- **Essay prompts for critical thinking**
- **Problem-solving exercises (for STEM)**
- **True/False questions with explanations**

You will be given the chat history before your last response (if any), including messages in JSON format from the user(s). Use this history to understand the context and generate a helpful response to the users.

**Instructions**:
- Carefully review the chat history to understand the context of the conversation.
- Focus on the latest message marked with \`"is_ask": true\` and generate a response that aligns with the ongoing discussion.
- Ensure your response is clear, concise, and helpful to the group.
- If the question is ambiguous or lacks sufficient context, politely ask for clarification.
- If your response needs to reference a specific message in the chat history, address the user by their \`full_name\`.
- Correct any factual errors or misunderstandings in the conversation about the topic, using the knowledge base provided. Reference the specific message where the error occurred, if applicable.
- Clearly indicate whether your response is based on retrieval from the knowledge base or your general understanding.

**Knowledge Base:**
{knowledge}`,
      empty_response: "",
      variables: [{ key: "knowledge", optional: true }],
      keywords_similarity_weight: 0.75,
      similarity_threshold: 0.2,
      top_n: 6,
      show_quote: true,
    },
  };

  try {
    const res = await fetch(`${API_URL}/v1/chats`, {
      method: "POST",
      body: JSON.stringify(newAssistant),
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    if (!res.ok) throw new Error("Failed to create chat assistant");

    const resJson = await res.json();

    if (!resJson?.data) {
      return null;
    }

    // update that in supabase
    const supabase = await createClient();

    const supabaseRes = await supabase
      .from("Classrooms")
      .update({ chatroom_assistant_id: resJson.data.id })
      .eq("id", classroomId)
      .select();

    if (supabaseRes.error) {
      throw new Error(`Failed to update classroom: ${supabaseRes.error}`);
    }

    return resJson;
  } catch (error) {
    console.error("Error creating chat assistant:", error);
    return null;
  }
};

export const getOrCreateAssistant = async (
  chatroomId: string,
  datasetId: string,
  classroomId: number
) => {
  const existingChat = await findChatAssistant(classroomId, chatroomId);
  if (existingChat) {
    return { id: existingChat };
  }

  console.log("Get or create: didn't find an assistant, creating a new one");

  const newAssistant = await createChatAssistant(
    chatroomId,
    classroomId,
    datasetId
  );

  return { id: newAssistant?.data.id || null };
};

export const findSessionID = async (
  classroomId: number,
  chatroomId: string
) => {
  try {
    const supabase = await createClient();

    const sessionID = await supabase
      .from("Chatrooms")
      .select("ragflow_session_id")
      .eq("classroom_id", classroomId)
      .eq("id", chatroomId)
      .single();

    if (sessionID.error) {
      console.error("Error fetching session:", sessionID.error);
      return null;
    }

    return sessionID.data.ragflow_session_id;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
};

async function createSession(
  assistantID: string,
  chatroomId: string,
  classroomId: number
) {
  const newSession = {
    assistant_id: assistantID,
    user_id: chatroomId,
    name: `Session_Chatroom_${chatroomId}`,
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

    const resJson = await res.json();

    console.log(resJson);

    // update that in supabase
    const supabase = createServiceClient();

    const supabaseRes = await supabase
      .from("Chatrooms")
      .update({ ragflow_session_id: resJson.data.id })
      .eq("classroom_id", classroomId)
      .eq("id", chatroomId)
      .select();

    if (supabaseRes.error) {
      throw new Error(`Failed to update classroom: ${supabaseRes.error}`);
    }

    return resJson.data.id;
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
}

export const getOrCreateSession = async (
  chatroomId: string,
  chatAssistantId: string,
  classroomId: number
) => {
  const existingSession = await findSessionID(classroomId, chatroomId);
  console.log("Found an existing session:", existingSession);
  if (existingSession) {
    return existingSession;
  }

  return await createSession(chatAssistantId, chatroomId, classroomId);
};

export const deleteSession = async (
  chatroomId: string,
  assistantId: string
) => {
  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("Chatrooms")
    .select("ragflow_session_id")
    .eq("id", chatroomId)
    .single();

  if (sessionError) {
    throw new Error("Error fetching session id");
  }

  const body = {
    ids: [session.ragflow_session_id],
  };

  try {
    const res = await fetch(`${API_URL}/v1/chats/${assistantId}/sessions`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to delete session");

    const resJson = await res.json();
    console.log(resJson);
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
};

export const llmToChatroom = async (chatroomId: string, message: string) => {
  const supabase = await createClient();

  const { error } = await supabase.from("Messages").insert([
    {
      chatroom_id: chatroomId,
      content: message,
      is_new: false,
    },
  ]);

  if (error) {
    throw new Error("Error when sending message from LLM");
  }
};
