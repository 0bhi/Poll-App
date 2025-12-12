"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaCircle, FaEllipsisV, FaArrowLeft } from "react-icons/fa";
import { useChat } from "./ChatProvider";

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

interface ChatHeaderProps {
  conversation: Conversation;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation }) => {
  const { otherUser } = conversation;
  const { setCurrentConversation } = useChat();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleBack = () => {
    setCurrentConversation(null);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900 flex-shrink-0">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Back button for mobile */}
        {isMobile && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
            aria-label="Back to conversations"
          >
            <FaArrowLeft className="text-lg" />
          </button>
        )}

        {/* Profile Picture */}
        <div className="relative flex-shrink-0">
          <Image
            src={otherUser.profilePicture}
            alt={otherUser.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          {/* Online indicator */}
          <FaCircle className="absolute -bottom-0.5 -right-0.5 text-green-500 text-xs bg-gray-900 rounded-full" />
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-white truncate text-[16px]">{otherUser.name}</h3>
          <p className="text-xs text-gray-400 truncate">
            online
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
          <FaEllipsisV />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
