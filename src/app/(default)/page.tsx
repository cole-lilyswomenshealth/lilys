// src/app/(default)/page.tsx
import RotatingHeadline from "@/components/RotatingHeadline";
import RotatingSection from "@/components/RotatingSection";
import FaqAccordion from "@/components/FaqAccordion";
import HowItWorks from "@/components/HowItWorks";
import NewHairLossSection from "@/components/NewHairLossSection";
// import Packages from "@/components/Packages";
{/* <NewHairLossSection /> */}

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