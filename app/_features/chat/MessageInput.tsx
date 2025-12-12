"use client";
import React, { useState, useEffect, useRef } from "react";
import { useChat } from "./ChatProvider";
import { FaPaperPlane, FaSmile } from "react-icons/fa";

const MessageInput: React.FC = () => {
  const { currentConversation, sendMessage, startTyping, stopTyping } =
    useChat();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicators
  useEffect(() => {
    if (message.length > 0 && !isTyping) {
      setIsTyping(true);
      startTyping();
    } else if (message.length === 0 && isTyping) {
      setIsTyping(false);
      stopTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (message.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping();
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, startTyping, stopTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !currentConversation) return;

    const messageContent = message.trim();
    setMessage("");

    // Stop typing indicator immediately
    setIsTyping(false);
    stopTyping();

    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!currentConversation) {
    return null;
  }

  return (
    <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Emoji Button */}
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
        >
          <FaSmile className="text-xl" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="w-full px-4 py-2.5 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-accent bg-gray-800 text-white placeholder-gray-500 border-none"
            rows={1}
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2.5 rounded-full transition-colors ${
            message.trim()
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          <FaPaperPlane className="text-base" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
