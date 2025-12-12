"use client";
import React, { useState } from "react";
import { useChat } from "./ChatProvider";
import ConversationItem from "./ConversationItem";
import NewConversationModal from "./NewConversationModal";
import { FaComments, FaPlus } from "react-icons/fa";

const ChatSidebar: React.FC = () => {
  const { conversations, currentConversation, setCurrentConversation } =
    useChat();
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] =
    useState(false);

  return (
    <>
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 bg-gray-900 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Messages
            </h2>
            <button
              className="p-2 rounded-full hover:bg-gray-700 transition-colors text-white"
              onClick={() => setIsNewConversationModalOpen(true)}
              aria-label="New conversation"
            >
              <FaPlus className="text-xl" />
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-gradient-to-b from-gray-900 to-gray-800">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FaComments className="mx-auto text-5xl mb-4 opacity-30" />
              <p className="text-gray-300 font-medium">No conversations yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Start a conversation with someone!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
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
