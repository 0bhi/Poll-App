"use client";
import React, { useRef, useEffect, useState } from "react";
import { useChat } from "./ChatProvider";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { FaComments } from "react-icons/fa";

const ChatWindow: React.FC = () => {
  const { currentConversation, messages, otherUserTyping, conversations } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentConversation) {
    // On desktop, if there are no conversations at all, just show background
    if (!isMobile && conversations.length === 0) {
      return (
        <div className="flex-1 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <FaComments className="text-5xl text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">Keep your phone connected</p>
            <p className="text-gray-500 text-xs mt-1">Messages are synced to your phone</p>
          </div>
        </div>
      );
    }
    
    // On desktop with conversations but none selected, or on mobile
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center px-4">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <FaComments className="text-5xl text-gray-500" />
          </div>
          <p className="text-gray-300 font-medium">Select a conversation</p>
          <p className="text-gray-500 text-sm mt-1">
            {isMobile
              ? "Choose a conversation to start messaging"
              : "Choose a conversation from the sidebar to start messaging"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 h-full">
      {/* Header */}
      <ChatHeader conversation={currentConversation} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide bg-gradient-to-b from-gray-900 to-gray-800">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-gray-300 font-medium mb-1">No messages yet</p>
            <p className="text-sm text-gray-500">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {otherUserTyping && (
              <div className="flex items-center space-x-2 text-gray-400 text-sm px-2 py-1">
                <div className="flex space-x-1 bg-gray-800 rounded-full px-3 py-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
