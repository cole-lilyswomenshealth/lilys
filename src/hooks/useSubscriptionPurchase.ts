// src/hooks/useSubscriptionPurchase.ts
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { verifySession, refreshSession } from '@/lib/auth';

interface SubscriptionPurchaseResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export function useSubscriptionPurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, checkSession } = useAuthStore();

  // Function to purchase a subscription plan
  const purchaseSubscription = useCallback(async (subscriptionId: string): Promise<SubscriptionPurchaseResult> => {
    // First, verify that the session is valid (cookie check)
    let hasValidSession = await verifySession();
    
    // If session is invalid but we think we're authenticated, try to refresh
    if (!hasValidSession && isAuthenticated) {
      // Try to refresh the session
      const refreshed = await refreshSession();
      if (refreshed) {
        hasValidSession = true;
      } else {
        // If refresh failed, update our auth state
        await checkSession();
      }
    }
    
    // Check if user is authenticated
    if (!isAuthenticated || !hasValidSession || !user) {
      const errorMessage = "You must be logged in to purchase a subscription";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Store return URL in sessionStorage to help with redirecting after auth
      sessionStorage.setItem('loginReturnUrl', '/appointment');
      
      // Make API request to create subscription purchase
      const response = await fetch('/api/stripe/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
          userId: user.id,
          userEmail: user.email
        }),
        // Include credentials to ensure cookies are sent with the request
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }
      
      // Return the Stripe checkout URL
      return {
        success: true,
        sessionId: result.sessionId,
        url: result.url
      };
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during subscription purchase';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, checkSession]);
  
  return {
    isLoading,
    error,
    purchaseSubscription
  };
}