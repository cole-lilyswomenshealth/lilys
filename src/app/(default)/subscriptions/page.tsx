// src/app/(default)/subscriptions/page.tsx
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { Metadata } from 'next';
import SubscriptionGrid from './components/SubscriptionGrid';
import { SubscriptionsData, Subscription, SubscriptionCategory } from '@/types/subscription-page';
import PageHeader from '@/components/PageHeader';
import FacebookTracker from './components/FacebookTracker';

export const metadata: Metadata = {
  title: 'Subscription Plans',
  description: 'Choose a subscription plan that best fits your needs',
};

// Enhanced function to fetch subscriptions with variants and FAQ items
async function getCategoriesWithSubscriptions(): Promise<SubscriptionsData> {
  try {
    // First fetch all subscriptions with translations, variants, and FAQ items
    const subscriptions: Subscription[] = await client.fetch(
      groq`*[_type == "subscription" && isActive == true && isDeleted != true] {
        _id,
        title,
        titleEs,
        slug,
        description,
        descriptionEs,
        faqItems[]{
          _key,
          question,
          questionEs,
          answer,
          answerEs
        },
        price,
        monthlyDisplayPrice,
        compareAtPrice,
        billingPeriod,
        customBillingPeriodMonths,
        isDefault,
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
          monthlyDisplayPrice,
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
        stripePriceId,
        stripeProductId,
        "categories": categories[]->{ 
          _id, 
          title, 
          titleEs,
          slug, 
          description, 
          descriptionEs,
          displayOrder 
        }
      }`
    );
    
    // Fetch all categories to ensure we display them in correct order
    const categories: SubscriptionCategory[] = await client.fetch(
      groq`*[_type == "subscriptionCategory"] | order(displayOrder asc) {
        _id,
        title,
        titleEs,
        slug,
        description,
        descriptionEs,
        displayOrder
      }`
    );
    
    // Extract all featured subscriptions
    const featuredSubscriptions = subscriptions.filter(
      subscription => subscription.isFeatured
    );
    
    // Group subscriptions by category
    const subscriptionsByCategory: Record<string, Subscription[]> = {};
    categories.forEach(category => {
      subscriptionsByCategory[category._id] = [];
    });
    
    // Add subscriptions to their respective categories
    const uncategorizedSubscriptions: Subscription[] = [];
    
    subscriptions.forEach(subscription => {
      if (subscription.categories && subscription.categories.length > 0) {
        subscription.categories.forEach(category => {
          if (subscriptionsByCategory[category._id]) {
            subscriptionsByCategory[category._id].push(subscription);
          }
        });
      } else {
        // Add to uncategorized if no categories
        uncategorizedSubscriptions.push(subscription);
      }
    });
    
    return {
      categories,
      subscriptionsByCategory,
      uncategorizedSubscriptions,
      featuredSubscriptions,
      allSubscriptions: subscriptions
    };
    
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return {
      categories: [],
      subscriptionsByCategory: {},
      uncategorizedSubscriptions: [],
      featuredSubscriptions: [],
      allSubscriptions: [],
      error: error instanceof Error ? 
        error.message : String(error)
    };
  }
}

export default async function SubscriptionsPage() {
  const { 
    categories, 
    subscriptionsByCategory, 
    uncategorizedSubscriptions,
    featuredSubscriptions,
    allSubscriptions,
    error
  } = await getCategoriesWithSubscriptions();

  return (
    <div className="relative overflow-hidden">
      <FacebookTracker />
      
      {/* Subtle decorative elements for the page */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#ffe6f0] opacity-10 blur-3xl"></div>
      <div className="absolute top-40 right-0 w-96 h-96 rounded-full bg-[#f9dde5] opacity-20 blur-3xl"></div>
      
      {/* Using our simplified PageHeader component */}
      <PageHeader 
        title="Subscription Plans"
        subtitle="Choose a subscription plan that best fits your needs and enjoy exclusive benefits"
      />

      {/* Main content with white background */}
      <div className="relative py-12 bg-white">
        {/* Middle section bubbles */}
        <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full bg-[#f0f7ff] opacity-30 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-[#ffeef2] opacity-40 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SubscriptionGrid 
            categories={categories}
            subscriptionsByCategory={subscriptionsByCategory}
            uncategorizedSubscriptions={uncategorizedSubscriptions}
            featuredSubscriptions={featuredSubscriptions}
            allSubscriptions={allSubscriptions}
            error={error}
          />
        </div>
      </div>
      
      {/* Bottom bubbles */}
      <div className="absolute bottom-10 left-1/3 w-60 h-60 rounded-full bg-[#ffe6f0] opacity-30 blur-3xl"></div>
      <div className="absolute -bottom-20 right-1/4 w-48 h-48 rounded-full bg-[#f9dde5] opacity-20 blur-2xl"></div>
    </div>
  );
}