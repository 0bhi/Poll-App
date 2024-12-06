"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import Homebar from "./components/Homebar";
import Notificationsbar from "./components/Notificationsbar";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden ">
            {pathname !== "/signup" ? (
              <>
                <div className="w-1/4 border-r-2 border-black">
                  <Homebar />
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
