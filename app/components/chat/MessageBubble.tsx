"use client";
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useChat } from './ChatProvider';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';

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
  const isOwnMessage = session?.user?.id === message.sender.id.toString();

  // Mark message as read when it's not our own message
  useEffect(() => {
    if (!isOwnMessage && !message.isRead) {
      markMessageAsRead(message.id);
    }
  }, [message.id, message.isRead, isOwnMessage, markMessageAsRead]);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Profile Picture (only for other user's messages) */}
        {!isOwnMessage && (
          <Image
            src={message.sender.profilePicture}
            alt={message.sender.name}
            width={32}
            height={32}
            className="rounded-full object-cover flex-shrink-0"
          />
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-lg max-w-full break-words ${
              isOwnMessage
                ? 'bg-accent text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-700 text-main rounded-bl-md'
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>

          {/* Message Info */}
          <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
            
            {/* Read receipt for own messages */}
            {isOwnMessage && (
              <div className="flex items-center">
                {message.isRead ? (
                  <FaCheckDouble className="text-blue-500" />
                ) : (
                  <FaCheck className="text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
