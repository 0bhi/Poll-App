"use client";
import React from 'react';
import Image from 'next/image';
import { FaCircle, FaEllipsisV } from 'react-icons/fa';

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    name: string;
    username: string;
    profilePicture: string;
  };
  lastMessage: any;
  unreadCount: number;
  updatedAt: string;
}

interface ChatHeaderProps {
  conversation: Conversation;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation }) => {
  const { otherUser } = conversation;

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-3">
        {/* Profile Picture */}
        <div className="relative">
          <Image
            src={otherUser.profilePicture}
            alt={otherUser.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          {/* Online indicator */}
          <FaCircle className="absolute -bottom-1 -right-1 text-green-500 text-xs" />
        </div>

        {/* User Info */}
        <div>
          <h3 className="font-medium text-main">{otherUser.name}</h3>
          <p className="text-sm text-gray-500">@{otherUser.username}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-500 hover:text-accent transition-colors">
          <FaEllipsisV />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
