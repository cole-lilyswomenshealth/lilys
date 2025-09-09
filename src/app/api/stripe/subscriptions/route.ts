// src/app/api/stripe/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { client as sanityClient } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';
import { getAuthenticatedUser } from "@/utils/apiAuth";
import { purchaseRateLimit } from "@/utils/rateLimit";
import { subscriptionPurchaseSchema, validateRequest, createSafeErrorMessage } from "@/utils/validation";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined, // Use latest API version
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types
interface SanitySubscriptionVariant {
  _key: string;
  title: string;
  titleEs?: string;
  price: number;
  billingPeriod: string;
  customBillingPeriodMonths?: number | null;
  stripePriceId?: string;
  isDefault?: boolean;
  isPopular?: boolean;
}

interface SanitySubscription {
  _id: string;
  title: string;
  titleEs?: string;
  price: number;
  billingPeriod: string;
  customBillingPeriodMonths?: number | null;
  stripePriceId?: string;
  stripeProductId?: string;
  hasVariants?: boolean;
  variants?: SanitySubscriptionVariant[];
  appointmentAccess?: boolean;
  appointmentDiscountPercentage?: number;
  features?: { featureText: string }[];
  allowCoupons?: boolean;
  excludedCoupons?: { _id: string }[];
}

interface SanityCoupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableSubscriptions?: {
    subscription: { _id: string };
    variantKey?: string;
    variantTitle?: string;
  }[];
  usageLimit?: number;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  minimumPurchaseAmount?: number;
}

interface SubscriptionPurchaseRequest {
  subscriptionId: string;
  userId: string;
  userEmail: string;
  variantKey?: string;
  couponCode?: string;
}

interface SubscriptionPurchaseResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
  metadata?: {
    subscriptionId: string;
    variantKey?: string;
    price: number;
    billingPeriod: string;
    couponApplied?: boolean;
    couponCode?: string;
    originalPrice?: number;
    discountedPrice?: number;
    discountAmount?: number;
  };
}

interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: SanityCoupon;
  discountedPrice?: number;
  discountAmount?: number;
}

/**
 * Convert Sanity billing period to Stripe interval configuration
 */
