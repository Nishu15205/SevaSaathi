import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/providers/AuthProvider";

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
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SevaSaathi",
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
      <head>
        <meta name="theme-color" content="#14532d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="antialiased bg-background text-foreground"
        style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
