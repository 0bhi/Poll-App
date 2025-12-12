// Socket event types
export interface Message {
  id: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  conversationId: number;
  sender: {
    id: number;
    name: string;
    username: string;
    profilePicture: string;
  };
}

export interface Conversation {
  id: number;
  participant1Id: number;
  participant2Id: number;
  updatedAt: string;
  createdAt: string;
}

export interface ServerToClientEvents {
  message: (message: Message) => void;
  typing_start: (data: {
    conversationId: number;
    userId: number;
    username: string;
  }) => void;
  typing_stop: (data: { conversationId: number; userId: number }) => void;
  message_read: (data: { messageId: number; conversationId: number }) => void;
  user_online: (userId: number) => void;
  user_offline: (userId: number) => void;
  conversation_updated: (conversation: Conversation) => void;
}

export interface ClientToServerEvents {
  authenticate: (data: { userId: number; username: string }) => void;
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
