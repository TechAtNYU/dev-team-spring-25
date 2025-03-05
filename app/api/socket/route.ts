// app/api/socket/route.ts

import { NextResponse } from "next/server";
import { createServer } from "http";
import { Server } from "socket.io";

export const config = {
  // Ensures we can use Node APIs like 'http' in the App Router
  runtime: "nodejs",
};

// In-memory store for chat history
const messages: string[] = [];

// Keep references in module scope so they're not reinitialized on each request
let io: Server | null = null;
let serverStarted = false;

// Create and start the Socket.IO server on a separate port (3001)
function initSocketServer() {
  if (!io) {
    const httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: "*", // or specify your domain(s) here
      },
    });

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Send the current chat history to the new client
      socket.emit("chatHistory", messages);

      socket.on("message", (msg: string) => {
        // Save the new message in the chat history
        messages.push(msg);
        // Broadcast the new message to all connected clients
        io?.emit("message", msg);
      });
    });

    // Start listening on port 3001
    httpServer.listen(3001, () => {
      console.log("Socket.IO server listening on port 3001");
    });
  }
}

export async function GET() {
  // Only initialize once
  if (!serverStarted) {
    initSocketServer();
    serverStarted = true;
  }

  // Return a JSON response so we don't get a 404 in Next.js
  return NextResponse.json({
    message: "Socket.IO server started on port 3001",
  });
}
