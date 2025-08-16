"use client";

import Homebar from "./Homebar";
import Notificationsbar from "./Notificationsbar";
import { usePathname } from "next/navigation";
import { useTheme } from "./providers";
import { FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Close mobile menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  // Don't show sidebar for signup page or chat page
  if (pathname === "/signup" || pathname === "/chat") {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>

          <h1 className="text-white font-bold text-lg">Poll App</h1>

          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="text-white p-2 rounded-lg hover:bg-gray-700 transition-colors relative"
            aria-label="Toggle notifications"
          >
            <FaSun size={20} />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-16">
              <Homebar />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Notifications Overlay */}
      {isNotificationsOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-16">
              <Notificationsbar />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-1/4 relative">
        <Homebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:w-1/2 bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
        <div className="h-full pt-16 md:pt-0">{children}</div>
      </div>

      {/* Desktop Notifications */}
      <div className="hidden md:block w-1/4 bg-gradient-to-b from-gray-900 to-gray-800">
        <Notificationsbar />
      </div>
    </div>
  );
}
