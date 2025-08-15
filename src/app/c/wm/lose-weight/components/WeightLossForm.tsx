//src/app/c/wm/lose-weight/components/WeightLossForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWMFormStore } from "@/store/wmFormStore";
import ProgressBar from "@/app/c/wm/components/ProgressBar";
import { QuestionRenderer } from "./QuestionTypes";
import { weightLossQuestions, getProgressPercentage, calculateBMI, checkEligibility, validateContactInfo } from "../data/questions";
import { FormResponse, QuestionType, ContactInfoData } from "../types";
import { trackSurveyStart, trackSurveyCompletion } from "@/utils/facebookTracking";

interface WeightLossFormProps {
  initialOffset?: number;
}

const submitToSalesforce = async (formData: FormResponse, contactInfo?: ContactInfoData): Promise<void> => {
  try {
    const response = await fetch('/api/weight-loss-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData,
        contactInfo
      }),
    });

    // Silently handle response without logging
    if (!response.ok) {
      // Handle error silently in production
    }
  } catch (error) {
    // Handle error silently in production
  }
};

// NEW: Background user data submission function
const submitUserDataInBackground = async (contactInfo: ContactInfoData): Promise<void> => {
  try {
    // Convert state abbreviation to full state name
    const stateAbbreviationToName: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    };

    // Convert state abbreviation to full name
    const fullStateName = stateAbbreviationToName[contactInfo.state] || contactInfo.state;

    // console.log('🔄 Submitting user data:', {
    //   firstName: contactInfo.firstName,
    //   lastName: contactInfo.lastName,
    //   email: contactInfo.email,
    //   phone: contactInfo.phone,
    //   state: contactInfo.state,
    //   fullStateName: fullStateName,
    //   dateOfBirth: contactInfo.dateOfBirth
    // });

    const response = await fetch('/api/user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        state: fullStateName, // Use full state name instead of abbreviation
        dateOfBirth: contactInfo.dateOfBirth
      }),
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('success');
    } else {
      console.warn('Failed', result.error);
    }
  } catch (error) {
    console.error('Error', error);
  }
};

