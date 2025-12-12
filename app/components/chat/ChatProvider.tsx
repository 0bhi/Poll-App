"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@/app/lib/socket";

interface ChatContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  onlineUsers: Set<number>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, messageType?: string) => void;
  markMessageAsRead: (messageId: number) => void;
  startTyping: () => void;
  stopTyping: () => void;
  isTyping: boolean;
  otherUserTyping: boolean;
  refreshConversations: () => Promise<void>;
}

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    name: string;
    username: string;
    profilePicture: string;
  };
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (session?.user?.id) {
      const currentUserId = parseInt(session.user.id);
      // Connect to separate Socket.IO server
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
      const newSocket = io(socketUrl);

      newSocket.on("connect", () => {
        console.log("Connected to socket server");
        newSocket.emit("authenticate", {
          userId: currentUserId,
          username: session.user.username || (session.user as any).name || "",
        });
      });

      newSocket.on("message", (message: Message) => {
        setMessages((prev) => {
          // Avoid duplicates when the sender also receives the broadcast
          if (prev.some((msg) => msg.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Update conversation list with new message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === message.conversationId
              ? {
                  ...conv,
                  lastMessage: message,
                  // Only increment unread count if message is not from current user
                  unreadCount: 
                    message.sender.id !== currentUserId
                      ? conv.unreadCount + 1
                      : conv.unreadCount,
                }
              : conv
          )
        );
      });

      newSocket.on("typing_start", (data) => {
        if (currentConversation?.id === data.conversationId) {
          setOtherUserTyping(true);
        }
      });

      newSocket.on("typing_stop", (data) => {
        if (currentConversation?.id === data.conversationId) {
          setOtherUserTyping(false);
        }
      });

      newSocket.on("message_read", (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, isRead: true } : msg
          )
        );
      });

      newSocket.on("user_online", (userId) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
      });

      newSocket.on("user_offline", (userId) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [session]);

  // Fetch conversations
  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session]);

  // Join conversation room when current conversation changes
  useEffect(() => {
    if (socket && currentConversation) {
      socket.emit("join_conversation", currentConversation.id);
      setMessages([]); // clear stale messages while loading new thread
      fetchMessages(currentConversation.id);
    }
  }, [socket, currentConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `/api/conversations?user_id=${session?.user?.id}`
      );
      const data = await response.json();
      // API returns { data: conversations[] }, so access data.data
      setConversations(data.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(
        `/api/messages?conversation_id=${conversationId}`
      );
      const data = await response.json();
      // API returns { data: messages[] }, so access data.data
      setMessages(data.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  };

  const sendMessage = (content: string, messageType: string = "TEXT") => {
    if (!socket || !currentConversation || !session?.user?.id) return;

    const trimmed = content.trim();
    if (!trimmed) return;

    socket.emit("send_message", {
      conversationId: currentConversation.id,
      content: trimmed,
      messageType,
    });

    // Stop typing indicator as soon as we send
    stopTyping();
  };

  const markMessageAsRead = async (messageId: number) => {
    if (!socket || !currentConversation) return;

    try {
      await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, isRead: true }),
      });

      socket.emit("message_read", {
        messageId,
        conversationId: currentConversation.id,
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const startTyping = () => {
    if (!socket || !currentConversation || isTyping) return;

    setIsTyping(true);
    socket.emit("typing_start", currentConversation.id);
  };

  const stopTyping = () => {
    if (!socket || !currentConversation || !isTyping) return;

    setIsTyping(false);
    socket.emit("typing_stop", currentConversation.id);
  };

  const value: ChatContextType = {
    socket,
    conversations,
    currentConversation,
    messages,
    onlineUsers,
    setCurrentConversation,
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    isTyping,
    otherUserTyping,
    refreshConversations: fetchConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
