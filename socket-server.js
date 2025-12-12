const { createServer } = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { jwtVerify } = require("jose");

// Create Prisma client singleton to prevent connection pool exhaustion
const prismaClientSingleton = () => {
  return new PrismaClient();
};

const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

const port = process.env.SOCKET_PORT || 3001;
const frontendUrl =
  process.env.FRONTEND_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

// Ensure NEXTAUTH_SECRET is set for JWT verification
if (!process.env.NEXTAUTH_SECRET) {
  console.error("ERROR: NEXTAUTH_SECRET environment variable is not set!");
  console.error("Socket server authentication will not work without this secret.");
  process.exit(1);
}

// Create HTTP server for Socket.IO
const server = createServer();

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Store online users
const onlineUsers = new Map();

/**
 * Verify NextAuth session token from cookie
 * Returns userId and username if valid, null otherwise
 */
async function verifySessionToken(cookieHeader) {
  if (!cookieHeader) {
    return null;
  }

  try {
    // Parse cookies from header
    // Handle cookie values that may contain '=' characters
    const cookies = {};
    cookieHeader.split(";").forEach((cookie) => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const name = trimmed.substring(0, equalIndex);
        const value = trimmed.substring(equalIndex + 1);
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      }
    });

    // NextAuth cookie names (development and production)
    const sessionToken =
      cookies["__Secure-next-auth.session-token"] ||
      cookies["next-auth.session-token"];

    if (!sessionToken) {
      return null;
    }

    // Verify JWT token using NEXTAUTH_SECRET
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(sessionToken, secret);

    // Extract userId and username from token
    if (!payload.id) {
      return null;
    }

    const userId = typeof payload.id === "string" ? parseInt(payload.id, 10) : payload.id;
    if (!Number.isFinite(userId)) {
      return null;
    }

    return {
      userId,
      username: payload.username || payload.name || "",
    };
  } catch (error) {
    console.error("Error verifying session token:", error);
    return null;
  }
}

// Socket.IO connection handling with authentication middleware
io.use(async (socket, next) => {
  try {
    // Extract cookies from handshake
    const cookieHeader = socket.handshake.headers.cookie;

    // Verify session token
    const sessionData = await verifySessionToken(cookieHeader);

    if (!sessionData) {
      console.log("Unauthenticated connection attempt:", socket.id);
      return next(new Error("Authentication required"));
    }

    // Store authenticated user data in socket
    socket.data.userId = sessionData.userId;
    socket.data.username = sessionData.username;
    onlineUsers.set(sessionData.userId, socket.id);

    console.log(`Authenticated user ${sessionData.userId} connected:`, socket.id);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User is already authenticated via middleware
  // Broadcast user online status
  socket.broadcast.emit("user_online", socket.data.userId);

  // Remove the authenticate event handler - authentication is now done via middleware
  // Keep for backward compatibility but ignore client-provided data
  socket.on("authenticate", async (data) => {
    console.warn(
      `Client ${socket.id} attempted to authenticate, but authentication is handled server-side. Ignoring client-provided userId.`
    );
    // User is already authenticated via middleware, so we can safely ignore this
  });

  // Join conversation room
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(
      `User ${socket.data.userId} joined conversation ${conversationId}`
    );
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(
      `User ${socket.data.userId} left conversation ${conversationId}`
    );
  });

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      // Save message to database
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: socket.data.userId,
          content: data.content,
          messageType: data.messageType || "TEXT",
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      // Broadcast message to conversation room
      io.to(`conversation_${data.conversationId}`).emit("message", message);

      // Create notification for other participant
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
      });

      if (conversation) {
        const otherParticipantId =
          conversation.participant1Id === socket.data.userId
            ? conversation.participant2Id
            : conversation.participant1Id;

        await prisma.notifications.create({
          data: {
            text: `New message from ${message.sender.name}`,
            user_id: otherParticipantId,
            type: "MESSAGE",
            actorIds: [socket.data.userId],
          },
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", (conversationId) => {
    socket.to(`conversation_${conversationId}`).emit("typing_start", {
      conversationId,
      userId: socket.data.userId,
      username: socket.data.username,
    });
  });

  socket.on("typing_stop", (conversationId) => {
    socket.to(`conversation_${conversationId}`).emit("typing_stop", {
      conversationId,
      userId: socket.data.userId,
    });
  });

  // Handle message read status
  socket.on("message_read", async (data) => {
    try {
      await prisma.message.update({
        where: { id: data.messageId },
        data: { isRead: true },
      });

      socket.to(`conversation_${data.conversationId}`).emit("message_read", {
        messageId: data.messageId,
        conversationId: data.conversationId,
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Handle user online/offline status
  socket.on("user_online", () => {
    if (socket.data.userId) {
      socket.broadcast.emit("user_online", socket.data.userId);
    }
  });

  socket.on("user_offline", () => {
    if (socket.data.userId) {
      socket.broadcast.emit("user_offline", socket.data.userId);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.data.userId) {
      onlineUsers.delete(socket.data.userId);
      socket.broadcast.emit("user_offline", socket.data.userId);
    }
  });
});

// Start the server
server.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Socket.IO server ready on port ${port}`);
  console.log(`> Allowing connections from: ${frontendUrl}`);
});

// Graceful shutdown: disconnect Prisma on server termination
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

process.on("SIGINT", async () => {
  console.log("Shutting down Socket.IO server...");
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("Shutting down Socket.IO server...");
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

// Error handling
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
