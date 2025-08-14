import { NextApiRequest, NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@/app/lib/socket';
import Prisma from '@/app/lib/db';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Setting up socket');
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    res.socket.server,
    {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    }
  );

  res.socket.server.io = io;

  // Store online users
  const onlineUsers = new Map<number, string>();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user authentication
    socket.on('authenticate', async (data: { userId: number; username: string }) => {
      socket.data.userId = data.userId;
      socket.data.username = data.username;
      onlineUsers.set(data.userId, socket.id);
      
      // Broadcast user online status
      socket.broadcast.emit('user_online', data.userId);
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId: number) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.data.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: number) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.data.userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data: { conversationId: number; content: string; messageType?: string }) => {
      try {
        // Save message to database
        const message = await Prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: socket.data.userId!,
            content: data.content,
            messageType: data.messageType || 'TEXT',
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
        await Prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        });

        // Broadcast message to conversation room
        io.to(`conversation_${data.conversationId}`).emit('message', message);

        // Create notification for other participant
        const conversation = await Prisma.conversation.findUnique({
          where: { id: data.conversationId },
        });

        if (conversation) {
          const otherParticipantId = 
            conversation.participant1Id === socket.data.userId
              ? conversation.participant2Id
              : conversation.participant1Id;

          await Prisma.notifications.create({
            data: {
              text: `New message from ${message.sender.name}`,
              user_id: otherParticipantId,
              type: 'MESSAGE',
              actorIds: [socket.data.userId!],
            },
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId: number) => {
      socket.to(`conversation_${conversationId}`).emit('typing_start', {
        conversationId,
        userId: socket.data.userId!,
        username: socket.data.username!,
      });
    });

    socket.on('typing_stop', (conversationId: number) => {
      socket.to(`conversation_${conversationId}`).emit('typing_stop', {
        conversationId,
        userId: socket.data.userId!,
      });
    });

    // Handle message read status
    socket.on('message_read', async (data: { messageId: number; conversationId: number }) => {
      try {
        await Prisma.message.update({
          where: { id: data.messageId },
          data: { isRead: true },
        });

        socket.to(`conversation_${data.conversationId}`).emit('message_read', {
          messageId: data.messageId,
          conversationId: data.conversationId,
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle user online/offline status
    socket.on('user_online', () => {
      if (socket.data.userId) {
        socket.broadcast.emit('user_online', socket.data.userId);
      }
    });

    socket.on('user_offline', () => {
      if (socket.data.userId) {
        socket.broadcast.emit('user_offline', socket.data.userId);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        socket.broadcast.emit('user_offline', socket.data.userId);
      }
    });
  });

  res.end();
};

export default SocketHandler;
