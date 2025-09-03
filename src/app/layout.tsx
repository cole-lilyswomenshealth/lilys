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
  metadataBase: new URL('https://lilyswomenshealth.com'),
  title: {
    default: "Lily's Women's Health - Telehealth Weight Loss Solutions",
    template: "%s | Lily's Women's Health"
  },
  description: "Lily's connects women with licensed doctors for medically guided weight loss through secure telehealth consultations. Clinically backed GLP-1 medications like semaglutide and tirzepatide prescribed when appropriate.",
  keywords: [
    "women's health",
    "telehealth",
    "weight loss",
    "semaglutide", 
    "tirzepatide",
    "GLP-1 medications",
    "licensed doctors",
    "medical weight loss",
    "women's wellness",
    "online consultations"
  ],
  authors: [{ name: "Lily's Women's Health" }],
  creator: "Lily's Women's Health",
  publisher: "Lily's Women's Health",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lilyswomenshealth.com",
    siteName: "Lily's Women's Health",
    title: "Lily's Women's Health - Telehealth Weight Loss Solutions",
    description: "Connecting women with licensed doctors for medically guided weight loss through secure telehealth consultations.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lily's Women's Health - Telehealth Weight Loss Solutions"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Lily's Women's Health - Telehealth Weight Loss Solutions",
    description: "Connecting women with licensed doctors for medically guided weight loss through secure telehealth consultations.",
    images: ["/images/twitter-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "your-google-site-verification-code"
  },
  category: "Health & Wellness"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Facebook domain verification */}
        <meta name="facebook-domain-verification" content="gjthc5q7m1t5r9perykssp9h6kdr2r" />
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