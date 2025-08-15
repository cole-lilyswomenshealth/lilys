import { ContactInfoData } from '@/app/c/wm/lose-weight/types';

// Type definitions for Facebook tracking
interface FacebookEventData {
  eventName: 'ViewContent' | 'Purchase' | 'Lead' | 'CompleteRegistration' | 'AddToCart' | 'InitiateCheckout';
  eventSourceUrl: string;
  userData?: {
    em?: string;
    fn?: string;
    ln?: string;
    st?: string;
    db?: string;
  };
  customData?: {
    content_type?: string;
    content_category?: string;
    content_ids?: string[];
    content_name?: string;
    currency?: string;
    value?: number;
    num_items?: number;
    transaction_id?: string;
    bmi?: number;
    age_group?: string;
    eligible?: boolean;
    billing_period?: string;
    dosage?: string;
    coupon_applied?: string;
    variant_selected?: string;
    subscription_id?: string;
    plan_name?: string;
    billing_cycle?: string;
  };
}

// Helper function to safely track events
async function trackFacebookEvent(eventData: FacebookEventData): Promise<void> {
  try {
    await fetch('/api/facebook/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
  } catch (error) {
    // Silently handle tracking errors in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('Facebook tracking failed:', error);
    }
  }
}

// Helper function to format date of birth for Facebook (YYYYMMDD)
function formatDateOfBirth(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  } catch {
    return '';
  }
}

// Helper function to convert contact info to Facebook user data
function getHashedUserData(contactInfo: ContactInfoData): FacebookEventData['userData'] {
  return {
    em: contactInfo.email,
    fn: contactInfo.firstName,
    ln: contactInfo.lastName,
    st: contactInfo.state,
    db: contactInfo.dateOfBirth ? formatDateOfBirth(contactInfo.dateOfBirth) : undefined,
  };
}

// Weight Loss Survey Events
export async function trackSurveyStart(eventSourceUrl: string): Promise<void> {
  await trackFacebookEvent({
    eventName: 'Lead',
    eventSourceUrl,
    customData: {
      content_category: 'weight_loss_assessment',
      content_name: 'survey_started',
      value: 0,
      currency: 'USD'
    }
  });
}

export async function trackSurveyCompletion(
  eventSourceUrl: string,
  contactInfo?: ContactInfoData,
  bmi?: number,
  ageGroup?: string,
  isEligible?: boolean
): Promise<void> {
  await trackFacebookEvent({
    eventName: 'CompleteRegistration',
    eventSourceUrl,
    userData: contactInfo ? getHashedUserData(contactInfo) : undefined,
    customData: {
      content_category: 'weight_loss_assessment',
      content_name: 'survey_completed',
      bmi,
      age_group: ageGroup,
      eligible: isEligible,
    }
  });
}

// Results Page Events
export async function trackResultsPageView(
  eventSourceUrl: string,
  recommendedPlan: string,
  isEligible?: boolean
): Promise<void> {
  await trackFacebookEvent({
    eventName: 'ViewContent',
    eventSourceUrl,
    customData: {
      content_type: 'subscription_recommendation',
      content_category: 'weight_loss_results',
      content_ids: [recommendedPlan],
      eligible: isEligible,
      content_name: `${recommendedPlan}_recommendation`
    }
  });
}

// Subscription Page Events
export async function trackSubscriptionView(
  eventSourceUrl: string,
  subscriptionSlug: string,
  subscriptionTitle: string,
  price: number
): Promise<void> {
  await trackFacebookEvent({
    eventName: 'ViewContent',
    eventSourceUrl,
    customData: {
      content_type: 'subscription_plan',
      content_category: 'weight_loss',
      content_ids: [subscriptionSlug],
      content_name: subscriptionTitle,
      value: price,
      currency: 'USD'
    }
  });
}

export async function trackVariantSelection(
  eventSourceUrl: string,
  subscriptionSlug: string,
  subscriptionTitle: string,
  variantTitle: string,
  variantPrice: number,
  billingPeriod: string,
  dosage?: string
): Promise<void> {
  await trackFacebookEvent({
    eventName: 'AddToCart',
    eventSourceUrl,
    customData: {
      content_type: 'subscription_variant',
      content_ids: [subscriptionSlug],
      content_name: `${subscriptionTitle} - ${variantTitle}`,
      value: variantPrice,
      currency: 'USD',
      billing_period: billingPeriod,
      dosage,
      variant_selected: variantTitle
    }
  });
}

export async function trackPurchaseInitiation(
  eventSourceUrl: string,
  subscriptionSlug: string,
  subscriptionTitle: string,
  finalPrice: number,
  appliedCoupon?: string,
  selectedVariant?: string
): Promise<void> {
  await trackFacebookEvent({
    eventName: 'InitiateCheckout',
    eventSourceUrl,
    customData: {
      content_type: 'subscription',
      content_ids: [subscriptionSlug],
      content_name: subscriptionTitle,
      value: finalPrice,
      currency: 'USD',
      num_items: 1,
      coupon_applied: appliedCoupon || undefined,
      variant_selected: selectedVariant
    }
  });
}

export async function trackPurchaseCompletion(
  eventSourceUrl: string,
  subscriptionSlug: string,
  subscriptionTitle: string,
  paidAmount: number,
  transactionId: string,
  subscriptionId?: string,
  billingCycle?: string
): Promise<void> {
  await trackFacebookEvent({
    eventName: 'Purchase',
    eventSourceUrl,
    customData: {
      content_type: 'subscription',
      content_ids: [subscriptionSlug],
      value: paidAmount,
      currency: 'USD',
      transaction_id: transactionId,
      subscription_id: subscriptionId,
      plan_name: subscriptionTitle,
      billing_cycle: billingCycle
    }
  });
}

// Legacy function - maintain compatibility
export async function trackSubscriptionPageView(eventSourceUrl: string): Promise<void> {
  await trackFacebookEvent({
    eventName: 'ViewContent',
    eventSourceUrl,
    customData: {
      content_type: 'subscription_plans',
      content_category: 'telehealth',
      content_ids: ['weight_management', 'hair_loss', 'cycle_management']
    }
  });
}