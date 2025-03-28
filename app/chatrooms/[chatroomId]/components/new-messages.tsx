"use client";

import { createClient } from "@shared/utils/supabase/client";
import { Tables } from "@shared/utils/supabase/database.types";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Message extends Tables<"Messages"> {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const NewMessages = ({
  chatHistory,
  chatroomId,
}: {
  chatHistory: Message[];
  chatroomId: string;
}) => {
  const [messages, setMessages] = useState(chatHistory);

  useEffect(() => {
    const supabase = createClient();

    const room = supabase.channel(`chatroom-${chatroomId}`);

    room.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "Messages",
        filter: `chatroom_id=eq.${chatroomId}`,
      },
      async (payload) => {
        const messageRaw = payload.new as Tables<"Messages">;

        // handle LLM message
        if (messageRaw.member_id === null) {
          const llmMessage: Message = {
            ...messageRaw,
            user_id: "llm",
            full_name: "AI Assistant",
            // TODO: We might need an avatar for assitant
            avatar_url: "",
          };
          setMessages((prevMessages) => [...prevMessages, llmMessage]);
          return;
        }

        // For user messages, fetch the user details
        try {
          const { data: memberData } = await supabase
            .from("Chatroom_Members")
            .select(
              `
              *,
              Classroom_Members(
                Users(
                  id,
                  full_name,
                  avatar_url
                )
              )
            `
            )
            .eq("id", messageRaw.member_id)
            .single();

          if (memberData) {
            const message: Message = {
              ...messageRaw,
              user_id: memberData.Classroom_Members.Users.id,
              full_name: memberData.Classroom_Members.Users.full_name,
              avatar_url: memberData.Classroom_Members.Users.avatar_url,
            };

            setMessages((prevMessages) => [...prevMessages, message]);
          }
        } catch (error) {
          console.error("Error fetching message user details:", error);
        }
      }
    );

    // Subscribe to the channel
    room.subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(room);
    };
  }, [chatroomId]);

  return (
    <div className="space-y-2 p-4">
      {messages.length === 0 ? (
        <p className="text-gray-500">
          No messages yet. Start the conversation!
        </p>
      ) : (
        messages.map((message, index) => {
          const isLLM = message.user_id === "llm";

          return (
            <div
              key={message.id || index}
              className="flex items-start gap-3 rounded border p-3"
            >
              {isLLM ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-sm font-medium text-blue-600">
                  AI
                </div>
              ) : message.avatar_url ? (
                <Image
                  src={message.avatar_url}
                  alt={message.full_name || "User"}
                  referrerPolicy="no-referrer"
                  width={25}
                  height={25}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                  {message.full_name?.charAt(0) || "?"}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">
                    {isLLM
                      ? "AI Assistant"
                      : message.full_name || "Unknown User"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1">{message.content}</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default NewMessages;
