//src/app/account/subscriptions/components/EmptyState.tsx
"use client";
import Link from "next/link";

export const EmptyState = () => {
  return (
    <div className="p-6 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-pink-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">No Subscriptions</h3>
      <p className="text-gray-600 mb-6">You don't have any active subscriptions yet.</p>
      <Link href="/subscriptions" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
        Browse Subscription Plans
      </Link>
    </div>
  );
};

export default EmptyState;