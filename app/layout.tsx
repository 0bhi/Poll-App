"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import Homebar from "./components/Homebar";
import Notificationsbar from "./components/Notificationsbar";
import { usePathname } from "next/navigation";
import { useTheme } from "./components/providers";
import { FaSun, FaMoon } from "react-icons/fa";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            {pathname !== "/signup" ? (
              <>
                <div className="w-1/4 border-r-2 border-gray-200 relative">
                  <Homebar />
                  {/* Theme toggle button (sidebar/desktop) */}
                  <button
                    className="absolute top-4 right-4 bg-accent text-white rounded-md p-2 shadow-sm hover:bg-accent-hover transition-all flex items-center gap-2"
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
              </>
            ) : (
              <div className="w-full ">{children}</div>
            )}
          </div>
        </Providers>
      </body>
    </html>
  );
}
