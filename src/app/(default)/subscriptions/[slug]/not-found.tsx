// src/app/(default)/subscriptions/[slug]/not-found.tsx
"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SubscriptionNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-[#fff1f2] mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="#e63946" 
              className="w-12 h-12"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscription Not Found</h1>
          
          <p className="text-gray-600 mb-8">
            We couldn't find the subscription plan you're looking for. It may have been removed or the URL might be incorrect.
          </p>
          
          <Link 
            href="/subscriptions" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-[#e63946] hover:bg-[#d52d3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e63946]"
          >
            View All Subscriptions
          </Link>
        </motion.div>
      </div>
    </div>
  );
}