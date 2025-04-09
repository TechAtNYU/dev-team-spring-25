"use client";
import { useState } from "react";
import {ChatBubble,ChatBubbleAvatar,ChatBubbleMessage} from "@shared/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@shared/components/ui/chat/chat-message-list";
import { ChatInput } from "@shared/components/ui/chat/chat-input";
import { Button } from "@/shared/components/ui/button";

import {
  ChatClientWithSession,
  RagFlowMessage,
  RagFlowMessages,
  sendMessage,
} from "@shared/lib/ragflow/chat/chat-client";
import { toast } from "@shared/hooks/use-toast";
import LogoComponent from "@/shared/components/Logo";
import { SendIcon } from "lucide-react";

interface MessageBoxProps {
  chatClient: ChatClientWithSession;
  messageHistory: RagFlowMessages | null;
}

export default function MessageBox({ chatClient, messageHistory }: MessageBoxProps) {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<RagFlowMessages>(messageHistory || []);
  const [isLoading, setIsLoading] = useState(false); 

  async function handleSend() {
    if (!value.trim()) return;

    const userMessage: RagFlowMessage = { role: "user", content: value };
    setMessages((prev) => [...prev, userMessage]);
    setValue("");
    setIsLoading(true);
    const response = await sendMessage(chatClient, value);
    setIsLoading(false);

    if (!response.ragflowCallSuccess) {
      toast({
        title: "Error sending message",
        description: "Please try refreshing the page",
        duration: 10000,
        variant: "destructive",
      });
      return;
    }

    const assistantMessage: RagFlowMessage = {
      role: "assistant",
      content: response.response,
    };
    setMessages((prev) => [...prev, assistantMessage]);
  }

  return (
    <div className="w-11/12 place-self-center h-[600px] flex flex-col p-4 text-gray-800 dark:text-white border rounded shadow">
      <LogoComponent className={"place-self-center size-24 stroke-black stroke-[10px]"}/>
      {/* doesn't seem like 400 px does much */}
      <div className="flex-1 h-[400px] overflow-auto">
        <ChatMessageList smooth>
          {messages.map((msg, index) => (
            <ChatBubble
              key={index}
              variant={msg.role === "assistant" ? "received" : "sent"}
            >
              {msg.role === "assistant" ? (
                <ChatBubbleAvatar fallback="AI" />
              ) : (
                <ChatBubbleAvatar fallback="Me" />
              )}
              <ChatBubbleMessage variant={msg.role === "assistant" ? "received" : "sent"} className="p-2">
                {msg.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar fallback="AI" />
              <ChatBubbleMessage isLoading variant="received" />
            </ChatBubble>
          )}
        </ChatMessageList>
      </div>
      <div className="relative mt-4">
        <ChatInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your message..."
        />
        <Button
          onClick={handleSend}
          size="default"
          
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          Send <SendIcon/>
        </Button>
      </div>
    </div>
  );
}