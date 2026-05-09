import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Etheria Companion",
  description: "Build optimizer and RTA draft assistant for Etheria: Restart",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${geist.className} min-h-full bg-gray-950 text-gray-100 antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
