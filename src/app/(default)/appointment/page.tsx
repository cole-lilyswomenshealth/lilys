// src/app/(default)/appointment/page.tsx
'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppointmentForm from '@/components/AppointmentForm';
import QualiphyWidgetAuthWrapper from '@/components/QualiphyWidgetAuthWrapper';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { verifySession, refreshSession } from '@/lib/auth';

// Main content component
const AppointmentContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, checkSession } = useAuthStore();
  const { syncSubscriptionStatuses } = useSubscriptionStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const hasProcessedParams = useRef<boolean>(false);

  // Handle URL parameters and subscription syncing only once after mount
  useEffect(() => {
    const handleSubscriptionRedirect = async () => {
      // Skip if already processed or processing
      if (hasProcessedParams.current || isProcessing) return;
      setIsProcessing(true);

      try {
        // Double-check authentication state before proceeding
        if (!isAuthenticated) {
          await checkSession();
        }
        
        // Get URL parameters
        const success = searchParams?.get('subscription_success') === 'true';
        const sessionId = searchParams?.get('session_id');
        
        // Processing subscription redirect parameters
        
        // If we have a successful subscription payment & user
        if (success && sessionId && user?.id) {
          setSyncMessage("Verifying your subscription status...");
          
          // Verify the session is still valid
          const hasValidSession = await verifySession();
          if (!hasValidSession) {
            // Session invalid, refreshing...
            await refreshSession();
            await checkSession();
          }
          
          // Trigger a sync with Stripe to ensure subscription is active
          await syncSubscriptionStatuses(user.id);
          setSyncMessage("Subscription verified successfully!");
          
          // Remove the query parameters from the URL for cleaner UX
          setTimeout(() => {
            router.replace('/appointment');
            setSyncMessage(null);
          }, 2000);
        }
      } catch (err) {
        console.error("Error processing subscription redirect:", err);
        setSyncMessage(null);
      } finally {
        // Mark that we've processed parameters to avoid duplicate processing
        hasProcessedParams.current = true;
        setIsProcessing(false);
      }
    };
    
    handleSubscriptionRedirect();
  }, [user, isAuthenticated, checkSession, syncSubscriptionStatuses, router, searchParams]);

  return (
    <main className="bg-white">
      {/* Status message for subscription verification */}
      {syncMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 shadow-md border-l-4 border-green-500 p-4 rounded-r-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{syncMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Standardized styling matching About page */}
      <div style={{ background: "#F7F7F7" }}>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 
              className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
              style={{ color: "#e63946" }}
            >
              Online Consultation
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-700">
              Connect with our healthcare providers for your virtual consultation
            </p>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-1 bg-gradient-to-r from-[#e63946] to-[#ff4d6d]"></div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-[#e63946] mb-4">Start Your Consultation</h2>
                  <AppointmentForm />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
                <div className="p-1 bg-[#e63946]"></div>
                <div className="px-6 py-5">
                  <h2 className="text-lg font-semibold text-[#e63946] mb-4">Before Your Consultation</h2>
                  <ul className="space-y-3">
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-gray-700">Find a quiet, private space with good lighting</span>
                    </li>
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-gray-700">Ensure your internet connection is stable</span>
                    </li>
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-gray-700">Have your medical history ready</span>
                    </li>
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-gray-700">Write down any questions you want to ask</span>
                    </li>
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-gray-700">Test your camera and microphone</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
                <div className="p-1 bg-[#ff758f]"></div>
                <div className="px-6 py-5">
                  <h2 className="text-lg font-semibold text-[#e63946] mb-4">Technical Requirements</h2>
                  <ul className="space-y-3">
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-700">Up-to-date browser (Chrome, Firefox, or Safari)</span>
                    </li>
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-700">Webcam and microphone</span>
                    </li>
                    <li className="flex">
                      <svg
                        className="h-5 w-5 text-[#ff4d6d] flex-shrink-0 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-700">Stable internet connection (minimum 1 Mbps)</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/account" className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-[#e63946] to-[#ff4d6d] text-white hover:shadow-lg transition-all">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                  </svg>
                  Back to Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// Main page component with Suspense boundary and auth wrapper
export default function AppointmentAccessPage() {
  return (
    <QualiphyWidgetAuthWrapper>
      <Suspense fallback={<div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
        <AppointmentContent />
      </Suspense>
    </QualiphyWidgetAuthWrapper>
  );
}