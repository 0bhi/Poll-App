import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./_providers/providers";
import { ChatProvider } from "./_features/chat/ChatProvider";
import LayoutContent from "./_layout/LayoutContent";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poll App",
  description: "A social polling application",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
