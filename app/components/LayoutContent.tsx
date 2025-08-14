"use client";

import Homebar from "./Homebar";
import Notificationsbar from "./Notificationsbar";
import { usePathname } from "next/navigation";
import { useTheme } from "./providers";
import { FaSun, FaMoon } from "react-icons/fa";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Don't show sidebar for signup page or chat page
  if (pathname === "/signup" || pathname === "/chat") {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-1/4 relative">
        <Homebar />
        {/* Theme toggle button (sidebar/desktop) */}
        <button
          className="absolute top-4 right-4 bg-blue-700 text-white rounded-md p-2 shadow-sm hover:bg-blue-800 transition-all flex items-center gap-2"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <FaSun className="icon" />
          ) : (
            <FaMoon className="icon" />
          )}
          <span className="text-xs font-medium hidden md:inline">
            {theme === "dark" ? "Light" : "Dark"} Mode
          </span>
        </button>
      </div>
      <div className="w-1/2 ">{children}</div>
      <div className="w-1/4">
        <Notificationsbar />
      </div>
    </div>
  );
}
