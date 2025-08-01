//src/app/c/wm/components/StepLayout.tsx
"use client";

import { useEffect } from "react";
import ProgressBar from "./ProgressBar";
import { useRouter, usePathname } from "next/navigation";
import { useWMFormStore, WM_FORM_STEPS, getNextStep } from "@/store/wmFormStore";

interface StepLayoutProps {
  children: React.ReactNode;
}

export default function StepLayout({ children }: StepLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Get states and actions from the store
  const { 
    currentStep, 
    completedSteps, 
    setCurrentStep, 
    markStepCompleted 
  } = useWMFormStore();

  // Calculate progress - updated to exclude submit step
  const filteredSteps = WM_FORM_STEPS.filter(step => step !== "/c/wm/submit");
  const currentStepIndex = filteredSteps.indexOf(pathname);
  const progressPercentage = ((currentStepIndex + 1) / filteredSteps.length) * 100;

  // Update current step in the store when pathname changes
  useEffect(() => {
    if (pathname && filteredSteps.includes(pathname)) {
      setCurrentStep(pathname);
    }
  }, [pathname, setCurrentStep]);

  const nextStep = (): void => {
    // Mark current step as completed
    if (pathname) {
      markStepCompleted(pathname);
    }

    // Navigate to next step - skip submit step and go directly to results
    let next = getNextStep(pathname || "");
    
    // If next step is submit, skip to results
    if (next === "/c/wm/submit") {
      next = "/c/wm/results";
    }
    
    if (next) {
      router.push(next);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white px-6">
      {/* Progress Bar */}
      <ProgressBar progress={progressPercentage} />

      {/* Step Content */}
      <div className="max-w-lg text-center mt-10">{children}</div>

      {/* Sticky Continue Button */}
      <div className="fixed bottom-6 w-full flex justify-center">
        <button
          onClick={nextStep}
          className="bg-black text-white text-lg font-medium px-6 py-3 rounded-full w-[90%] max-w-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}