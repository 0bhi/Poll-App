import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import { ChatProvider } from "./components/chat/ChatProvider";
import LayoutContent from "./components/LayoutContent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poll App",
  description: "A social polling application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ChatProvider>
            <LayoutContent>{children}</LayoutContent>
          </ChatProvider>
        </Providers>
      </body>
    </html>
  );
}
