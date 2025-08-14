"use client";
import React from 'react';
import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { FaComments } from 'react-icons/fa';

const ChatPage: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <FaComments className="mx-auto text-6xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            Sign in to access chat
          </h2>
          <p className="text-gray-500 mb-4">
            You need to be signed in to use the chat feature
          </p>
          <button
            onClick={() => signIn()}
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatPage;
