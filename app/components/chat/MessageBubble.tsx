"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useChat } from "./ChatProvider";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { FaCheck, FaCheckDouble } from "react-icons/fa";

interface Message {
  id: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    username: string;
    profilePicture: string;
  };
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { data: session } = useSession();
  const { markMessageAsRead } = useChat();
  const isOwnMessage = parseInt(session?.user?.id || "0") === message.sender.id;

  // Mark message as read when it's not our own message
  useEffect(() => {
    if (!isOwnMessage && !message.isRead) {
      markMessageAsRead(message.id);
    }
  }, [message.id, message.isRead, isOwnMessage, markMessageAsRead]);

  const time = new Date(message.createdAt).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`flex items-end space-x-2 max-w-[65%] md:max-w-[50%] ${
          isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        {/* Message Bubble */}
        <div
          className={`px-3 py-2 rounded-lg shadow-sm max-w-full break-words ${
            isOwnMessage
              ? "bg-accent text-white rounded-tr-none"
              : "bg-gray-800 text-gray-100 rounded-tl-none"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          {/* Message time and read receipt */}
          <div className={`flex items-center justify-end mt-1 space-x-1 ${
            isOwnMessage ? "flex-row-reverse" : ""
          }`}>
            <span className={`text-[11px] mt-0.5 ${
              isOwnMessage ? "text-white/70" : "text-gray-400"
            }`}>
              {time}
            </span>
            {/* Read receipt for own messages */}
            {isOwnMessage && (
              <span className="ml-1">
                {message.isRead ? (
                  <FaCheckDouble className="text-blue-400 text-[10px]" />
                ) : (
                  <FaCheck className="text-white/50 text-[10px]" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
