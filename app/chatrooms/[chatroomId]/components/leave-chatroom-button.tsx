"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveChatroom } from "@/app/chatrooms/actions";

export default function LeaveChatroomButton({
  chatroomId,
}: {
  chatroomId: string;
}) {
  const [isLeaving, setIsLeaving] = useState(false);
  const router = useRouter();

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave this chatroom?")) {
      setIsLeaving(true);
      try {
        await leaveChatroom(chatroomId);
        router.push("/chatrooms");
      } catch (error) {
        console.error("Error leaving chatroom:", error);
        alert("Failed to leave chatroom. Please try again.");
      } finally {
        setIsLeaving(false);
      }
    }
  };

  return (
    <button
      onClick={handleLeave}
      disabled={isLeaving}
      className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:bg-gray-400"
    >
      {isLeaving ? "Leaving..." : "Leave Chatroom"}
    </button>
  );
}
