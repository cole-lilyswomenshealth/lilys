// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/Auth/AuthProvider";
import I18nProvider from "@/components/I18nProvider";
import HtmlLangAttribute from "@/components/HtmlLangAttribute";
import FacebookPixel from "@/components/Analytics/FacebookPixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lily's",
  description: "Start your journey with personalized care",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Qualiphy stylesheet */}
        <link 
          rel="stylesheet" 
          href="https://firebasestorage.googleapis.com/v0/b/qualiphy-web-d918b.appspot.com/o/style-v4.css?alt=media&token=34735782-16e8-4a2f-9eaa-426d65af48b2" 
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#F7F7F7] antialiased`}>
        <FacebookPixel />
        <AuthProvider>
          <I18nProvider>
            <HtmlLangAttribute />
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// Add TypeScript interface for the window object to include showDisclosureModal
declare global {
  interface Window {
    showDisclosureModal: () => void;
  }
}