"use client";

import { useSearchParams } from "next/navigation";
import ForgotPassword from "@/components/Auth/ForgotPassword";
import { Suspense } from "react";

interface ForgotPasswordProps {
  returnUrl?: string | null;
}

// Create a client component that uses the search params
const ForgotPasswordWithParams = () => {
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get('returnUrl');

  return <ForgotPassword returnUrl={returnUrl} />;
};

// Main page component using Suspense boundary
const ForgotPasswordPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Suspense fallback={<div>Loading...</div>}>
        <ForgotPasswordWithParams />
      </Suspense>
    </div>
  );
};

export default ForgotPasswordPage;