// src/app/(default)/page.tsx
import RotatingHeadline from "@/components/RotatingHeadline";
import RotatingSection from "@/components/RotatingSection";
import FaqAccordion from "@/components/FaqAccordion";
import HowItWorks from "@/components/HowItWorks";
// import Packages from "@/components/Packages";

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