function getStripeIntervalConfig(billingPeriod: string, customBillingPeriodMonths?: number | null): {
  interval: 'month' | 'year';
  interval_count: number;
} {
  switch (billingPeriod) {
    case 'monthly':
      return { interval: 'month', interval_count: 1 };
    case 'three_month':
      return { interval: 'month', interval_count: 3 };
    case 'six_month':
      return { interval: 'month', interval_count: 6 };
    case 'annually':
      return { interval: 'year', interval_count: 1 };
    case 'other':
      const months = customBillingPeriodMonths || 1;
      if (months <= 12) {
        return { interval: 'month', interval_count: months };
      } else if (months % 12 === 0) {
        return { interval: 'year', interval_count: months / 12 };
      } else {
        return { interval: 'month', interval_count: 12 };
      }
    default:
      return { interval: 'month', interval_count: 1 };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<SubscriptionPurchaseResponse>> {
  const startTime = Date.now();
  
  try {
    const data: SubscriptionPurchaseRequest = await req.json();

    // Validate request data
    const validation = validateRequest(subscriptionPurchaseSchema, data);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;

    // Parallel auth and subscription fetch for better performance
    const [user, subscription] = await Promise.all([
      getAuthenticatedUser(),
      sanityClient.fetch<SanitySubscription>(
        groq`*[_type == "subscription" && _id == $id][0] {
          _id,
          title,
          titleEs,
          price,
          billingPeriod,
          customBillingPeriodMonths,
          stripePriceId,
          stripeProductId,
          hasVariants,
          variants[]{
            _key,
            title,
            titleEs,
            price,
            billingPeriod,
            customBillingPeriodMonths,
            stripePriceId,
            isDefault,
            isPopular
          },
          appointmentAccess,
          appointmentDiscountPercentage,
          features[] {
            featureText
          },
          allowCoupons,
          "excludedCoupons": excludedCoupons[]->{ _id }
        }`,
        { id: validatedData.subscriptionId }
      )
    ]);

    // Early validation - fail fast
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    const userId = user.id;
    const userEmail = user.email || validatedData.userEmail;
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }
    
    // Rate limiting temporarily disabled for testing
    // const rateLimitResult = await purchaseRateLimit(req, userId);
    // if (!rateLimitResult.success) {
    //   return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    // }

    // 🔧 FIXED: Correct variant selection logic
    let selectedVariant: SanitySubscriptionVariant | null = null;
    
    if (subscription.hasVariants && subscription.variants && subscription.variants.length > 0) {
      if (validatedData.variantKey) {
        // User explicitly selected a variant
        selectedVariant = subscription.variants.find(v => v._key === validatedData.variantKey) || null;
        if (!selectedVariant) {
          return NextResponse.json(
            { success: false, error: 'Selected variant not found' },
            { status: 404 }
          );
        }
      } else {
        // User selected base subscription (variantKey is undefined)
        selectedVariant = null;
      }
    } else {
      // Subscription has no variants, always use base
      selectedVariant = null;
    }
    
    // Calculate effective price and billing period
    let effectivePrice = selectedVariant ? selectedVariant.price : subscription.price;
    const effectiveBillingPeriod = selectedVariant ? selectedVariant.billingPeriod : subscription.billingPeriod;
    const effectiveCustomMonths = selectedVariant 
      ? selectedVariant.customBillingPeriodMonths 
      : subscription.customBillingPeriodMonths;


    let originalPrice = effectivePrice;
    let appliedCoupon: SanityCoupon | null = null;

    // Handle coupon validation if provided
    if (validatedData.couponCode && subscription.allowCoupons) {
      const couponResult = await validateAndApplyCoupon(
        validatedData.couponCode, 
        subscription, 
        selectedVariant?._key, 
        effectivePrice
      );
      
      if (couponResult.isValid && couponResult.coupon && couponResult.discountedPrice) {
        appliedCoupon = couponResult.coupon;
        effectivePrice = couponResult.discountedPrice;
      } else {
        return NextResponse.json(
          { success: false, error: couponResult.error || 'Invalid coupon code' },
          { status: 400 }
        );
      }
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    try {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId,
          },
        });
        stripeCustomerId = customer.id;
      }
    } catch (customerError) {
      return NextResponse.json(
        { success: false, error: 'Failed to set up customer account' },
        { status: 500 }
      );
    }

    // Get or create Stripe product
    let stripeProductId = subscription.stripeProductId;
    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: subscription.title,
        description: `${subscription.title} subscription`,
        metadata: {
          sanityId: subscription._id,
        },
      });
      stripeProductId = product.id;
      
      // Update Sanity with product ID (non-blocking)
      sanityClient.patch(subscription._id).set({ stripeProductId }).commit()
        .catch(() => {});
    }

    // Get or create Stripe price
    let stripePriceId: string;
    
    if (appliedCoupon) {
      // Create temporary price for discounted amount
      const { interval, interval_count } = getStripeIntervalConfig(effectiveBillingPeriod, effectiveCustomMonths);
      
      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(effectivePrice * 100),
        currency: 'usd',
        recurring: {
          interval,
          interval_count,
        },
        metadata: {
          sanityId: subscription._id,
          variantKey: selectedVariant ? selectedVariant._key : '',
          billingPeriod: effectiveBillingPeriod,
          customBillingPeriodMonths: effectiveCustomMonths?.toString() || '',
          couponCode: appliedCoupon.code,
          originalPrice: originalPrice.toString(),
          tempPrice: 'true' // Mark as temporary price
        }
      });
      stripePriceId = stripePrice.id;
    } else {
      // Use existing price or create new one
      if (selectedVariant && selectedVariant.stripePriceId) {
        stripePriceId = selectedVariant.stripePriceId;
      } else if (!selectedVariant && subscription.stripePriceId) {
        stripePriceId = subscription.stripePriceId;
      } else {
        // Create new price
        const { interval, interval_count } = getStripeIntervalConfig(effectiveBillingPeriod, effectiveCustomMonths);
        
        const stripePrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(effectivePrice * 100),
          currency: 'usd',
          recurring: {
            interval,
            interval_count,
          },
          metadata: {
            sanityId: subscription._id,
            variantKey: selectedVariant ? selectedVariant._key : '',
            billingPeriod: effectiveBillingPeriod,
            customBillingPeriodMonths: effectiveCustomMonths?.toString() || ''
          }
        });
        stripePriceId = stripePrice.id;
        
        // Update Sanity with the new price ID (non-blocking)
        const updatePromise = selectedVariant
          ? sanityClient
              .patch(subscription._id)
              .setIfMissing({ variants: [] })
              .set({ [`variants[_key=="${selectedVariant._key}"].stripePriceId`]: stripePrice.id })
              .commit()
          : sanityClient.patch(subscription._id).set({ stripePriceId: stripePrice.id }).commit();
        
        updatePromise.catch(() => {});
      }
    }

    // Create Stripe checkout session
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: missing base URL' },
        { status: 500 }
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [{ 
        price: stripePriceId, 
        quantity: 1 
      }],
      mode: 'subscription',
      locale: 'en',
      success_url: `${baseUrl}/appointment?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscriptions?canceled=true`,
      customer: stripeCustomerId,
      metadata: {
        userId,
        userEmail,
        subscriptionId: subscription._id,
        variantKey: selectedVariant ? selectedVariant._key : '',
        subscriptionType: "subscription",
        ...(appliedCoupon && {
          couponId: appliedCoupon._id,
          couponCode: appliedCoupon.code,
          originalPrice: originalPrice.toString(),
          discountedPrice: effectivePrice.toString()
        })
      },
      client_reference_id: userId,
    };
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    // Create pending user subscription records
    const startDate = new Date().toISOString();
    const userSubscription = {
      _type: 'userSubscription',
      userId,
      userEmail,
      subscription: { _type: 'reference', _ref: subscription._id },
      variantKey: selectedVariant ? selectedVariant._key : undefined,
      startDate,
      isActive: false,
      status: 'pending',
      stripeSubscriptionId: '', // Will be updated by webhook
      stripeCustomerId,
      billingPeriod: effectiveBillingPeriod,
      billingAmount: effectivePrice,
      hasAppointmentAccess: subscription.appointmentAccess || false,
      appointmentDiscountPercentage: subscription.appointmentDiscountPercentage || 0,
      stripeSessionId: session.id,
      ...(appliedCoupon && {
        appliedCouponId: appliedCoupon._id,
        appliedCouponCode: appliedCoupon.code,
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
        originalPrice: originalPrice,
      }),
    };
    
    const sanityResponse = await sanityClient.create(userSubscription);
    const supabaseSubscription = {
      id: uuidv4(),
      user_id: userId,
      user_email: userEmail,
      sanity_id: sanityResponse._id,
      sanity_subscription_id: subscription._id,
      subscription_name: subscription.title,
      plan_id: subscription._id,
      plan_name: subscription.title,
      stripe_session_id: session.id,
      stripe_customer_id: stripeCustomerId,
      billing_amount: effectivePrice,
      billing_period: effectiveBillingPeriod,
      start_date: startDate,
      status: 'pending',
      is_active: false,
      ...(selectedVariant && {
        variant_key: selectedVariant._key,
      }),
      ...(appliedCoupon && {
        coupon_code: appliedCoupon.code,
        coupon_discount_type: appliedCoupon.discountType,
        coupon_discount_value: appliedCoupon.discountValue,
        original_price: originalPrice,
      }),
    };
    
    const { error: insertError } = await supabase.from('user_subscriptions').insert(supabaseSubscription);
    if (insertError) {
      throw new Error(`Failed to create Supabase record: ${insertError.message}`);
    }
    
    // Increment coupon usage if applied (non-blocking)
    if (appliedCoupon) {
      sanityClient.patch(appliedCoupon._id)
        .inc({ usageCount: 1 })
        .commit()
        .catch(() => {});
    }
    
    // Prepare response metadata
    const responseMetadata = {
      subscriptionId: subscription._id,
      variantKey: selectedVariant?._key,
      price: effectivePrice,
      billingPeriod: effectiveBillingPeriod,
      ...(appliedCoupon && {
        couponApplied: true,
        couponCode: appliedCoupon.code,
        originalPrice: originalPrice,
        discountedPrice: effectivePrice,
        discountAmount: originalPrice - effectivePrice
      }),
    };


    const checkoutUrl = session.url || undefined;
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: checkoutUrl,
      metadata: responseMetadata
    });

  } catch (error: unknown) {
    const errorMessage = createSafeErrorMessage(error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage || "Failed to create subscription"
      }, 
      { status: 500 }
    );
  }
}

