// src/app/(default)/subscriptions/components/SubscriptionGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import SubscriptionCard from './SubscriptionCard';
import { SubscriptionsData, Subscription, SubscriptionCategory } from '@/types/subscription-page';
import useTranslations from '@/hooks/useTranslations';

interface SubscriptionGridProps extends SubscriptionsData {}

const SubscriptionGrid: React.FC<SubscriptionGridProps> = ({
  categories,
  subscriptionsByCategory,
  uncategorizedSubscriptions,
  featuredSubscriptions,
  allSubscriptions,
  error
}) => {
  const [loading, setLoading] = useState(false);
  const { t, currentLanguage } = useTranslations();

  // Get localized category title
  const getLocalizedCategoryTitle = (category: SubscriptionCategory): string => {
    if (currentLanguage === 'es' && category.titleEs) {
      return category.titleEs;
    }
    return category.title;
  };

  // Get localized category description
  const getLocalizedCategoryDescription = (category: SubscriptionCategory): string | undefined => {
    if (currentLanguage === 'es' && category.descriptionEs) {
      return category.descriptionEs;
    }
    return category.description;
  };

  // Assign card type based on position in grid
  const getCardType = (index: number) => {
    const types = ['basic', 'premium', 'standard'] as const;
    return types[index % 3];
  };

  // Get grid classes based on number of items to center them
  const getGridClasses = (itemCount: number): string => {
    if (itemCount === 1) {
      return 'grid grid-cols-1 max-w-sm mx-auto';
    } else if (itemCount === 2) {
      return 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-8';
    } else if (itemCount === 3) {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto gap-8';
    } else {
      // For 4+ items, use responsive grid that centers content
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto gap-8';
    }
  };

  // FALLBACK: If no categories were found, just show all subscriptions
  if (categories.length === 0 && allSubscriptions.length > 0) {
    return (
      <div className="container mx-auto px-4 py-12 relative">
        {/* Decorative elements */}
        <div className="absolute top-10 left-0 w-32 h-32 rounded-full bg-[#ffe6f0] opacity-30 blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-[#f9dde5] opacity-20 blur-2xl"></div>
        
        <h2 className="text-3xl font-bold mb-8 text-center relative z-10 text-[#e63946]">
          <span className="inline-block relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#e63946]">
            {currentLanguage === 'es' ? 'Nuestros Planes' : 'Our Plans'}
          </span>
        </h2>
        
        <div className={`${getGridClasses(allSubscriptions.length)} relative z-10`}>
          {allSubscriptions.map((subscription, index) => (
            <SubscriptionCard 
              key={subscription._id}
              id={subscription._id}
              title={subscription.title}
              titleEs={subscription.titleEs}
              description={subscription.description}
              descriptionEs={subscription.descriptionEs}
              price={subscription.price}
              monthlyDisplayPrice={subscription.monthlyDisplayPrice}
              billingPeriod={subscription.billingPeriod}
              customBillingPeriodMonths={subscription.customBillingPeriodMonths}
              hasVariants={subscription.hasVariants || false}
              variants={subscription.variants || []}
              features={subscription.features || []}
              featuresEs={subscription.featuresEs || []}
              categories={subscription.categories}
              slug={subscription.slug}
              cardType={getCardType(index)}
              image={subscription.image}
              featuredImage={subscription.featuredImage}
            />
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full bg-[#ffe6f0] opacity-20 blur-2xl"></div>
        <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full bg-[#f0f7ff] opacity-10 blur-2xl"></div>
        
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg text-gray-600">
            {currentLanguage === 'es' ? 'Cargando planes...' : 'Loading plans...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-red-600">
          <p className="text-lg">
            {currentLanguage === 'es' 
              ? 'Error al cargar los planes de suscripción.' 
              : 'Error loading subscription plans.'
            }
          </p>
          <p className="text-sm mt-2">
            {currentLanguage === 'es' 
              ? 'Por favor, intenta de nuevo más tarde.' 
              : 'Please try again later.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Display subscriptions grouped by category */}
      {categories.map((category) => {
        const categorySubscriptions = subscriptionsByCategory[category._id] || [];
        
        if (categorySubscriptions.length === 0) {
          return null; // Skip empty categories
        }

        return (
          <div key={category._id} className="mb-16 relative">
            {/* Decorative elements for each category */}
            <div className="absolute top-0 left-10 w-32 h-32 rounded-full bg-[#ffe6f0] opacity-30 blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-28 h-28 rounded-full bg-[#f0f7ff] opacity-20 blur-xl"></div>
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-bold mb-2 text-[#e63946]">
                <span className="inline-block relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#e63946]">
                  {getLocalizedCategoryTitle(category)}
                </span>
              </h2>
              {getLocalizedCategoryDescription(category) && (
                <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                  {getLocalizedCategoryDescription(category)}
                </p>
              )}
            </div>
            
            <div className={`${getGridClasses(categorySubscriptions.length)} relative z-10`}>
              {categorySubscriptions.map((subscription, index) => (
                <SubscriptionCard 
                  key={subscription._id}
                  id={subscription._id}
                  title={subscription.title}
                  titleEs={subscription.titleEs}
                  description={subscription.description}
                  descriptionEs={subscription.descriptionEs}
                  price={subscription.price}
                  monthlyDisplayPrice={subscription.monthlyDisplayPrice}
                  billingPeriod={subscription.billingPeriod}
                  customBillingPeriodMonths={subscription.customBillingPeriodMonths}
                  hasVariants={subscription.hasVariants || false}
                  variants={subscription.variants || []}
                  features={subscription.features || []}
                  featuresEs={subscription.featuresEs || []}
                  categories={subscription.categories}
                  slug={subscription.slug}
                  cardType={getCardType(index)}
                  image={subscription.image}
                  featuredImage={subscription.featuredImage}
                />
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Display uncategorized subscriptions if any */}
      {uncategorizedSubscriptions.length > 0 && (
        <div className="mb-16 relative">
          {/* Decorative elements for uncategorized section */}
          <div className="absolute top-0 right-1/3 w-32 h-32 rounded-full bg-[#ffedf0] opacity-30 blur-2xl"></div>
          <div className="absolute bottom-10 left-1/3 w-28 h-28 rounded-full bg-[#f0f7ff] opacity-20 blur-xl"></div>
          
          <h2 className="text-2xl font-bold mb-8 text-center relative z-10 text-[#e63946]">
            <span className="inline-block relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#e63946]">
              {t('subscriptions.otherPlans')}
            </span>
          </h2>
          
          <div className={`${getGridClasses(uncategorizedSubscriptions.length)} relative z-10`}>
            {uncategorizedSubscriptions.map((subscription, index) => (
              <SubscriptionCard 
                key={subscription._id}
                id={subscription._id}
                title={subscription.title}
                titleEs={subscription.titleEs}
                description={subscription.description}
                descriptionEs={subscription.descriptionEs}
                price={subscription.price}
                monthlyDisplayPrice={subscription.monthlyDisplayPrice}
                billingPeriod={subscription.billingPeriod}
                customBillingPeriodMonths={subscription.customBillingPeriodMonths}
                hasVariants={subscription.hasVariants || false}
                variants={subscription.variants || []}
                features={subscription.features || []}
                featuresEs={subscription.featuresEs || []}
                categories={subscription.categories}
                slug={subscription.slug}
                cardType={getCardType(index)}
                image={subscription.image}
                featuredImage={subscription.featuredImage}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionGrid;