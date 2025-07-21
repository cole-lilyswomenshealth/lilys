// src/app/(default)/subscriptions/components/VariantSelector.tsx
import { SubscriptionVariant } from '@/types/subscription-page';
import { Translations } from '@/types/subscriptionDetails';
import { globalPricing } from '@/utils/pricing';

interface VariantSelectorProps {
  subscription: any;
  selectedVariant: SubscriptionVariant | null;
  selectedBase: boolean;
  translations: Translations;
  currentLanguage: string;
  onVariantSelection: (variant: SubscriptionVariant | null, isBase?: boolean) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  subscription,
  selectedVariant,
  selectedBase,
  translations,
  currentLanguage,
  onVariantSelection
}) => {
  
  const getMonthlyPriceDisplay = (
    price: number,
    billingPeriod: string,
    customBillingPeriodMonths?: number | null,
    monthlyDisplayPrice?: number | null
  ): string => {
    // Use monthlyDisplayPrice if available, otherwise calculate
    const displayPrice = monthlyDisplayPrice || globalPricing.calculateMonthlyPrice(
      price, 
      billingPeriod, 
      customBillingPeriodMonths
    );
    
    const formattedPrice = globalPricing.formatter.formatPrice(displayPrice);
    return `${formattedPrice}${translations.month}`;
  };

  const getTotalPriceDisplay = (
    price: number,
    billingPeriod: string,
    customBillingPeriodMonths?: number | null
  ): string => {
    const formattedPrice = globalPricing.formatter.formatPrice(price);
    const totalText = currentLanguage === 'es' ? 'total' : 'total';
    return `${formattedPrice} ${totalText}`;
  };

  const getDiscountPercentage = (compareAtPrice: number | undefined, price: number): number | null => {
    if (!compareAtPrice || compareAtPrice <= price) return null;
    return globalPricing.calculateDiscountPercentage(compareAtPrice, price);
  };

  const getVariantBadge = (variant: SubscriptionVariant): React.ReactNode | null => {
    if (variant.billingPeriod === 'three_month') {
      return (
        <span className="inline-block bg-[#e63946] text-white text-xs px-2 py-0.5 rounded-full mt-1">
          {translations.mostPopular}
        </span>
      );
    }
    
    return null;
  };

  const getLocalizedVariantTitle = (variant: SubscriptionVariant): string => {
    if (currentLanguage === 'es' && variant.titleEs && variant.titleEs.trim() !== '') {
      return variant.titleEs;
    }
    return variant.title || 'Untitled Plan';
  };

  const getLocalizedVariantDescription = (variant: SubscriptionVariant): string => {
    if (currentLanguage === 'es' && variant.descriptionEs && variant.descriptionEs.trim() !== '') {
      return variant.descriptionEs;
    }
    return variant.description || '';
  };

  // Clean title function to remove unwanted characters
  const cleanTitle = (title: string): string => {
    if (!title) return '';
    return title.replace(/[-_]/g, ' ').trim();
  };

  // Don't render if no variants
  if (!subscription.hasVariants || !subscription.variants || subscription.variants.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {translations.selectVariant}
      </h3>
      
      <div className="space-y-3">
        {/* Base Subscription Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-[#e63946] 
            ${selectedBase && !selectedVariant
              ? 'border-[#e63946] bg-[#fff8f8]' 
              : 'border-gray-200'}`}
          onClick={() => onVariantSelection(null, true)}
        >
          <div className="flex justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {translations.monthPlan}
              </h4>
            </div>
            <div className="text-right">
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {getTotalPriceDisplay(
                    subscription.price,
                    subscription.billingPeriod,
                    subscription.customBillingPeriodMonths
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {getMonthlyPriceDisplay(
                    subscription.price, 
                    subscription.billingPeriod, 
                    subscription.customBillingPeriodMonths,
                    subscription.monthlyDisplayPrice
                  )}
                </p>
              </div>
              {subscription.compareAtPrice && subscription.compareAtPrice > subscription.price && (
                <div className="mt-1">
                  <span className="text-xs text-gray-500 line-through">
                    {globalPricing.formatter.formatPrice(subscription.compareAtPrice)}
                  </span>
                  <span className="text-xs text-green-600 ml-1">
                    -{getDiscountPercentage(subscription.compareAtPrice, subscription.price)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variant Options */}
        {subscription.variants.map((variant: SubscriptionVariant) => {
          const variantTitle = getLocalizedVariantTitle(variant);
          const variantDescription = getLocalizedVariantDescription(variant);
          
          return (
            <div 
              key={variant._key || variant.title}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-[#e63946] 
                ${selectedVariant && selectedVariant._key === variant._key && !selectedBase
                  ? 'border-[#e63946] bg-[#fff8f8]' 
                  : 'border-gray-200'}`}
              onClick={() => onVariantSelection(variant, false)}
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {cleanTitle(variantTitle)}
                  </h4>
                  {variantDescription && (
                    <p className="text-sm text-gray-900 mt-1">
                      {variantDescription}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {getTotalPriceDisplay(
                        variant.price,
                        variant.billingPeriod,
                        variant.customBillingPeriodMonths
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getMonthlyPriceDisplay(
                        variant.price, 
                        variant.billingPeriod, 
                        variant.customBillingPeriodMonths,
                        variant.monthlyDisplayPrice
                      )}
                    </p>
                  </div>
                  {getVariantBadge(variant)}
                  {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500 line-through">
                        {globalPricing.formatter.formatPrice(variant.compareAtPrice)}
                      </span>
                      <span className="text-xs text-green-600 ml-1">
                        -{getDiscountPercentage(variant.compareAtPrice, variant.price)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
