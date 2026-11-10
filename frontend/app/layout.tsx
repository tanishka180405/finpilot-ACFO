import type { Metadata } from "next";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";
import { BusinessProvider } from "@/components/BusinessProvider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finpilot - Autonomous CFO",
  description: "AI-powered Autonomous CFO Operating System for SMBs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink-900"><AuthGate><BusinessProvider>{children}</BusinessProvider></AuthGate></body>
    </html>
  );
}
