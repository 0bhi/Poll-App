import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

// Socket event types
export interface ServerToClientEvents {
  message: (message: any) => void;
  typing_start: (data: {
    conversationId: number;
    userId: number;
    username: string;
  }) => void;
  typing_stop: (data: { conversationId: number; userId: number }) => void;
  message_read: (data: { messageId: number; conversationId: number }) => void;
  user_online: (userId: number) => void;
  user_offline: (userId: number) => void;
  conversation_updated: (conversation: any) => void;
}

export interface ClientToServerEvents {
  join_conversation: (conversationId: number) => void;
  leave_conversation: (conversationId: number) => void;
  send_message: (data: {
    conversationId: number;
    content: string;
    messageType?: string;
  }) => void;
  typing_start: (conversationId: number) => void;
  typing_stop: (conversationId: number) => void;
  message_read: (data: { messageId: number; conversationId: number }) => void;
  user_online: () => void;
  user_offline: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: number;
  username: string;
}
