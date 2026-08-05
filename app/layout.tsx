import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AchievementToast from "./achievement-toast";
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
  title: "Build a Beauty — Hockey Legacy Builder",
  description:
    "Draft elite hockey skills, build your ultimate player, and chase the Cup.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <AchievementToast />
      </body>
    </html>
  );
}
