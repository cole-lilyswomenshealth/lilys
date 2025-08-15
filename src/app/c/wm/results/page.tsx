//src/app/c/wm/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { Subscription } from '@/types/subscription-page';
import WeightLossSubscriptionGrid from "../components/WeightLossSubscriptionGrid";
import { trackResultsPageView } from "@/utils/facebookTracking";

// Define component properties
interface WeightLossResultsProps {}

// Interface for featured subscription with image
interface FeaturedSubscriptionWithImage {
  subscription: Subscription | null;
  imageUrl: string;
  isLoading: boolean;
  error: string | null;
}

export default function ResultsPage({}: WeightLossResultsProps) {
  // Animation states
  const [showContent, setShowContent] = useState<boolean>(false);
  const [showFeatures, setShowFeatures] = useState<boolean>(false);
  
  const [featuredSubscription, setFeaturedSubscription] = useState<FeaturedSubscriptionWithImage>({
    subscription: null,
    imageUrl: '/images/weight-loss-product.jpg', // Default fallback image
    isLoading: true,
    error: null
  });
  
  // Fetch featured subscription - MODIFIED to specifically get semaglutide
  useEffect(() => {
    const fetchFeaturedSubscription = async (): Promise<void> => {
      try {
        // Query specifically for semaglutide subscription
        const result = await client.fetch(
          groq`*[
            _type == "subscription" && 
            slug.current == "semaglutide" &&
            isActive == true && 
            isDeleted != true
          ][0] {
            _id,
            title,
            titleEs,
            slug,
            description,
            descriptionEs,
            price,
            billingPeriod,
            customBillingPeriodMonths,
            hasVariants,
            variants[]{
              _key,
              title,
              titleEs,
              description,
              descriptionEs,
              dosageAmount,
              dosageUnit,
              price,
              compareAtPrice,
              billingPeriod,
              customBillingPeriodMonths,
              stripePriceId,
              isDefault,
              isPopular
            },
            features,
            featuresEs,
            image,
            featuredImage,
            isActive,
            isFeatured,
            stripePriceId
          }`
        );
        
        if (result) {
          // Cast the result to Subscription
          const subscription = result as Subscription;
          
          // Generate image URL based on available images, with featuredImage as priority
          let imgUrl = '/images/weight-loss-product.jpg'; // Default fallback
          
          if (subscription.featuredImage) {
            imgUrl = urlFor(subscription.featuredImage)
              .width(1000)  // Increased width for larger image
              .height(750) // Increased height for larger image
              .url();
          } else if (subscription.image) {
            imgUrl = urlFor(subscription.image)
              .width(1000)  // Increased width for larger image
              .height(750) // Increased height for larger image
              .url();
          }
          
          setFeaturedSubscription({
            subscription,
            imageUrl: imgUrl,
            isLoading: false,
            error: null
          });
        } else {
          setFeaturedSubscription({
            subscription: null,
            imageUrl: '/images/weight-loss-product.jpg',
            isLoading: false,
            error: "Semaglutide subscription not found"
          });
        }
      } catch (err) {
        console.error("Error fetching semaglutide subscription:", err);
        setFeaturedSubscription({
          subscription: null,
          imageUrl: '/images/weight-loss-product.jpg',
          isLoading: false,
          error: err instanceof Error ? err.message : "An unknown error occurred"
        });
      }
    };
    
    fetchFeaturedSubscription();
  }, []);
  
  // Sequential animations and tracking
  useEffect(() => {
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);
    
    const featuresTimer = setTimeout(() => {
      setShowFeatures(true);
    }, 1200);

    // Track results page view
    if (typeof window !== 'undefined') {
      try {
        const storedResponses = sessionStorage.getItem("weightLossResponses");
        const ineligibilityReason = sessionStorage.getItem("ineligibilityReason");
        const isEligible = !ineligibilityReason;
        
        trackResultsPageView(
          window.location.href,
          'semaglutide', // Default recommended plan
          isEligible
        );
      } catch (error) {
        // Track with minimal data if session storage fails
        trackResultsPageView(window.location.href, 'semaglutide');
      }
    }
    
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(featuresTimer);
    };
  }, []);

  // Get formatted monthly price - Shows only default variant monthly price
  const getFormattedPrice = (): React.ReactNode => {
    if (!featuredSubscription.subscription) return null;
    
    const subscription = featuredSubscription.subscription;
    
    // First check if subscription has variants and find default variant
    if (subscription.hasVariants && subscription.variants && subscription.variants.length > 0) {
      const defaultVariant = subscription.variants.find(variant => variant.isDefault);
      if (defaultVariant) {
        // Calculate monthly price from default variant
        let monthlyPrice: number;
        const variantPrice = defaultVariant.price;
        const variantBillingPeriod = defaultVariant.billingPeriod;
        const variantCustomMonths = defaultVariant.customBillingPeriodMonths;
        
        switch (variantBillingPeriod) {
          case 'monthly':
            monthlyPrice = variantPrice;
            break;
          case 'three_month':
            monthlyPrice = variantPrice / 3;
            break;
          case 'six_month':
            monthlyPrice = variantPrice / 6;
            break;
          case 'annually':
            monthlyPrice = variantPrice / 12;
            break;
          case 'other':
            monthlyPrice = variantCustomMonths ? variantPrice / variantCustomMonths : variantPrice;
            break;
          default:
            monthlyPrice = variantPrice;
        }
        
        // Format monthly price
        const formattedMonthlyPrice = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(monthlyPrice);
        
        return <span className="text-2xl font-bold">{formattedMonthlyPrice}/month</span>;
      }
    }
    
    // Fallback to base subscription price if no default variant found
    const price = subscription.price;
    const billingPeriod = subscription.billingPeriod;
    const customBillingPeriodMonths = subscription.customBillingPeriodMonths;
    
    let monthlyPrice: number;
    
    switch (billingPeriod) {
      case 'monthly':
        monthlyPrice = price;
        break;
      case 'three_month':
        monthlyPrice = price / 3;
        break;
      case 'six_month':
        monthlyPrice = price / 6;
        break;
      case 'annually':
        monthlyPrice = price / 12;
        break;
      case 'other':
        monthlyPrice = customBillingPeriodMonths ? price / customBillingPeriodMonths : price;
        break;
      default:
        monthlyPrice = price;
    }
    
    // Format monthly price
    const formattedMonthlyPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monthlyPrice);
    
    return <span className="text-2xl font-bold">{formattedMonthlyPrice}/month</span>;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Logo Only - No Link */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Image 
            src="/Logo.png" 
            alt="Logo" 
            width={100} 
            height={40} 
            className="h-8 sm:h-10 w-auto"
          />
        </motion.div>
      </div>
      
      {/* Hero Section with Gradient Background - More compact on mobile */}
      <div className="relative pt-14 sm:pt-0 min-h-[28vh] sm:min-h-[40vh] flex items-center justify-center bg-gradient-to-r from-[#ffe6f0] to-[#fff8f9] overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-[10%] w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-[#ff92b5] opacity-10 blur-3xl"></div>
        <div className="absolute bottom-10 right-[15%] w-32 sm:w-40 h-32 sm:h-40 rounded-full bg-[#e63946] opacity-10 blur-3xl"></div>
        
        <div className="container mx-auto px-4 py-6 sm:py-16 relative z-10">
          <motion.div 
            className="text-center max-w-xs sm:max-w-lg md:max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 bg-white text-[#e63946] rounded-full mb-3 sm:mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">Your Personalized Recommendation</h1>
            <div className="h-1 w-12 sm:w-24 bg-[#e63946] mx-auto mb-3 sm:mb-6"></div>
            <p className="text-base sm:text-xl text-gray-700">
              Based on your assessment, we've found the perfect weight loss solution for you.
            </p>
          </motion.div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#ffffff">
            <path d="M0,60 C240,100 480,0 720,30 C960,60 1200,100 1440,80 L1440,100 L0,100 Z"></path>
          </svg>
        </div>
      </div>
      
      {/* Main Content Section - Adjusted margins for better image prominence */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Note from Lilys Section - More compact on mobile */}
          <motion.div
            className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-10 border-l-4 border-[#fe92b5]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#ffe6f0] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-black mb-1 sm:mb-2">Why We Chose This For You</h3>
                <p className="text-sm sm:text-base text-black">
                  Based on your responses, we've selected a weight management program that's tailored to your specific needs. 
                  At Lilys, we believe that personalized care leads to better results. This recommendation takes into account 
                  your health profile, weight management goals, and personal preferences to provide you with the most effective solution.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Featured Product Section - Enhanced for better mobile selling power */}
          <motion.div 
            className="bg-white rounded-xl shadow-xl overflow-hidden mb-6 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ duration: 0.7 }}
          >
            {/* Header section - More eye-catching */}
            <div className="bg-gradient-to-r from-[#e63946] to-[#ff4d6d] p-3 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">
                  {featuredSubscription.subscription?.title || "Semaglutide"}
                </h2>
                <span className="px-3 py-1 bg-white text-[#e63946] text-xs sm:text-sm font-semibold rounded-full inline-block w-max">
                  Recommended
                </span>
              </div>
              <p className="opacity-90 mt-1 text-sm sm:text-base">Personalized weight management program</p>
            </div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Left side - Image - ENHANCED FOR MOBILE with larger, more prominent display */}
              <div className="lg:w-1/2 p-2 sm:p-4">
                <div className="aspect-[4/3] w-full relative rounded-lg overflow-hidden shadow-lg">
                  {featuredSubscription.isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-300 border-t-[#fe92b5] rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <Image 
                      src={featuredSubscription.imageUrl}
                      alt={featuredSubscription.subscription?.title || "Semaglutide"}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 90vw, 600px"
                      priority
                    />
                  )}
                </div>
                
                {/* Image Disclaimer - More subtle */}
                <p className="text-xs text-gray-500 italic mt-1 text-center">
                Product image for illustration. Actual product appearance may vary when shipped.
                </p>
                
                {/* Price and billing details - mobile only - More prominent */}
                {featuredSubscription.subscription && (
                  <div className="mt-3 flex items-center justify-center lg:hidden">
                    <span className="text-[#e63946] text-xl sm:text-2xl font-bold">
                      {getFormattedPrice()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Right side - Features first, then CTA - More compact on mobile */}
              <div className="lg:w-1/2 p-3 sm:p-6">
                {/* Price and billing details - desktop only */}
                {featuredSubscription.subscription && (
                  <div className="mb-4 hidden lg:flex lg:items-center">
                    <span className="text-[#e63946]">
                      {getFormattedPrice()}
                    </span>
                  </div>
                )}
                
                {/* Features Section - More compact */}
                <div className="mb-4 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-black mb-2 sm:mb-4">
                    Program Features:
                  </h3>
                  
                  {/* Features with improved spacing for mobile */}
                  <div className="space-y-2 sm:space-y-3">
                    {featuredSubscription.subscription && featuredSubscription.subscription.features && 
                     featuredSubscription.subscription.features.length > 0 ? (
                      // Render actual features from Sanity
                      featuredSubscription.subscription.features.map((feature, index) => (
                        <motion.div 
                          key={`feature-${index}`}
                          className="flex items-start gap-2 sm:gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: showFeatures ? 1 : 0, x: showFeatures ? 0 : -10 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ffe6f0] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-sm sm:text-base text-black">{feature.featureText}</p>
                        </motion.div>
                      ))
                    ) : (
                      // Fallback features in case none are available from Sanity
                      <>
                        <motion.div 
                          className="flex items-start gap-2 sm:gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: showFeatures ? 1 : 0, x: showFeatures ? 0 : -10 }}
                          transition={{ duration: 0.4, delay: 0 }}
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ffe6f0] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <p className="text-sm sm:text-base text-black">Clinically proven results with 15-20% average weight loss</p>
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-start gap-2 sm:gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: showFeatures ? 1 : 0, x: showFeatures ? 0 : -10 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ffe6f0] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <p className="text-sm sm:text-base text-black">Medical provider support with personalized treatment</p>
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-start gap-2 sm:gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: showFeatures ? 1 : 0, x: showFeatures ? 0 : -10 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#ffe6f0] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm sm:text-base text-black">Convenient home delivery with virtual check-ins</p>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* CTA Section - Only view details link, no purchase button */}
                <div className="space-y-2 sm:space-y-4">
                  {/* View Details Link - Full width */}
                  {featuredSubscription.subscription?.slug && featuredSubscription.subscription.slug.current && (
                    <div>
                      <Link 
                        href={`/subscriptions/${featuredSubscription.subscription.slug.current}`}
                        className="block w-full text-center bg-black text-white font-semibold py-3.5 sm:py-4 px-4 sm:px-6 rounded-full hover:bg-gray-900 transition-colors text-base sm:text-lg shadow-lg hover:shadow-xl"
                      >
                        View Plan Details
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Weight Loss Subscription Grid - UPDATED with centering logic */}
          <motion.div 
            className="mt-6 sm:mt-16 mb-6 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showFeatures ? 1 : 0, y: showFeatures ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-center text-black mb-4 sm:mb-8">
              Our Weight Loss Subscription Plans
            </h2>
            
            {/* Updated grid container with centering */}
            <div className="bg-[#f9f9f9] rounded-xl p-3 sm:p-8">
              <div className="flex justify-center">
                <div className="w-full max-w-none">
                  <WeightLossSubscriptionGrid className="flex justify-center" />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Minimal Footer with proper responsive spacing */}
          <div className="bg-gray-50 py-5 sm:py-8 text-center mt-8 sm:mt-16 rounded-lg">
            <div className="container mx-auto px-4">
              <p className="text-xs text-gray-400 mb-2">
                Results may vary. These statements have not been evaluated by the FDA.
              </p>
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Lilys. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}