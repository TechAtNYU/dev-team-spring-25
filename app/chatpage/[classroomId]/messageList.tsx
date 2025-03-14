"use client";

import { RagFlowMessages } from "./page";

export default function MessageList({
  messages,
}: {
  messages: RagFlowMessages;
}) {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`my-2 max-w-md rounded-lg p-3 shadow-md ${
            msg.role === "assistant"
              ? "self-start bg-blue-200"
              : "self-end bg-green-200"
          }`}
        >
          <p className="font-medium text-gray-800">{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
