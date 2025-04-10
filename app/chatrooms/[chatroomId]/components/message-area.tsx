"use client";

import { ChatClientWithSession } from "@shared/lib/ragflow/chat/chat-client";
import { UserContext } from "@shared/lib/userContext/userContext";
import { Skeleton } from "@shared/components/ui/skeleton";
import { createClient } from "@shared/utils/supabase/client";
import { Database, Tables } from "@shared/utils/supabase/database.types";
import { useContext, useEffect, useState } from "react";
import { askLLM } from "../../actions";
import { createBrowserClient } from "@supabase/ssr";
import config from "../../config";
import { ChatMessageList } from "@/shared/components/ui/chat/chat-message-list";
import { ChatInput } from "@/shared/components/ui/chat/chat-input";
import { Button } from "@/shared/components/ui/button";
import { SendIcon } from "lucide-react";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/shared/components/ui/chat/chat-bubble";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message extends Tables<"Messages"> {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

type ChatroomMemberRecord = {
  chatroom_id: string;
  created_at: string;
  id: number;
  is_active: boolean;
  member_id: number;
  Classroom_Members: {
    id: number;
    user_id: string;
    classroom_id: number;
    Users: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
};

const MessageArea = ({
  chatHistory,
  chatroomId,
  chatroomMemberRecord,
  supabaseClientUrl,
  supabaseClientKey,
}: {
  chatHistory: Message[];
  chatroomId: string;
  chatroomMemberRecord: ChatroomMemberRecord;
  supabaseClientUrl: string;
  supabaseClientKey: string;
}) => {
  const [messages, setMessages] = useState(chatHistory);
  const [chatClient, setChatClient] = useState<ChatClientWithSession | null>(
    null
  );
  const [messageBoxValue, setMessageBoxValue] = useState("");

  // add database changes to messages state
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      supabaseClientUrl,
      supabaseClientKey
    );
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
            user_id: config.llmId,
            full_name: config.llmName,
            // TODO: We might need an avatar for assitant
            avatar_url: config.llmAvatar,
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
  }, [chatroomId, supabaseClientKey, supabaseClientUrl]);

  // TODO: get all avatars/user info from here at the beginning using the context instead of every message
  const userContext = useContext(UserContext);
  // // If the userContext is undefined still, give loading visual
  if (!userContext) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  // // get the data and setter from the context (these are just a regular useState, so treat them like that)
  const { userAndClassData } = userContext;
  //  const userId = userAndClassData.userData.id;

  const classroomInfo = userAndClassData.classroomsData.find(
    (x) => x.id === chatroomMemberRecord.Classroom_Members.classroom_id
  );
  if (!classroomInfo) {
    console.log(
      "Error rendering chatroom page, member of chatroom but didn't find information about the underlying classroom"
    );
    return (
      // TODO: make 404 page since this is a classroom not found
      <h1> 404 </h1>
    );
  }

  // Send the message directly from the browser, and also tell the server action if an LLM is involved
  const sendMessageToChatroom = async () => {
    const supabase = createClient();
    let content = messageBoxValue;
    const isAskCommand = content.startsWith("/ask ");
    if (isAskCommand) {
      content = content.substring(5).trim();
    }

    if (!content) {
      console.log("Message should not be empty");
      setMessageBoxValue("");
      return null;
    }

    // Insert the message
    const { error: messageError } = await supabase.from("Messages").insert([
      {
        content,
        member_id: chatroomMemberRecord.id,
        chatroom_id: chatroomId,
        is_ask: isAskCommand,
      },
    ]);

    if (messageError) {
      toast.error("Error sending message to chatroom", {
        description: "Please refresh and try again",
      });
      setMessageBoxValue("");
      return;
    }

    setMessageBoxValue("");

    // Handle user "/ask" command
    if (isAskCommand) {
      const askResult = await askLLM(classroomInfo, chatroomId, chatClient);
      if (!askResult.clientCreationSuccess) {
        if (!askResult.failedBecauseEmptyDataset) {
          // TODO: ask result has more detailed error differntiations if we want to tell the user
          toast.error("Error sending communicating with LLM", {
            description: "Please refresh and try again",
          });
          setChatClient(null); // In case client is bad, clear it out
          setMessageBoxValue("");
          return;
        }
      }
      setChatClient(askResult.client);
    }
  };

  function cleanMessage(content: string): string {
    // Remove any reference patterns like ##number$$
    return content.replace(/##\d+\$\$/g, "").trim();
  }

  return (
    <div className="mt-10 flex w-11/12 flex-col place-self-center rounded border p-4 text-gray-800 shadow dark:text-white">
      <ChatMessageList>
        {messages.map((message) => {
          const variant =
            message.user_id === userAndClassData.userData.id
              ? "sent"
              : "received";

          return (
            <ChatBubble key={message.id} variant={variant}>
              <ChatBubbleAvatar src={message.avatar_url!} fallback="AI" />
              <ChatBubbleMessage className="prose">
                <ReactMarkdown>{cleanMessage(message.content)}</ReactMarkdown>
              </ChatBubbleMessage>
            </ChatBubble>
          );
        })}
      </ChatMessageList>
      <div className="relative mt-4 flex items-center justify-between gap-2 rounded-lg border bg-background p-1">
        <ChatInput
          value={messageBoxValue}
          onChange={(e) => setMessageBoxValue(e.target.value)}
          placeholder="Type your message..."
          className="focus-visible:ringof min-h-10 resize-none border-0 bg-background shadow-none focus-visible:ring-0"
        />
        <Button
          onClick={sendMessageToChatroom}
          size="sm"
          className="ml-auto mr-3"
        >
          Send <SendIcon />
        </Button>
      </div>
    </div>
  );
};

export default MessageArea;
