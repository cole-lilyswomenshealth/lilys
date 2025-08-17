// src/app/(default)/page.tsx
import { Metadata } from "next";
import RotatingHeadline from "@/components/RotatingHeadline";
import RotatingSection from "@/components/RotatingSection";
import FaqAccordion from "@/components/FaqAccordion";
import HowItWorks from "@/components/HowItWorks";
import NewHairLossSection from "@/components/NewHairLossSection";
// import Packages from "@/components/Packages";
{/* <NewHairLossSection /> */}

export const metadata: Metadata = {
  title: "Home - Lily's Women's Health",
  description: "Start your medically guided weight loss journey with Lily's. Connect with licensed doctors through secure telehealth consultations for GLP-1 medications like semaglutide and tirzepatide.",
  keywords: [
    "telehealth weight loss",
    "women's health",
    "semaglutide online",
    "tirzepatide consultation", 
    "medical weight loss",
    "licensed doctors",
    "GLP-1 medications",
    "women's wellness",
    "online health consultation"
  ],
  openGraph: {
    title: "Lily's Women's Health - Start Your Weight Loss Journey",
    description: "Connect with licensed doctors for medically guided weight loss through secure telehealth consultations.",
    url: "https://lilyswomenshealth.com",
    images: [
      {
        url: "/images/home-og-image.jpg", 
        width: 1200,
        height: 630,
        alt: "Lily's Women's Health - Weight Loss Solutions"
      }
    ]
  },
  twitter: {
    title: "Lily's Women's Health - Start Your Weight Loss Journey",
    description: "Connect with licensed doctors for medically guided weight loss through secure telehealth consultations."
  }
};

export default function HomePage() {
  return (
    <main>
      <div>
        <RotatingHeadline />
        <HowItWorks />
        <RotatingSection />
        
        <FaqAccordion />
       
      </div>
    </main>
  );
}