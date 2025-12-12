"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaComments } from "react-icons/fa";
import ChatSidebar from "../_features/chat/ChatSidebar";
import ChatWindow from "../_features/chat/ChatWindow";
import { useChat } from "../_features/chat/ChatProvider";

export default function MessagesPage() {
  const { status } = useSession();
  const { currentConversation } = useChat();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 px-4">
        <div className="text-center px-6 py-8 bg-card rounded-xl shadow border border-gray-200 dark:border-gray-800">
          <FaComments className="mx-auto text-5xl text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Sign in to view messages
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You need to be signed in to use messaging.
          </p>
          <button
            onClick={() => signIn()}
            className="bg-accent text-white px-5 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // On mobile: WhatsApp-style - full screen chat list OR full screen chat
  // On desktop: Always show sidebar + chat window side by side (WhatsApp Web style)
  const showSidebar = !isMobile || !currentConversation;
  const showChatWindow = !isMobile || currentConversation; // On desktop, always show; on mobile, only when conversation selected

  return (
    <div
      className={`${
        isMobile ? "fixed inset-0 z-[60] md:relative md:z-0" : "h-screen w-full"
      } flex flex-col md:flex-row w-full bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden`}
      style={
        isMobile
          ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              position: "fixed",
              height: "100vh",
              width: "100vw",
            }
          : { height: "100vh" }
      }
    >
      {/* Sidebar - full screen on mobile when no chat selected, fixed narrow width on desktop (always visible) */}
      {showSidebar && (
        <div
          className={`${
            isMobile
              ? "w-full h-full absolute inset-0 z-10"
              : "w-[35%] min-w-[300px] max-w-[400px] flex-shrink-0 relative z-0 border-r border-gray-700"
          } flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800`}
        >
          <ChatSidebar />
        </div>
      )}

      {/* Chat Window - full screen on mobile when chat selected, takes remaining space on desktop (always visible) */}
      {showChatWindow && (
        <div
          className={`${
            isMobile
              ? "w-full h-full absolute inset-0 z-10"
              : "flex-1 min-w-0 relative z-0"
          } flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800`}
        >
          <ChatWindow />
        </div>
      )}
    </div>
  );
}
