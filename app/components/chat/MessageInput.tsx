"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from './ChatProvider';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';

const MessageInput: React.FC = () => {
  const { currentConversation, sendMessage, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState('');
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
    setMessage('');
    
    // Stop typing indicator immediately
    setIsTyping(false);
    stopTyping();
    
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!currentConversation) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Emoji Button */}
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-accent transition-colors"
        >
          <FaSmile className="text-lg" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-800 text-main"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-lg transition-colors ${
            message.trim()
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          <FaPaperPlane className="text-lg" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
