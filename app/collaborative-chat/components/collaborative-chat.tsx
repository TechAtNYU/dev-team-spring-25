"use client";

import type React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { Send } from "lucide-react";
import styles from "./collaborative-chat.module.css";

// Define message type
interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

// Generate a random user ID for this session
const currentUser = `user_${Math.random().toString(36).substring(2, 8)}`;

let socket: Socket;

const CollaborativeChat: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      try {
        // 1. Call /api/socket to ensure the Socket.IO server is initialized
        await fetch("/api/socket");

        // 2. Connect to the separate Socket.IO server on port 3001
        socket = io("http://localhost:3001");

        socket.on("connect", () => {
          setIsConnected(true);
          setIsConnecting(false);

          // Request chat history when connected
          socket.emit("getHistory");
        });

        socket.on("disconnect", () => {
          setIsConnected(false);
        });

        // Listen for chat history from the server
        socket.on("chatHistory", (history: string[]) => {
          const formattedHistory = history.map((msg) => {
            const [sender, text] = msg.split(": ");
            return {
              id: `history_${Math.random().toString(36).substring(2, 9)}`,
              text: text || msg,
              sender: sender !== text ? sender : "Unknown",
              timestamp: new Date(), // We don't have the actual timestamp, so use current time
              isCurrentUser: sender === currentUser,
            };
          });

          setMessages(formattedHistory);
        });

        // Listen for broadcast messages from the server
        socket.on("message", (msg: string) => {
          // Parse the message to determine if it's from the current user
          const [sender, text] = msg.split(": ");

          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              text: text || msg, // If no sender format, use the whole message
              sender: sender !== text ? sender : "Unknown",
              timestamp: new Date(),
              isCurrentUser: sender === currentUser,
            },
          ]);
        });
      } catch (error) {
        console.error("Socket connection error:", error);
        setIsConnecting(false);
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      socket?.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const formattedMessage = `${currentUser}: ${message}`;
      socket.emit("message", formattedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp to a readable format
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <h2 className={styles.cardTitle}>Collaborative Chat</h2>
          <span
            className={
              isConnected ? styles.badgeConnected : styles.badgeDisconnected
            }
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.messageContainer}>
          {isConnecting ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <span className={styles.loadingText}>
                Connecting to chat server...
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No messages yet. Be the first to send a message!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.messageRow} ${
                    msg.isCurrentUser
                      ? styles.messageRowRight
                      : styles.messageRowLeft
                  }`}
                >
                  <div
                    className={`${styles.messageGroup} ${
                      msg.isCurrentUser
                        ? styles.messageGroupRight
                        : styles.messageGroupLeft
                    }`}
                  >
                    <div
                      className={`${styles.avatar} ${msg.isCurrentUser ? styles.avatarRight : styles.avatarLeft}`}
                    >
                      {msg.sender.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.messageInfo}>
                        <span className={styles.senderName}>
                          {msg.isCurrentUser ? "You" : msg.sender}
                        </span>
                        <span className={styles.timestamp}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`${styles.messageBubble} ${
                          msg.isCurrentUser
                            ? styles.messageBubbleSent
                            : styles.messageBubbleReceived
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div className={styles.separator}></div>

      <div className={styles.cardFooter}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className={styles.messageForm}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.messageInput}
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !message.trim()}
            className={styles.sendButton}
          >
            <Send className={styles.sendIcon} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollaborativeChat;
