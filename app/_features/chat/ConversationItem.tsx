"use client";
import React from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { FaCircle } from "react-icons/fa";

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    name: string;
    username: string;
    profilePicture: string;
  };
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    sender: {
      id: number;
      name: string;
      username: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const { otherUser, lastMessage, unreadCount, updatedAt } = conversation;

  return (
    <div
      className={`px-4 py-3 cursor-pointer transition-colors ${
        isActive
          ? "bg-gray-800"
          : "hover:bg-gray-800/50 active:bg-gray-800"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {/* Profile Picture */}
        <div className="relative flex-shrink-0">
          <Image
            src={otherUser.profilePicture}
            alt={otherUser.name}
            width={50}
            height={50}
            className="rounded-full object-cover"
          />
          {/* Online indicator */}
          <FaCircle className="absolute -bottom-0.5 -right-0.5 text-green-500 text-xs bg-gray-900 rounded-full" />
        </div>

        {/* Conversation Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-white truncate text-[15px]">
              {otherUser.name}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${
              unreadCount > 0 ? "font-semibold text-white" : "text-gray-400"
            }`}>
              {lastMessage ? (
                <>
                  <span className={lastMessage.sender.id === otherUser.id ? "" : "font-normal"}>
                    {lastMessage.sender.id === otherUser.id ? "" : "You: "}
                  </span>
                  {lastMessage.content}
                </>
              ) : (
                <span className="text-gray-500 italic">No messages yet</span>
              )}
            </p>
            {unreadCount > 0 && (
              <span className="ml-2 bg-accent text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center flex-shrink-0">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
