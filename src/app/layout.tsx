import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SevaSaathi - Verified Home Care & Elder Support Platform",
  description:
    "SevaSaathi connects families with verified nurses and caregivers for elderly people, bedridden patients, and home care assistance. Find trusted caregivers, book confidently, and monitor care from anywhere.",
  keywords: [
    "SevaSaathi",
    "home care",
    "elder care",
    "caregiver",
    "nurse",
    "verified caregivers",
    "elderly care",
    "patient care",
    "Delhi NCR",
    "India",
  ],
  authors: [{ name: "SevaSaathi Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "SevaSaathi - Verified Home Care & Elder Support Platform",
    description:
      "Find the right caregiver, book care confidently, and monitor care from anywhere.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
