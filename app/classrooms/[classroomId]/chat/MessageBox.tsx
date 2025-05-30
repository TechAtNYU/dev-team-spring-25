"use client";
import { useState } from "react";
import {
  AIAvatar,
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@shared/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@shared/components/ui/chat/chat-message-list";
import { ChatInput } from "@shared/components/ui/chat/chat-input";
import { Button } from "@/shared/components/ui/button";
import {
  ChatClientWithSession,
  RagFlowMessage,
  RagFlowMessages,
  sendMessage,
} from "@shared/lib/ragflow/chat/chat-client";
import { toast } from "sonner";
import Logo from "@/shared/components/Logo";
import { SendIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

interface MessageBoxProps {
  chatClient: ChatClientWithSession;
  messageHistory: RagFlowMessages | null;
}

export default function MessageBox({
  chatClient,
  messageHistory,
}: MessageBoxProps) {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<RagFlowMessages>(
    messageHistory || []
  );
  const [isLoading, setIsLoading] = useState(false);

  function cleanMessage(content: string): string {
    return content.replace(/\s##\d+\$\$/g, "").trim();
  }

  async function handleSend() {
    if (!value.trim()) return;

    const userMessage: RagFlowMessage = { role: "user", content: value };
    setMessages((prev) => [...prev, userMessage]);
    setValue("");
    setIsLoading(true);
    const response = await sendMessage(chatClient, value);
    setIsLoading(false);

    if (!response.ragflowCallSuccess) {
      toast.error("Error sending message", {
        description: `Please try refreshing the page`,
        duration: 10000,
      });
      return;
    }

    const assistantMessage: RagFlowMessage = {
      role: "assistant",
      content: response.response,
      created_at: response.responseTimeSeconds,
    };
    setMessages((prev) => [...prev, assistantMessage]);
  }
  // console.log(messages);
  return (
    <div className="mt-3 flex min-h-[400px] w-11/12 flex-1 flex-col place-self-center rounded border bg-background/95 p-4 text-gray-800 shadow dark:text-white max-[500px]:w-full">
      <Logo
        className={
          "size-[6vmin] h-fit min-w-10 place-self-center fill-foreground stroke-foreground stroke-[10px]"
        }
      />
      <div className="flex-1 overflow-auto">
        <ChatMessageList smooth className="max-[500px]:px-0">
          {messages.map((msg, index) => (
            <ChatBubble
              key={index}
              variant={msg.role === "assistant" ? "received" : "sent"}
              className="max-w-[80%]"
            >
              {msg.role === "assistant" ? (
                <AIAvatar />
              ) : (
                <ChatBubbleAvatar fallback="Me" />
              )}
              <div className="flex flex-col">
                <span className="mx-2">
                  {msg?.created_at &&
                    getTimeDate(msg.created_at) &&
                    getTimeDate(msg.created_at)}
                </span>

                <ChatBubbleMessage
                  variant={msg.role === "assistant" ? "received" : "sent"}
                  className="prose w-fit max-w-[50vw] !whitespace-normal p-2 font-medium marker:text-inherit"
                >
                  <ReactMarkdown
                    remarkPlugins={[
                      [remarkMath, { singleDollarTextMath: false }],
                    ]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {cleanMessage(msg.content)}
                  </ReactMarkdown>
                </ChatBubbleMessage>
              </div>
            </ChatBubble>
          ))}
          {isLoading && (
            <ChatBubble variant="received">
              <AIAvatar />
              <ChatBubbleMessage isLoading variant="received" />
            </ChatBubble>
          )}
        </ChatMessageList>
      </div>
      <div className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background p-1">
        <ChatInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your message..."
          onEnter={handleSend}
          className="focus-visible:ringof min-h-10 resize-none border-0 bg-background shadow-none focus-visible:ring-0"
        />
        <Button onClick={handleSend} size="sm" className="ml-auto mr-3">
          Send <SendIcon />
        </Button>
      </div>
    </div>
  );
}

function getTimeDate(created_at_seconds: number) {
  return new Date(created_at_seconds * 1000).toLocaleTimeString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

// function escapeLatex(message: string){
//   return message.replace("$","\\$").replace("\\\\(", "$").replace("\\\\)", "$").replace("\\$\\$","$$")
// }
