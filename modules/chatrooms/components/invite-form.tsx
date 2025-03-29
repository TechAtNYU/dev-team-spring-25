"use client";

import { useState } from "react";
import { inviteUserToChatroom } from "@modules/chatrooms/actions";
import { Tables } from "@shared/utils/supabase/database.types";

export default function InviteForm({
  chatrooms,
}: {
  chatrooms: Tables<"Chatrooms">[];
}) {
  console.log(chatrooms);
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsInviting(true);
    setMessage(null);

    try {
      const result = await inviteUserToChatroom(formData);
      setMessage({ type: "success", text: result.message });
      const form = document.getElementById("invite-form") as HTMLFormElement;
      form.reset();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to invite user",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-bold text-gray-700">
        Invite User to Chatroom
      </h2>

      {message && (
        <div
          className={`mb-4 rounded p-3 ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form id="invite-form" action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="chatroom_id"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Select Chatroom
          </label>
          <select
            id="chatroom_id"
            name="chatroom_id"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            required
          >
            <option value="">Select a chatroom</option>
            {chatrooms.map((chatroom) => (
              <option key={chatroom.id} value={chatroom.id}>
                {chatroom.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            User Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="user@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isInviting}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300"
        >
          {isInviting ? "Inviting..." : "Invite User"}
        </button>
      </form>
    </div>
  );
}