export default function WeightLossForm({ initialOffset = 1 }: WeightLossFormProps) {
  const router = useRouter();
  const pathname = "/c/wm/lose-weight";
  
  const [offset, setOffset] = useState<number>(initialOffset);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [ineligibilityReason, setIneligibilityReason] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URL(window.location.href).searchParams;
      const urlOffset = parseInt(searchParams.get("offset") || "1");
      if (urlOffset >= 1) {
        setOffset(urlOffset);
      }
    }
  }, []);
  
  const { 
    formData,
    markStepCompleted,
    setStepOffset
  } = useWMFormStore();
  
  const [responses, setResponses] = useState<FormResponse>({});
  const [bmi, setBmi] = useState<number | null>(null);
  const [hasTrackedSurveyStart, setHasTrackedSurveyStart] = useState<boolean>(false);
  
  useEffect(() => {
    if (responses['current-weight'] && responses['height']) {
      const calculatedBmi = calculateBMI(
        responses['current-weight'] as string, 
        responses['height'] as string
      );
      setBmi(calculatedBmi);
    }
  }, [responses['current-weight'], responses['height']]);
  
  const filteredQuestions = weightLossQuestions.filter((question) => {
    if (!question.conditionalDisplay) return true;
    return question.conditionalDisplay(responses);
  });
  
  const currentQuestionIndex = offset - 1;
  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= filteredQuestions.length - 1;
  const progressPercentage = isLastQuestion ? 100 : getProgressPercentage(offset);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentQuestion && offset > 0) {
      router.push(`${pathname}?offset=1`);
    }
  }, [currentQuestion, offset, router, pathname]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedResponses = sessionStorage.getItem("weightLossResponses");
        if (storedResponses) {
          setResponses(JSON.parse(storedResponses));
        }
      } catch (error) {
        // Handle error silently
      }
    }
  }, []);

  // Track survey start on first interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && offset === 1 && !hasTrackedSurveyStart) {
      trackSurveyStart(window.location.href);
      setHasTrackedSurveyStart(true);
    }
  }, [offset, hasTrackedSurveyStart]);
  
  const handleResponseChange = (value: any): void => {
    if (!currentQuestion) return;
    
    const updatedResponses: FormResponse = {
      ...responses,
      [currentQuestion.id]: value
    };
    
    setResponses(updatedResponses);
    
    const eligibilityCheckQuestions: string[] = [
      'age-group', 'gender', 'pregnant', 'breastfeeding', 
      'medical-conditions', 'eating-disorder', 'doctor-consultation'
    ];
    
    if (eligibilityCheckQuestions.includes(currentQuestion.id)) {
      const eligibility = checkEligibility(updatedResponses);
      
      if (!eligibility.eligible) {
        setIneligibilityReason(eligibility.reason);
      } else {
        setIneligibilityReason(null);
      }
    }
  };
  
  const storeResponses = (): void => {
    if (typeof window !== 'undefined') {
      setStepOffset(pathname, offset);
      
      try {
        sessionStorage.setItem("weightLossResponses", JSON.stringify(responses));
        sessionStorage.setItem("finalResponses", JSON.stringify(responses));
        
        if (ineligibilityReason) {
          sessionStorage.setItem("ineligibilityReason", ineligibilityReason);
        }
      } catch (error) {
        // Handle error silently
      }
    }
  };
  
  const handleContinue = (): void => {
    if (typeof window === 'undefined') return;
    
    storeResponses();
    
    if (isLastQuestion) {
      markStepCompleted(pathname);
      setIsTransitioning(true);
      
      const contactInfo = responses['contact-info'] as ContactInfoData | undefined;
      const ageGroup = responses['age-group'] as string | undefined;
      const isEligible = !ineligibilityReason;
      
      // Track survey completion with user data
      if (typeof window !== 'undefined') {
        trackSurveyCompletion(
          window.location.href,
          contactInfo,
          bmi || undefined,
          ageGroup,
          isEligible
        );
      }
      
      // Submit user data in background (fire and forget)
      if (contactInfo) {
        submitUserDataInBackground(contactInfo);
      }
      
      // Original Salesforce submission (existing functionality)
      submitToSalesforce(responses, contactInfo).catch(() => {
        // Handle error silently
      });
      
      router.push("/c/wm/results");
    } else {
      const nextOffset = offset + 1;
      const nextUrl = `${pathname}?offset=${nextOffset}`;
      window.history.pushState({}, '', nextUrl);
      setOffset(nextOffset);
    }
  };
  
  const isContinueEnabled = (): boolean => {
    if (!currentQuestion) return false;
    
    const response = responses[currentQuestion.id];
    
    if (response === undefined) return false;
    
    switch (currentQuestion.type) {
      case QuestionType.SingleSelect:
        return typeof response === "string" && response !== "";
      case QuestionType.MultiSelect:
        return Array.isArray(response) && response.length > 0;
      case QuestionType.TextInput:
        return typeof response === "string" && response.trim() !== "";
      case QuestionType.HeightInput:
        if (typeof response === "string" && response.trim() !== "") {
          try {
            const heightData = JSON.parse(response);
            return heightData.feet && heightData.inches;
          } catch {
            return false;
          }
        }
        return false;
      case QuestionType.ContactInfo:
        if (response && typeof response === "object") {
          const contactData = response as ContactInfoData;
          const validation = validateContactInfo(contactData);
          return validation.isValid;
        }
        return false;
      default:
        return false;
    }
  };
  
  const getButtonText = (): string => {
    if (isTransitioning) return "Processing...";
    if (isLastQuestion) return "Get My Results";
    if (ineligibilityReason) return "Continue to Results";
    return "Continue";
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePopState = (): void => {
        const searchParams = new URL(window.location.href).searchParams;
        const urlOffset = parseInt(searchParams.get("offset") || "1");
        setOffset(urlOffset);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Analyzing your responses...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-white px-6">
      <ProgressBar progress={progressPercentage} />

      <div className="w-full max-w-2xl mt-16 mb-24">
        <h2 className="text-4xl font-semibold text-black mb-10 text-left">
          {currentQuestion.question}
        </h2>
        
        {currentQuestion.description && (
          <p className="text-black mb-8 text-left text-lg">
            {currentQuestion.description}
          </p>
        )}
        
        {currentQuestion.id === 'height' && bmi !== null && (
          <div className={`p-4 mb-6 rounded-lg ${
            bmi < 18.5 ? 'bg-amber-100' : 
            bmi < 25 ? 'bg-green-100' : 
            bmi < 30 ? 'bg-yellow-100' : 
            'bg-orange-100'
          }`}>
            <p className="font-medium text-black">Your calculated BMI: {bmi.toFixed(1)}</p>
            <p className="text-sm mt-1 text-black">
              {bmi < 18.5 ? 'Underweight' : 
               bmi < 25 ? 'Normal weight' : 
               bmi < 30 ? 'Overweight' : 
               'Obese'}
            </p>
          </div>
        )}
        
        {ineligibilityReason && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
            <p className="font-medium text-red-700">Eligibility Notice:</p>
            <p className="text-red-600">{ineligibilityReason}</p>
            <p className="text-sm mt-2 text-black">
              You can continue with the assessment, but based on your responses, 
              our products may not be suitable for you.
            </p>
          </div>
        )}
        
        <QuestionRenderer 
          question={currentQuestion}
          value={responses[currentQuestion.id]}
          onChange={handleResponseChange}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white to-transparent pointer-events-none" style={{ 
        backgroundImage: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.5) 70%, rgba(255,255,255,0) 100%)' 
      }}></div>

      <div className="fixed bottom-6 w-full flex justify-center z-10">
        <button
          onClick={handleContinue}
          disabled={!isContinueEnabled() || isTransitioning}
          className={`text-white text-lg font-medium px-6 py-3 rounded-full w-[90%] max-w-2xl ${
            isContinueEnabled() && !isTransitioning ? "bg-black hover:bg-gray-900" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}