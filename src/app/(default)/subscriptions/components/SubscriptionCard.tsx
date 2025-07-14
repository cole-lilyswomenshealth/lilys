// src/app/(default)/subscriptions/components/SubscriptionCard.tsx
// Updated with enterprise-level pricing logic

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SubscriptionFeature, BlockContent, SubscriptionVariant } from '@/types/subscription-page';
import useTranslations from '@/hooks/useTranslations';
import Modal from '@/components/Modal';
import PortableText from '@/components/PortableText';
import { urlFor } from '@/sanity/lib/image';
import { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { globalPricing, PricingUtils } from '@/utils/pricing';

interface SubscriptionCardProps {
  id: string;
  title: string;
  titleEs?: string;
  description?: BlockContent[]; 
  descriptionEs?: BlockContent[]; 
  price: number;
  billingPeriod: string;
  customBillingPeriodMonths?: number | null;
  monthlyDisplayPrice?: number | null; // Added for Sanity field
  hasVariants?: boolean;
  variants?: SubscriptionVariant[];
  features: SubscriptionFeature[];
  featuresEs?: SubscriptionFeature[];
  categories?: Array<{
    _id: string;
    title: string;
    titleEs?: string;
    slug?: {
      current: string;
    };
  }>;
  cardType?: 'basic' | 'standard' | 'premium';
  slug?: {
    current: string;
  };
  image?: SanityImageSource;
  featuredImage?: SanityImageSource;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  id,
  title,
  titleEs,
  description,
  descriptionEs,
  price,
  billingPeriod,
  customBillingPeriodMonths,
  monthlyDisplayPrice, // Added parameter
  hasVariants = false,
  variants = [],
  features = [],
  featuresEs = [],
  categories,
  cardType = 'basic',
  slug,
  image,
  featuredImage
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  const { t, currentLanguage } = useTranslations();

  // Get the content based on current language
  const getLocalizedTitle = (): string => {
    if (currentLanguage === 'es' && titleEs) {
      return titleEs;
    }
    return title;
  };
  
  const getLocalizedDescription = (): BlockContent[] | undefined => {
    if (currentLanguage === 'es' && descriptionEs && descriptionEs.length > 0) {
      return descriptionEs;
    }
    return description;
  };
  
  const getLocalizedFeatures = (): SubscriptionFeature[] => {
    if (currentLanguage === 'es' && featuresEs && featuresEs.length > 0) {
      return featuresEs;
    }
    return features;
  };

  // Enterprise-level pricing logic
  const getBestPricingDisplay = (): {
    mainPrice: string;
    subtitle: string;
    savingsText?: string;
    originalPrice?: string;
  } => {
    // If has variants, get the best pricing from all options
    if (hasVariants && variants && variants.length > 0) {
      // Check for default variant first
      const defaultVariant = variants.find(v => v.isDefault);
      if (defaultVariant) {
        // Use monthlyDisplayPrice from Sanity
        const monthlyPrice = defaultVariant.monthlyDisplayPrice;
        
        // Only proceed if we have a valid monthly display price
        if (monthlyPrice !== null && monthlyPrice !== undefined) {
        const formattedMonthly = globalPricing.formatter.formatPrice(monthlyPrice);
        const monthText = currentLanguage === 'es' ? '/mes' : '/month';
        const mainPrice = `${formattedMonthly}${monthText}`;
        
        const formattedTotal = globalPricing.formatter.formatPrice(defaultVariant.price);
        let subtitle = '';
        
        switch (defaultVariant.billingPeriod) {
          case 'monthly':
            subtitle = currentLanguage === 'es' ? 'Plan mensual' : 'Monthly plan';
            break;
          case 'three_month':
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} cada 3 meses` 
              : `${formattedTotal} every 3 months`;
            break;
          case 'six_month':
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} cada 6 meses` 
              : `${formattedTotal} every 6 months`;
            break;
          case 'annually':
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} por año` 
              : `${formattedTotal} per year`;
            break;
          case 'other':
            const months = defaultVariant.customBillingPeriodMonths || 1;
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} cada ${months} mes${months > 1 ? 'es' : ''}`
              : `${formattedTotal} every ${months} month${months > 1 ? 's' : ''}`;
            break;
        }

        return {
          mainPrice,
          subtitle
        };
        }
      }

      // If no default variant, find the one with lowest monthly price
      let bestVariant = variants[0];
      let lowestMonthlyPrice = Infinity;
      
      for (const variant of variants) {
        const monthlyPrice = variant.monthlyDisplayPrice;
        
        // Skip variants without monthly display price
        if (monthlyPrice === null || monthlyPrice === undefined) {
          continue;
        }
        
        if (monthlyPrice < lowestMonthlyPrice) {
          lowestMonthlyPrice = monthlyPrice;
          bestVariant = variant;
        }
      }
      
      const formattedMonthly = globalPricing.formatter.formatPrice(lowestMonthlyPrice);
      const monthText = currentLanguage === 'es' ? '/mes' : '/month';
      const mainPrice = `${formattedMonthly}${monthText}`;
      
      const formattedTotal = globalPricing.formatter.formatPrice(bestVariant.price);
      let subtitle = '';
      
      switch (bestVariant.billingPeriod) {
        case 'monthly':
          subtitle = currentLanguage === 'es' ? 'Plan mensual' : 'Monthly plan';
          break;
        case 'three_month':
          subtitle = currentLanguage === 'es' 
            ? `${formattedTotal} cada 3 meses` 
            : `${formattedTotal} every 3 months`;
          break;
        case 'six_month':
          subtitle = currentLanguage === 'es' 
            ? `${formattedTotal} cada 6 meses` 
            : `${formattedTotal} every 6 months`;
          break;
        case 'annually':
          subtitle = currentLanguage === 'es' 
            ? `${formattedTotal} por año` 
            : `${formattedTotal} per year`;
          break;
        case 'other':
          const months = bestVariant.customBillingPeriodMonths || 1;
          subtitle = currentLanguage === 'es' 
            ? `${formattedTotal} cada ${months} mes${months > 1 ? 'es' : ''}`
            : `${formattedTotal} every ${months} month${months > 1 ? 's' : ''}`;
          break;
      }

      return {
        mainPrice,
        subtitle
      };
    } else {
      // Single pricing option - use monthlyDisplayPrice from Sanity
      const monthlyPrice = monthlyDisplayPrice;
      
      // Only proceed if we have a valid monthly display price
      if (monthlyPrice !== null && monthlyPrice !== undefined) {
        const formattedMonthly = globalPricing.formatter.formatPrice(monthlyPrice);
        const monthText = currentLanguage === 'es' ? '/mes' : '/month';
        const mainPrice = `${formattedMonthly}${monthText}`;
        
        const formattedTotal = globalPricing.formatter.formatPrice(price);
        let subtitle = '';
        
        switch (billingPeriod) {
          case 'monthly':
            subtitle = currentLanguage === 'es' ? 'Plan mensual' : 'Monthly plan';
            break;
          case 'three_month':
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} cada 3 meses` 
              : `${formattedTotal} every 3 months`;
            break;
          case 'six_month':
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} cada 6 meses` 
              : `${formattedTotal} every 6 months`;
            break;
          case 'annually':
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} por año` 
              : `${formattedTotal} per year`;
            break;
          case 'other':
            const months = customBillingPeriodMonths || 1;
            subtitle = currentLanguage === 'es' 
              ? `${formattedTotal} cada ${months} mes${months > 1 ? 'es' : ''}`
              : `${formattedTotal} every ${months} month${months > 1 ? 's' : ''}`;
            break;
        }

        return {
          mainPrice,
          subtitle
        };
      }
      
      // Fallback if no monthly display price is available
      return {
        mainPrice: '$0/month',
        subtitle: ''
      };
    }
  };

  // Check if description exists and has content
  const hasDescription = (): boolean => {
    const localizedDescription = getLocalizedDescription();
    
    if (!localizedDescription || !Array.isArray(localizedDescription) || localizedDescription.length === 0) {
      return false;
    }
    
    return localizedDescription.some(block => 
      block && block.children && Array.isArray(block.children) && 
      block.children.some(child => child && child.text && child.text.trim().length > 0)
    );
  };

  // Get view details text
  const getViewDetailsText = (): string => {
    return currentLanguage === 'es' ? 'Ver Detalles' : 'View Details';
  };

  // Get image URL or fallback
  const getImageUrl = (): string => {
    if (featuredImage) {
      return urlFor(featuredImage).width(600).height(450).url();
    }
    if (image) {
      return urlFor(image).width(600).height(450).url();
    }
    
    const fallbackImages: Record<string, string> = {
      'basic': '/images/subscription-basic.jpg',
      'standard': '/images/subscription-standard.jpg',
      'premium': '/images/subscription-premium.jpg'
    };
    
    return fallbackImages[cardType] || '/images/subscription-placeholder.jpg';
  };

  // All cards use same color - E63946
  const getBorderColor = (): string => {
    return 'border-[#e63946]';
  };

  const pricingDisplay = getBestPricingDisplay();

  return (
    <>
      <div 
        className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border ${getBorderColor()} ${isHovered ? 'transform -translate-y-2' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="w-full">
          <div className="relative h-72 w-full overflow-hidden">
            <Image
              src={getImageUrl()}
              alt={getLocalizedTitle()}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
              style={{ objectPosition: 'center' }}
            />
            
            {/* Savings Badge */}
            {pricingDisplay.savingsText && (
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {pricingDisplay.savingsText}
                </span>
              </div>
            )}
          </div>
          
          {/* Title and Price Below Image */}
          <div className={`p-4 border-b ${getBorderColor()}`}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{getLocalizedTitle()}</h3>
            
            {/* Main pricing display */}
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#e63946]">
                {pricingDisplay.mainPrice}
              </span>
              {/* REMOVED: Subtitle showing whole price */}
            </div>
          </div>
        </div>
        
        {/* Features and Actions */}
        <div className="p-5">
          {/* Features */}
          <div className="space-y-3 mb-6">
            {getLocalizedFeatures().filter(feature => feature && feature.featureText).slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#e63946] flex items-center justify-center text-white text-xs">
                  ✓
                </div>
                <div className="text-gray-700 text-sm">{feature.featureText}</div>
              </div>
            ))}
            
            {/* Show more features indicator */}
            {getLocalizedFeatures().length > 4 && (
              <div className="text-xs text-gray-500 italic">
                {currentLanguage === 'es' 
                  ? `+${getLocalizedFeatures().length - 4} características más`
                  : `+${getLocalizedFeatures().length - 4} more features`
                }
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {/* View Details Link */}
            {slug && slug.current && (
              <Link 
                href={`/subscriptions/${slug.current}`}
                className="block w-full text-center py-3 px-4 border-2 border-[#e63946] text-[#e63946] hover:bg-[#e63946] hover:text-white rounded-lg transition-colors font-medium"
              >
                {getViewDetailsText()}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Description Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={getLocalizedTitle()}
          className="max-w-2xl"
        >
          <div className="subscription-details">
            {/* Price information */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="font-bold text-xl text-[#e63946]">
                {pricingDisplay.mainPrice}
              </p>
              <p className="text-sm text-gray-600">
                {pricingDisplay.subtitle}
              </p>
              {pricingDisplay.savingsText && (
                <p className="text-sm text-green-600 font-medium">
                  {pricingDisplay.savingsText}
                </p>
              )}
            </div>
            
            {/* Description content */}
            <div className="description-content text-gray-700">
              {hasDescription() ? (
                <PortableText value={getLocalizedDescription() || []} />
              ) : null}
            </div>
            
            {/* View Full Details button in modal if slug is available */}
            {slug && slug.current && (
              <div className="mt-6 text-center">
                <Link
                  href={`/subscriptions/${slug.current}`}
                  className="inline-block px-6 py-2 bg-[#e63946] text-white rounded-full hover:bg-[#d52d3a] transition-colors"
                >
                  {t('subscriptions.viewFullDetails')}
                </Link>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default SubscriptionCard;