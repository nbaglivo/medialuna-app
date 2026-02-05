import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GearIcon } from "@radix-ui/react-icons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medialuna",
  description: "Medialuna",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex justify-center h-screen pb-16 overflow-hidden w-full`}
      >
        <div className="flex justify-center items-center">
          <Link href="/">
            <img
              src="/logo-transparent.png"
              alt="Logo"
              className="absolute top-2 left-2 h-6 w-6 sm:h-8 sm:w-8 transition-all duration-300 ease-in-out hover:rotate-12 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] hover:scale-110"
            />
          </Link>
          <div className="flex fixed right-2 top-2 sm:right-4 sm:top-4 justify-end mb-2 space-x-2 z-10">
            <Link
              href="/config"
              className="p-2 rounded-full hover:bg-[#252525] transition-colors"
              title="Settings"
            >
              <GearIcon className="text-zinc-400 size-4" />
            </Link>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
