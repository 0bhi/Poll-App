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
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-1/4 relative">
        <Homebar />
      </div>
      <div className="w-1/2 bg-gradient-to-b from-gray-900 to-gray-800">
        {children}
      </div>
      <div className="w-1/4 bg-gradient-to-b from-gray-900 to-gray-800">
        <Notificationsbar />
      </div>
    </div>
  );
}
