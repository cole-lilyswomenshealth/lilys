// src/lib/subscription-helpers.ts

import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { Subscription, SubscriptionCategory } from '@/types/subscription-page';

/**
 * Gets subscription by slug
 */
export async function getSubscriptionBySlug(slug: string): Promise<Subscription | null> {
  try {
    const subscription = await client.fetch(
      groq`*[_type == "subscription" && slug.current == $slug && isActive == true && isDeleted != true][0] {
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
        features[]{
          featureText,
          _key
        },
        featuresEs[]{
          featureText,
          _key
        },
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
          descriptionEs
        }
      }`,
      { slug }
    );
    
    return subscription || null;
  } catch (error) {
    console.error("Error fetching subscription by slug:", error);
    return null;
  }
}

/**
 * Gets all subscriptions for listing pages
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  try {
    const subscriptions = await client.fetch(
      groq`*[_type == "subscription" && isActive == true && isDeleted != true] | order(displayOrder asc, _createdAt desc) {
        _id,
        title,
        titleEs,
        slug,
        description,
        descriptionEs,
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
          price,
          monthlyDisplayPrice,
          compareAtPrice,
          billingPeriod,
          customBillingPeriodMonths,
          isDefault,
          isPopular
        },
        features[]{
          featureText,
          _key
        },
        featuresEs[]{
          featureText,
          _key
        },
        image,
        featuredImage,
        isFeatured,
        "categories": categories[]->{ 
          _id, 
          title, 
          titleEs,
          slug
        }
      }`
    );
    
    return subscriptions || [];
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    return [];
  }
}

/**
 * Gets featured subscriptions
 */
export async function getFeaturedSubscriptions(): Promise<Subscription[]> {
  try {
    const subscriptions = await client.fetch(
      groq`*[_type == "subscription" && isFeatured == true && isActive == true && isDeleted != true] | order(displayOrder asc, _createdAt desc) {
        _id,
        title,
        titleEs,
        slug,
        description,
        descriptionEs,
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
          price,
          monthlyDisplayPrice,
          compareAtPrice,
          billingPeriod,
          customBillingPeriodMonths,
          isDefault,
          isPopular
        },
        features[]{
          featureText,
          _key
        },
        featuresEs[]{
          featureText,
          _key
        },
        image,
        featuredImage,
        isFeatured,
        "categories": categories[]->{ 
          _id, 
          title, 
          titleEs,
          slug
        }
      }`
    );
    
    return subscriptions || [];
  } catch (error) {
    console.error("Error fetching featured subscriptions:", error);
    return [];
  }
}

/**
 * Gets subscriptions by category
 */
export async function getSubscriptionsByCategory(categorySlug: string): Promise<Subscription[]> {
  try {
    const subscriptions = await client.fetch(
      groq`*[_type == "subscription" && isActive == true && isDeleted != true && count(categories[@->slug.current == $categorySlug]) > 0] | order(displayOrder asc, _createdAt desc) {
        _id,
        title,
        titleEs,
        slug,
        description,
        descriptionEs,
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
          price,
          monthlyDisplayPrice,
          compareAtPrice,
          billingPeriod,
          customBillingPeriodMonths,
          isDefault,
          isPopular
        },
        features[]{
          featureText,
          _key
        },
        featuresEs[]{
          featureText,
          _key
        },
        image,
        featuredImage,
        isFeatured,
        "categories": categories[]->{ 
          _id, 
          title, 
          titleEs,
          slug
        }
      }`,
      { categorySlug }
    );
    
    return subscriptions || [];
  } catch (error) {
    console.error("Error fetching subscriptions by category:", error);
    return [];
  }
}

/**
 * Gets related subscriptions (same category, excluding current)
 */
export async function getRelatedSubscriptions(subscription: Subscription): Promise<Subscription[]> {
  try {
    if (!subscription.categories || subscription.categories.length === 0) {
      return [];
    }

    const categoryIds = subscription.categories.map(cat => cat._id);

    const relatedSubscriptions = await client.fetch(
      groq`*[_type == "subscription" && isActive == true && isDeleted != true && _id != $currentId && count(categories[@._ref in $categoryIds]) > 0] | order(displayOrder asc, _createdAt desc) [0...4] {
        _id,
        title,
        titleEs,
        slug,
        description,
        descriptionEs,
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
          price,
          monthlyDisplayPrice,
          compareAtPrice,
          billingPeriod,
          customBillingPeriodMonths,
          isDefault,
          isPopular
        },
        features[]{
          featureText,
          _key
        },
        featuresEs[]{
          featureText,
          _key
        },
        image,
        featuredImage,
        isFeatured,
        "categories": categories[]->{ 
          _id, 
          title, 
          titleEs,
          slug
        }
      }`,
      { 
        currentId: subscription._id,
        categoryIds: categoryIds
      }
    );
    
    return relatedSubscriptions || [];
  } catch (error) {
    console.error("Error fetching related subscriptions:", error);
    return [];
  }
}

/**
 * Gets all subscription slugs for static generation
 */
export async function getAllSubscriptionSlugs(): Promise<string[]> {
  try {
    const slugs = await client.fetch(
      groq`*[_type == "subscription" && isActive == true && isDeleted != true].slug.current`
    );
    
    return slugs || [];
  } catch (error) {
    console.error("Error fetching subscription slugs:", error);
    return [];
  }
}

/**
 * Gets plain text description from block content
 */
export function getPlainTextDescription(
  blocks: any[] = [], 
  maxLength: number = 150
): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return '';
  }
  
  try {
    // Extract text from blocks
    const text = blocks
      .map(block => {
        if (block._type !== 'block' || !block.children) {
          return '';
        }
        return block.children
          .map((child: any) => child.text)
          .join('');
      })
      .join(' ');
    
    // Trim and limit to maxLength
    return text.length > maxLength
      ? text.substring(0, maxLength).trim() + '...'
      : text.trim();
  } catch (error) {
    console.error('Error extracting plain text from blocks:', error);
    return '';
  }
}