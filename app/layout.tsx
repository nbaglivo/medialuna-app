import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        <Link href="/">
          <img
            src="/logo-transparent.png"
            alt="Logo"
            className="absolute top-2 left-2 h-6 w-6 sm:h-8 sm:w-8 transition-all duration-300 ease-in-out hover:rotate-12 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] hover:scale-110"
          />
        </Link>
        {children}
      </body>
    </html>
  );
}
