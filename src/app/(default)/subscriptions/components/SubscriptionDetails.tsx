// src/app/(default)/subscriptions/components/SubscriptionDetails.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Subscription, SubscriptionVariant } from '@/types/subscription-page';
import useTranslations from '@/hooks/useTranslations';
import { useSubscriptionPurchase } from '@/hooks/useSubscriptionPurchase';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionPricing } from '@/hooks/useSubscriptionPricing';
import { Translations } from '@/types/subscriptionDetails';
import { trackSubscriptionView, trackVariantSelection } from '@/utils/facebookTracking';

// Import sub-components
import { SubscriptionBreadcrumb } from './SubscriptionBreadcrumb';
import { VariantSelector } from './VariantSelector';
import { SubscriptionImage } from './SubscriptionImage';
import { PurchaseSection } from './PurchaseSection';
import { FeaturesList } from './FeaturesList';
import { DescriptionSection } from './DescriptionSection';

interface SubscriptionDetailsProps {
  subscription: Subscription;
}

/**
 * Enterprise-level error boundary for component isolation
 */
const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const resetError = useCallback(() => setError(null), []);
  
  const captureError = useCallback((error: Error, context?: string) => {
    console.error(`SubscriptionDetails Error ${context ? `[${context}]` : ''}:`, error);
    setError(error);
  }, []);

  return { error, resetError, captureError };
};

/**
 * Enterprise-level performance monitoring hook
 */
const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development' && renderTime > 100) {
        console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

/**
 * Enterprise-level data validation hook
 */
const useSubscriptionValidation = (subscription: Subscription) => {
  return useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Critical validation
    if (!subscription._id) errors.push('Missing subscription ID');
    if (!subscription.title) errors.push('Missing subscription title');
    if (typeof subscription.price !== 'number' || subscription.price < 0) {
      errors.push('Invalid subscription price');
    }

    // Business logic validation
    if (subscription.hasVariants && (!subscription.variants || subscription.variants.length === 0)) {
      warnings.push('Subscription marked as having variants but no variants found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: errors.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'ok'
    };
  }, [subscription]);
};

