// src/app/(default)/subscriptions/components/PurchaseSection.tsx
import CouponInput from '@/components/CouponInput';
import { Translations } from '@/types/subscriptionDetails';
import { globalPricing } from '@/utils/pricing';
import { trackPurchaseInitiation } from '@/utils/facebookTracking';

interface PurchaseSectionProps {
  subscription: any;
  selectedVariant: any;
  selectedBase: boolean;
  appliedCouponCode: string;
  discountedPrice: number | null;
  purchaseError: string;
  error: string;
  translations: Translations;
  isProcessing: boolean;
  isLoading: boolean;
  isSomethingSelected: boolean;
  onCouponApplied: (code: string, newPrice: number, discount: number) => void;
  onCouponRemoved: () => void;
  onSubscribe: () => void;
  onErrorDismiss: () => void;
  getCurrentPrice: () => number;
  getCurrentVariantKey: () => string | undefined;
  getSubscribeButtonText: () => string;
}

export const PurchaseSection: React.FC<PurchaseSectionProps> = ({
  subscription,
  selectedVariant,
  selectedBase,
  appliedCouponCode,
  discountedPrice,
  purchaseError,
  error,
  translations,
  isProcessing,
  isLoading,
  isSomethingSelected,
  onCouponApplied,
  onCouponRemoved,
  onSubscribe,
  onErrorDismiss,
  getCurrentPrice,
  getCurrentVariantKey,
  getSubscribeButtonText
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6 md:p-8 mb-8">
      {/* Coupon Input */}
      <div className="mb-6">
        <CouponInput
          subscriptionId={subscription._id}
          variantKey={getCurrentVariantKey()}
          originalPrice={getCurrentPrice()}
          onCouponApplied={onCouponApplied}
          onCouponRemoved={onCouponRemoved}
        />
        
        {/* Show original price if coupon is applied */}
        {discountedPrice !== null && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 line-through">
              {translations.originalPrice}
              {globalPricing.formatter.formatPrice(getCurrentPrice())}
            </p>
            <p className="text-lg font-bold text-green-600">
              {translations.discountedPrice}
              {globalPricing.formatter.formatPrice(discountedPrice)}
            </p>
          </div>
        )}
      </div>
      
      {/* Purchase CTA Button */}
      <div className="mb-8">
        <button
          onClick={() => {
            // Track purchase initiation
            if (typeof window !== 'undefined' && subscription?.slug?.current) {
              const finalPrice = discountedPrice || getCurrentPrice();
              const selectedVariantTitle = selectedVariant?.title;
              
              // DEBUG: Log URL being sent to Facebook
              console.log('🔍 DEBUG: Purchase Initiation URL:', window.location.href);
              
              trackPurchaseInitiation(
                window.location.href,
                subscription.slug.current,
                subscription.title || 'Unknown Subscription',
                finalPrice,
                appliedCouponCode || undefined,
                selectedVariantTitle || undefined
              );
            }
            
            // Execute original subscribe function
            onSubscribe();
          }}
          disabled={isProcessing || isLoading || !isSomethingSelected}
          className={`w-full py-4 px-6 rounded-full text-white font-bold text-lg transition-all ${
            isProcessing || isLoading || !isSomethingSelected
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#e63946] hover:bg-[#d52d3a] shadow-md hover:shadow-lg'
          }`}
        >
          {getSubscribeButtonText()}
        </button>
        
        {/* Enhanced Error Display */}
        {(purchaseError || error) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">
                {purchaseError || error}
              </p>
            </div>
            <button
              onClick={onErrorDismiss}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              {translations.dismiss}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};