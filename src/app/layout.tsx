import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DenizMedia",
  description: "Sosyal medya platformu - Paylaş, etkileş, popülerleş!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} antialiased font-[family-name:var(--font-geist-sans)]`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