export default function SubscriptionDetails({ subscription }: SubscriptionDetailsProps) {
  // Enterprise monitoring and error handling
  const { error, resetError, captureError } = useErrorBoundary();
  const validation = useSubscriptionValidation(subscription);
  usePerformanceMonitoring('SubscriptionDetails');

  // State management with enterprise validation
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedVariant, setSelectedVariant] = useState<SubscriptionVariant | null>(null);
  const [selectedBase, setSelectedBase] = useState<boolean>(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [purchaseError, setPurchaseError] = useState<string>('');
  const [hasTrackedInitialView, setHasTrackedInitialView] = useState<boolean>(false);

  // Hooks with error boundaries
  const { t, currentLanguage } = useTranslations();
  const { purchaseSubscription, isLoading, error: purchaseHookError, clearError } = useSubscriptionPurchase();
  const { user, isAuthenticated, checkSession } = useAuthStore();

  // Enterprise validation check
  useEffect(() => {
    if (!validation.isValid) {
      captureError(new Error(`Subscription validation failed: ${validation.errors.join(', ')}`), 'validation');
    }
    
    if (validation.warnings.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('Subscription warnings:', validation.warnings);
    }
  }, [validation, captureError]);

  // Memoized translations with performance optimization
  const translations: Translations = useMemo(() => ({
    home: currentLanguage === 'es' ? 'Inicio' : 'Home',
    subscriptions: currentLanguage === 'es' ? 'Suscripciones' : 'Subscriptions',
    included: currentLanguage === 'es' ? 'Qué Incluye' : "What's Included",
    description: currentLanguage === 'es' ? 'Descripción' : 'Description',
    viewMoreDetails: currentLanguage === 'es' ? 'Ver Más Detalles' : 'View More Details',
    relatedPlans: currentLanguage === 'es' ? 'Planes Relacionados' : 'Related Plans',
    viewPlan: currentLanguage === 'es' ? 'Ver Plan' : 'View Plan',
    selectVariant: currentLanguage === 'es' ? 'Seleccione una opción' : 'Select an option',
    dosage: currentLanguage === 'es' ? 'Dosis' : 'Dosage',
    bestValue: currentLanguage === 'es' ? 'Mejor Valor' : 'Best Value',
    mostPopular: currentLanguage === 'es' ? 'Más Popular' : 'Most Popular',
    savePercent: currentLanguage === 'es' ? 'Ahorre' : 'Save',
    baseOption: currentLanguage === 'es' ? 'Opción Base' : 'Base Option',
    standardPlan: currentLanguage === 'es' ? 'Plan Estándar' : 'Standard Plan',
    imageDisclaimer: currentLanguage === 'es' ? 'La imagen es ilustrativa. El producto enviado puede variar en apariencia.' : 'Product image for illustration. Actual product appearance may vary when shipped.',
    lowestPrice: currentLanguage === 'es' ? 'Precio Más Bajo' : 'Lowest Price',
    totalPerMonth: currentLanguage === 'es' ? 'total por mes' : 'total per month',
    totalFor3Months: currentLanguage === 'es' ? 'total por 3 meses' : 'total for 3 months',
    totalFor6Months: currentLanguage === 'es' ? 'total por 6 meses' : 'total for 6 months',
    totalFor1Year: currentLanguage === 'es' ? 'total por 1 año' : 'total for 1 year',
    total: currentLanguage === 'es' ? 'total' : 'total',
    month: currentLanguage === 'es' ? '/mes' : '/month',
    monthPlan: currentLanguage === 'es' ? 'Plan de 1 mes' : '1 Month Plan',
    originalPrice: currentLanguage === 'es' ? 'Precio original: ' : 'Original price: ',
    discountedPrice: currentLanguage === 'es' ? 'Precio con descuento: ' : 'Discounted price: ',
    processing: currentLanguage === 'es' ? 'Procesando...' : 'Processing...',
    buyNow: currentLanguage === 'es' ? 'Comprar Ahora' : 'Buy Now',
    dismiss: currentLanguage === 'es' ? 'Cerrar' : 'Dismiss'
  }), [currentLanguage]);

  // Get pricing information with error handling
  const pricing = useSubscriptionPricing(
    subscription,
    selectedVariant,
    selectedBase,
    discountedPrice,
    currentLanguage
  );

  // Enterprise-level variant initialization with comprehensive logic
  useEffect(() => {
    try {
      if (subscription.hasVariants && subscription.variants && subscription.variants.length > 0) {
        // Business logic: Find default or best variant
        const defaultVariant = subscription.variants.find(variant => variant.isDefault);
        
        if (defaultVariant) {
          setSelectedVariant(defaultVariant);
          setSelectedBase(false);
        } else {
          // Fallback to lowest price variant with null safety
          let lowestMonthlyPrice = Infinity;
          let bestVariant = subscription.variants[0];
          
          // Calculate base subscription monthly price safely
          const baseMonthlyPrice = subscription.monthlyDisplayPrice || 
            (subscription.price / (subscription.billingPeriod === 'annually' ? 12 : 
                                   subscription.billingPeriod === 'three_month' ? 3 : 
                                   subscription.billingPeriod === 'six_month' ? 6 : 1));
          
          if (baseMonthlyPrice < lowestMonthlyPrice) {
            lowestMonthlyPrice = baseMonthlyPrice;
            setSelectedBase(true);
            setSelectedVariant(null);
          } else {
            setSelectedBase(false);
          }
          
          // Evaluate variants with error handling
          for (const variant of subscription.variants) {
            if (!variant || typeof variant.price !== 'number') continue;
            
            const monthlyPrice = variant.monthlyDisplayPrice || 
              (variant.price / (variant.billingPeriod === 'annually' ? 12 : 
                                variant.billingPeriod === 'three_month' ? 3 : 
                                variant.billingPeriod === 'six_month' ? 6 : 1));
            
            if (monthlyPrice < lowestMonthlyPrice) {
              lowestMonthlyPrice = monthlyPrice;
              bestVariant = variant;
              setSelectedBase(false);
            }
          }
          
          if (!selectedBase) {
            setSelectedVariant(bestVariant);
          }
        }
      } else {
        // No variants, use base subscription
        setSelectedBase(true);
        setSelectedVariant(null);
      }
    } catch (error) {
      captureError(error as Error, 'variant-initialization');
      // Fallback to safe state
      setSelectedBase(true);
      setSelectedVariant(null);
    }
  }, [subscription, captureError]);

  // Track subscription page view with enterprise-level error handling
  useEffect(() => {
    if (!hasTrackedInitialView && typeof window !== 'undefined' && subscription?.slug?.current) {
      try {
        const currentPrice = selectedVariant ? selectedVariant.price : subscription.price;
        
        // DEBUG: Log URL being sent to Facebook
        console.log('🔍 DEBUG: Tracking URL:', window.location.href);
        console.log('🔍 DEBUG: Window location pathname:', window.location.pathname);
        
        trackSubscriptionView(
          window.location.href,
          subscription.slug.current,
          subscription.title || 'Unknown Subscription',
          currentPrice
        );
        setHasTrackedInitialView(true);
      } catch (error) {
        captureError(error as Error, 'subscription-view-tracking');
      }
    }
  }, [subscription, selectedVariant, hasTrackedInitialView, captureError]);

  // Track variant selection changes
  useEffect(() => {
    if (selectedVariant && typeof window !== 'undefined' && subscription?.slug?.current && hasTrackedInitialView) {
      try {
        const dosage = selectedVariant.dosageAmount && selectedVariant.dosageUnit 
          ? `${selectedVariant.dosageAmount}${selectedVariant.dosageUnit}`
          : undefined;
          
        // DEBUG: Log URL being sent to Facebook
        console.log('🔍 DEBUG: Variant Selection URL:', window.location.href);
        
        trackVariantSelection(
          window.location.href,
          subscription.slug.current,
          subscription.title || 'Unknown Subscription',
          selectedVariant.title || 'Unknown Variant',
          selectedVariant.price,
          selectedVariant.billingPeriod || 'monthly',
          dosage
        );
      } catch (error) {
        captureError(error as Error, 'variant-selection-tracking');
      }
    }
  }, [selectedVariant, subscription, hasTrackedInitialView, captureError]);

  // Auth state management with enterprise security
  useEffect(() => {
    if (!isAuthenticated) {
      checkSession().catch(error => {
        captureError(error as Error, 'auth-check');
      });
    }
  }, [isAuthenticated, checkSession, captureError]);

  // Error synchronization with enterprise logging
  useEffect(() => {
    if (purchaseHookError) {
      setPurchaseError(purchaseHookError);
      captureError(new Error(purchaseHookError), 'purchase-hook');
    }
  }, [purchaseHookError, captureError]);

  // Memoized localization functions with performance optimization
  const getLocalizedTitle = useCallback((): string => {
    if (currentLanguage === 'es' && subscription.titleEs && subscription.titleEs.trim() !== '') {
      return subscription.titleEs;
    }
    return subscription.title || 'Unknown Subscription';
  }, [currentLanguage, subscription.title, subscription.titleEs]);

  const getLocalizedFeatures = useCallback(() => {
    try {
      if (currentLanguage === 'es' && subscription.featuresEs && subscription.featuresEs.length > 0) {
        return subscription.featuresEs;
      }
      return subscription.features || [];
    } catch (error) {
      captureError(error as Error, 'features-localization');
      return [];
    }
  }, [currentLanguage, subscription.features, subscription.featuresEs, captureError]);

  const getLocalizedDescription = useCallback(() => {
    try {
      if (currentLanguage === 'es' && subscription.descriptionEs && subscription.descriptionEs.length > 0) {
        return subscription.descriptionEs;
      }
      return subscription.description || [];
    } catch (error) {
      captureError(error as Error, 'description-localization');
      return [];
    }
  }, [currentLanguage, subscription.description, subscription.descriptionEs, captureError]);

  // Enterprise-level variant selection with validation
  const handleVariantSelection = useCallback((variant: SubscriptionVariant | null, isBase: boolean = false) => {
    try {
      if (isBase) {
        setSelectedBase(true);
        setSelectedVariant(null);
      } else {
        setSelectedBase(false);
        setSelectedVariant(variant);
      }
      
      // Clear coupon state when switching variants
      setAppliedCouponCode('');
      setDiscountedPrice(null);
      setDiscountAmount(0);
      setPurchaseError('');
      resetError();
    } catch (error) {
      captureError(error as Error, 'variant-selection');
    }
  }, [captureError, resetError]);

  // Enterprise-level purchase handler with comprehensive error handling
  const handlePurchase = useCallback(async () => {
    if (isProcessing || isLoading) return;
    
    try {
      // Reset all error states
      setPurchaseError('');
      clearError();
      resetError();
      
      // Enterprise security: Store current path safely
      const currentPath = window.location.pathname;
      try {
        sessionStorage.setItem('subscriptionReturnPath', currentPath);
      } catch (storageError) {
        console.warn('SessionStorage unavailable:', storageError);
      }
      
      // Authentication flow with enterprise security
      if (!isAuthenticated) {
        try {
          sessionStorage.setItem('pendingSubscriptionId', subscription._id);
          
          if (subscription.hasVariants && selectedVariant && selectedVariant._key && !selectedBase) {
            sessionStorage.setItem('pendingVariantKey', selectedVariant._key);
          }
          
          if (appliedCouponCode) {
            sessionStorage.setItem('pendingCouponCode', appliedCouponCode);
          }
        } catch (storageError) {
          console.warn('SessionStorage unavailable for pending data:', storageError);
        }
        
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `/login?returnUrl=${returnUrl}`;
        return;
      }
      
      setIsProcessing(true);
      
      try {
        sessionStorage.setItem('loginReturnUrl', '/appointment');
      } catch (storageError) {
        console.warn('SessionStorage unavailable for return URL:', storageError);
      }
      
      // Enterprise purchase flow with comprehensive validation
      const result = await purchaseSubscription(
        subscription._id,
        selectedBase ? undefined : selectedVariant?._key,
        appliedCouponCode || undefined
      );
      
      if (result.success && result.url) {
        window.location.href = result.url;
      } else if (result.error) {
        setPurchaseError(result.error);
        captureError(new Error(result.error), 'purchase-flow');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setPurchaseError(errorMessage);
      captureError(err as Error, 'purchase-handler');
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    isLoading,
    isAuthenticated,
    subscription._id,
    selectedVariant,
    selectedBase,
    appliedCouponCode,
    purchaseSubscription,
    clearError,
    resetError,
    captureError
  ]);

  // Enterprise helper functions with null safety
  const getCurrentPrice = useCallback((): number => {
    return pricing?.effectivePrice ?? 0;
  }, [pricing]);

  const getCurrentVariantKey = useCallback((): string | undefined => {
    return selectedVariant?._key;
  }, [selectedVariant]);

  const getSubscribeButtonText = useCallback((): string => {
    if (isProcessing || isLoading) {
      return translations.processing;
    }
    return translations.buyNow;
  }, [isProcessing, isLoading, translations]);

  const isSomethingSelected = selectedVariant !== null || selectedBase;

  // Enterprise error boundary rendering
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Subscription Temporarily Unavailable
          </h2>
          <p className="text-red-600 mb-4">
            We're experiencing technical difficulties. Please try again later.
          </p>
          <button
            onClick={resetError}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Validation failure rendering
  if (!validation.isValid) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Invalid Subscription Data
          </h2>
          <p className="text-yellow-600">
            This subscription contains invalid data and cannot be displayed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <SubscriptionBreadcrumb 
        title={getLocalizedTitle()}
        translations={translations}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Left Column */}
        <div className="space-y-6">
          <SubscriptionImage 
            subscription={subscription}
            selectedVariant={selectedVariant}
            selectedBase={selectedBase}
            pricing={pricing}
            translations={translations}
            discountedPrice={discountedPrice}
          />

          <DescriptionSection 
            description={getLocalizedDescription()}
            translations={translations}
            showEmptyState={true}
            maxLength={5000}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <VariantSelector 
            subscription={subscription}
            selectedVariant={selectedVariant}
            selectedBase={selectedBase}
            translations={translations}
            currentLanguage={currentLanguage}
            onVariantSelection={handleVariantSelection}
          />

          <PurchaseSection 
            subscription={subscription}
            selectedVariant={selectedVariant}
            selectedBase={selectedBase}
            appliedCouponCode={appliedCouponCode}
            discountedPrice={discountedPrice}
            purchaseError={purchaseError}
            error={purchaseHookError || ''}
            translations={translations}
            isProcessing={isProcessing}
            isLoading={isLoading}
            isSomethingSelected={isSomethingSelected}
            onCouponApplied={(code: string, newPrice: number, discount: number) => {
              setAppliedCouponCode(code);
              setDiscountedPrice(newPrice);
              setDiscountAmount(discount);
            }}
            onCouponRemoved={() => {
              setAppliedCouponCode('');
              setDiscountedPrice(null);
              setDiscountAmount(0);
            }}
            onSubscribe={handlePurchase}
            onErrorDismiss={() => {
              setPurchaseError('');
              clearError();
              resetError();
            }}
            getCurrentPrice={getCurrentPrice}
            getCurrentVariantKey={getCurrentVariantKey}
            getSubscribeButtonText={getSubscribeButtonText}
          />

          <FeaturesList 
            features={getLocalizedFeatures()}
            translations={translations}
          />
        </div>
      </div>
    </motion.div>
  );
}