// import { UUID } from "crypto";
import {
  getCurrentUserId,
  getRagflowDatasetId,
  getOrCreateAssistant,
  getOrCreateSession,
} from "./actions";
import MessageList from "./messageList";

export type RagFlowMessage = {
  content: string;
  role: string; // change this to literal "assistant" or "user"?
};

export type RagFlowMessages = Array<RagFlowMessage>;

export default async function Home({
  params,
}: {
  params: { classroomId: number };
}) {
  const userID = await getCurrentUserId();
  const classroomID = await params.classroomId;
  const datasetID = await getRagflowDatasetId(classroomID);
  const assistantID = await getOrCreateAssistant(datasetID);
  const sessionID = await getOrCreateSession(userID, assistantID.id);
  console.log(sessionID);
  const messages: RagFlowMessages = sessionID.messages;
  // console.log(message);
  //const sessionIDResponse = getChatSession(userID, classroomID);

  return (
    <div className="p-4 dark:text-white">
      <p>
        <strong>Classroom ID:</strong> {classroomID}
      </p>
      <p>
        <strong>User ID:</strong> {userID}
      </p>
      <p>
        <strong>Ragflow Dataset ID:</strong> {datasetID}
      </p>
      <p>
        <strong>Assistant ID:</strong> {assistantID.id}
      </p>
      <p>
        <strong>Session ID:</strong> {sessionID.id}
      </p>
      <MessageList messages={messages} />
    </div>
  );
}
