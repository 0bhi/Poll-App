"use client";
import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { FaCircle } from 'react-icons/fa';

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
      className={`p-4 cursor-pointer transition-colors hover:bg-accent/5 ${
        isActive ? 'bg-accent/10 border-r-2 border-accent' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {/* Profile Picture */}
        <div className="relative">
          <Image
            src={otherUser.profilePicture}
            alt={otherUser.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          {/* Online indicator */}
          <FaCircle className="absolute -bottom-1 -right-1 text-green-500 text-xs" />
        </div>

        {/* Conversation Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-main truncate">
              {otherUser.name}
            </h3>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {lastMessage ? (
                <>
                  <span className="font-medium">
                    {lastMessage.sender.id === otherUser.id ? '' : 'You: '}
                  </span>
                  {lastMessage.content}
                </>
              ) : (
                'No messages yet'
              )}
            </p>
            {unreadCount > 0 && (
              <span className="ml-2 bg-accent text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
