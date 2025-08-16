// src/app/api/admin/price-comparison/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { client as sanityClient } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import { isAdminUser } from '@/utils/adminAuthServer';

// Initialize Stripe with proper error handling
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: undefined, // Use latest API version
});

// Strict TypeScript interfaces
interface SanityVariant {
  _key: string;
  title: string;
  titleEs?: string;
  price: number;
  billingPeriod: string;
  customBillingPeriodMonths?: number | null;
  stripePriceId?: string;
}

interface SanitySubscription {
  _id: string;
  title: string;
  price: number;
  billingPeriod: string;
  customBillingPeriodMonths?: number | null;
  stripePriceId?: string;
  hasVariants?: boolean;
  variants?: SanityVariant[];
}

interface StripePrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  active: boolean;
}

export interface PriceComparisonRow {
  subscriptionId: string;
  subscriptionTitle: string;
  variantKey?: string;
  variantTitle?: string;
  sanityPrice: number;
  stripePrice?: number;
  stripePriceId?: string;
  status: 'OK' | 'DIFFERENT' | 'MISSING' | 'NOT_FOUND' | 'ERROR';
  statusMessage: string;
  needsAction: boolean;
  actionType?: 'sync' | 'create';
  error?: string;
}

export interface PriceComparisonResponse {
  success: boolean;
  rows: PriceComparisonRow[];
  error?: string;
}

// Helper function to get Stripe price safely
async function getStripePrice(priceId: string): Promise<StripePrice | null> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return {
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      active: price.active,
    };
  } catch (error) {
    // Error fetching Stripe price
    return null;
  }
}

// Helper function to create comparison row
function createComparisonRow(
  subscription: SanitySubscription,
  variant?: SanityVariant,
  stripePrice?: StripePrice | null,
  error?: string
): PriceComparisonRow {
  const isVariant = Boolean(variant);
  const sanityPrice = isVariant ? variant!.price : subscription.price;
  const stripePriceId = isVariant ? variant!.stripePriceId : subscription.stripePriceId;
  const title = isVariant ? variant!.title : 'Base Plan';

  // Determine status
  if (error) {
    return {
      subscriptionId: subscription._id,
      subscriptionTitle: subscription.title,
      variantKey: variant?._key,
      variantTitle: title,
      sanityPrice,
      stripePriceId,
      status: 'ERROR',
      statusMessage: `Error: ${error}`,
      needsAction: false,
      error,
    };
  }

  if (!stripePriceId) {
    return {
      subscriptionId: subscription._id,
      subscriptionTitle: subscription.title,
      variantKey: variant?._key,
      variantTitle: title,
      sanityPrice,
      status: 'MISSING',
      statusMessage: 'No Stripe Price ID in Sanity',
      needsAction: true,
      actionType: 'create',
    };
  }

  if (!stripePrice) {
    return {
      subscriptionId: subscription._id,
      subscriptionTitle: subscription.title,
      variantKey: variant?._key,
      variantTitle: title,
      sanityPrice,
      stripePriceId,
      status: 'NOT_FOUND',
      statusMessage: 'Stripe Price ID not found or deleted',
      needsAction: true,
      actionType: 'create',
    };
  }

  const stripePriceAmount = stripePrice.unit_amount ? stripePrice.unit_amount / 100 : 0;
  
  if (stripePriceAmount !== sanityPrice) {
    return {
      subscriptionId: subscription._id,
      subscriptionTitle: subscription.title,
      variantKey: variant?._key,
      variantTitle: title,
      sanityPrice,
      stripePrice: stripePriceAmount,
      stripePriceId,
      status: 'DIFFERENT',
      statusMessage: `Sanity: $${sanityPrice} | Stripe: $${stripePriceAmount}`,
      needsAction: true,
      actionType: 'sync',
    };
  }

  return {
    subscriptionId: subscription._id,
    subscriptionTitle: subscription.title,
    variantKey: variant?._key,
    variantTitle: title,
    sanityPrice,
    stripePrice: stripePriceAmount,
    stripePriceId,
    status: 'OK',
    statusMessage: `$${sanityPrice} - Prices match`,
    needsAction: false,
  };
}

export async function GET(req: Request): Promise<NextResponse<PriceComparisonResponse>> {
  try {
    // Verify admin authentication
    const authResult = await isAdminUser(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active subscriptions from Sanity
    const subscriptions = await sanityClient.fetch<SanitySubscription[]>(
      groq`*[_type == "subscription" && isActive == true && isDeleted != true] {
        _id,
        title,
        price,
        billingPeriod,
        customBillingPeriodMonths,
        stripePriceId,
        hasVariants,
        variants[]{
          _key,
          title,
          titleEs,
          price,
          billingPeriod,
          customBillingPeriodMonths,
          stripePriceId
        }
      }`
    );


    const rows: PriceComparisonRow[] = [];

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        // Always process base subscription first (FIXED: this was missing)
        if (!subscription.hasVariants || !subscription.variants || subscription.variants.length === 0) {
          // Process base subscription (no variants)
          let stripePrice: StripePrice | null = null;
          let error: string | undefined;

          if (subscription.stripePriceId) {
            stripePrice = await getStripePrice(subscription.stripePriceId);
            if (!stripePrice) {
              error = 'Price not found in Stripe';
            }
          }

          const row = createComparisonRow(subscription, undefined, stripePrice, error);
          rows.push(row);
        } else {
          // Process base subscription even if variants exist
          let baseStripePrice: StripePrice | null = null;
          let baseError: string | undefined;

          if (subscription.stripePriceId) {
            baseStripePrice = await getStripePrice(subscription.stripePriceId);
            if (!baseStripePrice) {
              baseError = 'Base price not found in Stripe';
            }
          }

          const baseRow = createComparisonRow(subscription, undefined, baseStripePrice, baseError);
          rows.push(baseRow);

          // Process each variant
          for (const variant of subscription.variants) {
            let variantStripePrice: StripePrice | null = null;
            let variantError: string | undefined;

            if (variant.stripePriceId) {
              variantStripePrice = await getStripePrice(variant.stripePriceId);
              if (!variantStripePrice) {
                variantError = 'Variant price not found in Stripe';
              }
            }

            const variantRow = createComparisonRow(subscription, variant, variantStripePrice, variantError);
            rows.push(variantRow);
          }
        }
      } catch (subscriptionError) {
        // Error processing subscription
        const errorRow = createComparisonRow(
          subscription,
          undefined,
          undefined,
          subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error'
        );
        rows.push(errorRow);
      }
    }


    return NextResponse.json({
      success: true,
      rows,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        rows: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}