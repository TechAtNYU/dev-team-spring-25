"use client";

import { createClient } from "@/utils/supabase/client";
import { Tables } from "@/utils/supabase/database.types";
import { useEffect, useState } from "react";

const supabase = createClient();

const NewMessages = ({
  chatHistory,
  chatroomId,
}: {
  chatHistory: Tables<"Messages">[];
  chatroomId: string;
}) => {
  const [messages, setMessages] = useState(chatHistory);

  useEffect(() => {
    const fetchMemberIds = async () => {
      const { data: members } = await supabase
        .from("Chatroom_Members")
        .select("id")
        .eq("chatroom_id", chatroomId);

      return members?.map((member) => member.id) || [];
    };

    fetchMemberIds().then((memberIds) => {
      const room = supabase.channel(`chatroom-${chatroomId}`);
      memberIds.forEach((memberId) => {
        room.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Messages",
            filter: `member_id=eq.${memberId}`,
          },
          (payload) => {
            const message = payload.new as Tables<"Messages">;
            setMessages((prevMessages) => [...prevMessages, message]);
          }
        );
      });

      room.subscribe();

      return () => {
        supabase.removeChannel(room);
      };
    });
  }, [chatroomId]);

  return (
    <div className="space-y-2 p-4">
      {messages.length === 0 ? (
        <p className="text-gray-500">
          No messages yet. Start the conversation!
        </p>
      ) : (
        messages.map((message, index) => {
          const userId = message.member_id;

          return (
            <div key={message.id || index} className="rounded border p-2">
              <div className="font-bold">{userId}</div>
              <div>{message.content}</div>
              <div className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleString()}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default NewMessages;