/**
 * Validates and applies a coupon to a subscription
 */
async function validateAndApplyCoupon(
  couponCode: string,
  subscription: SanitySubscription,
  variantKey?: string,
  currentPrice?: number
): Promise<CouponValidationResult> {
  try {
    // Fetch coupon from Sanity
    const coupon = await sanityClient.fetch<SanityCoupon>(
      groq`*[_type == "coupon" && code == $code && isActive == true][0] {
        _id,
        code,
        discountType,
        discountValue,
        applicableSubscriptions[]{
          subscription->{_id},
          variantKey,
          variantTitle
        },
        usageLimit,
        usageCount,
        validFrom,
        validUntil,
        isActive,
        minimumPurchaseAmount
      }`,
      { code: couponCode }
    );

    if (!coupon) {
      return { isValid: false, error: 'Coupon not found or inactive' };
    }

    // Check if coupon is within valid date range
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
      return { isValid: false, error: 'Coupon has expired or is not yet valid' };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { isValid: false, error: 'Coupon usage limit exceeded' };
    }

    // Check minimum purchase amount
    if (coupon.minimumPurchaseAmount && currentPrice && currentPrice < coupon.minimumPurchaseAmount) {
      return { 
        isValid: false, 
        error: `Minimum purchase amount of $${coupon.minimumPurchaseAmount} required` 
      };
    }

    // Check if coupon applies to this subscription/variant
    if (coupon.applicableSubscriptions && coupon.applicableSubscriptions.length > 0) {
      const isApplicable = coupon.applicableSubscriptions.some(applicableItem => {
        const subscriptionMatches = applicableItem.subscription._id === subscription._id;
        const variantMatches = applicableItem.variantKey === variantKey || 
                              (!applicableItem.variantKey && !variantKey);
        return subscriptionMatches && variantMatches;
      });

      if (!isApplicable) {
        return { isValid: false, error: 'Coupon not applicable to this subscription' };
      }
    }

    // Calculate discounted price
    if (!currentPrice) {
      return { isValid: false, error: 'Unable to calculate discount' };
    }

    let discountedPrice: number;
    let discountAmount: number;

    if (coupon.discountType === 'percentage') {
      discountAmount = (currentPrice * coupon.discountValue) / 100;
      discountedPrice = currentPrice - discountAmount;
    } else {
      discountAmount = coupon.discountValue;
      discountedPrice = currentPrice - discountAmount;
    }

    // Ensure price doesn't go below zero
    if (discountedPrice < 0) {
      discountedPrice = 0;
      discountAmount = currentPrice;
    }

    return {
      isValid: true,
      coupon,
      discountedPrice,
      discountAmount
    };

  } catch (error) {
    return { isValid: false, error: 'Error validating coupon' };
  }
}