import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import BotWidget from "@/components/BotWidget";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DenizMedia",
  description: "Sosyal medya platformu - Paylaş, Keşfet, Bağlan!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} antialiased font-[family-name:var(--font-geist-sans)]`}>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
            <div className="flex">
              <LeftSidebar />
              <main className="flex-1">
                {children}
              </main>
              <RightSidebar />
              <BotWidget />
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
