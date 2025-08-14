"use client";
import React, { useState } from 'react';
import { useChat } from './ChatProvider';
import ConversationItem from './ConversationItem';
import NewConversationModal from './NewConversationModal';
import { FaComments, FaPlus } from 'react-icons/fa';

const ChatSidebar: React.FC = () => {
  const { conversations, currentConversation, setCurrentConversation } = useChat();
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  return (
    <>
      <div className="w-80 bg-card border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-main flex items-center">
              <FaComments className="mr-2" />
              Messages
            </h2>
            <button 
              className="p-2 rounded-full hover:bg-accent/10 transition-colors"
              onClick={() => setIsNewConversationModalOpen(true)}
            >
              <FaPlus className="text-accent" />
            </button>
          </div>
        </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FaComments className="mx-auto text-4xl mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a conversation with someone!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversation?.id === conversation.id}
                onClick={() => setCurrentConversation(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    
    {/* New Conversation Modal */}
    <NewConversationModal
      isOpen={isNewConversationModalOpen}
      onClose={() => setIsNewConversationModalOpen(false)}
    />
  </>
  );
};

export default ChatSidebar;
