import { NextRequest, NextResponse } from "next/server";
import { facebookEventSchema, validateRequest, createSafeErrorMessage } from '@/utils/validation';
import { rateLimit } from '@/utils/rateLimit';
import crypto from 'crypto';

interface FacebookEventRequest {
  eventName: 'ViewContent' | 'Purchase' | 'Lead' | 'CompleteRegistration' | 'AddToCart' | 'InitiateCheckout';
  eventSourceUrl: string;
  userAgent?: string;
  ipAddress?: string;
  fbp?: string;
  fbc?: string;
  userData?: {
    em?: string; // email
    fn?: string; // first name
    ln?: string; // last name
    st?: string; // state
    db?: string; // date of birth
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
    // Weight loss specific
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

interface FacebookEventResponse {
  success: boolean;
  error?: string;
}

interface FacebookPayload {
  data: Array<{
    event_name: string;
    event_time: number;
    action_source: string;
    event_source_url: string;
    event_id: string;
    user_data: {
      client_ip_address?: string;
      client_user_agent?: string;
      fbp?: string;
      fbc?: string;
      em?: string; // email (hashed by Meta)
      fn?: string; // first name (hashed by Meta)
      ln?: string; // last name (hashed by Meta)
      st?: string; // state
      db?: string; // date of birth
    };
    custom_data?: {
      content_type?: string;
      content_category?: string;
      content_ids?: string[];
      content_name?: string;
      currency?: string;
      value?: number;
      num_items?: number;
      transaction_id?: string;
      // Weight loss specific
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
  }>;
}

async function sendToFacebookAPI(payload: FacebookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Using exact variable names from Facebook API documentation
    // https://graph.facebook.com/{API_VERSION}/{PIXEL_ID}/events?access_token={TOKEN}
    const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN!;
    const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID!;
    const API_VERSION = process.env.FACEBOOK_API_VERSION || 'v21.0';
    
    if (!TOKEN || !PIXEL_ID) {
      throw new Error('Missing Facebook configuration: TOKEN or PIXEL_ID');
    }

    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Facebook API error: ${response.status} - ${errorData}`);
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<FacebookEventResponse>> {
  try {
    const rateLimitResult = await rateLimit(req, {
      windowMs: 5 * 60 * 1000,
      maxRequests: 50,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    const validation = validateRequest(facebookEventSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const eventData = validation.data;
    
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                     req.headers.get('x-real-ip') || undefined;
    
    const userAgent = req.headers.get('user-agent') || undefined;

    const cookieHeader = req.headers.get('cookie') || '';
    const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/);
    const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/);
    
    const fbp = fbpMatch ? decodeURIComponent(fbpMatch[1]) : undefined;
    const fbc = fbcMatch ? decodeURIComponent(fbcMatch[1]) : undefined;

    const payload: FacebookPayload = {
      data: [{
        event_name: eventData.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: eventData.eventSourceUrl,
        event_id: crypto.randomUUID(),
        user_data: {
          ...(ipAddress && { client_ip_address: ipAddress }),
          ...(userAgent && { client_user_agent: userAgent }),
          ...(fbp && { fbp }),
          ...(fbc && { fbc }),
          // User data (must be hashed with SHA256)
          ...(eventData.userData?.em && { em: crypto.createHash('sha256').update(eventData.userData.em.toLowerCase().trim()).digest('hex') }),
          ...(eventData.userData?.fn && { fn: crypto.createHash('sha256').update(eventData.userData.fn.toLowerCase().trim()).digest('hex') }),
          ...(eventData.userData?.ln && { ln: crypto.createHash('sha256').update(eventData.userData.ln.toLowerCase().trim()).digest('hex') }),
          ...(eventData.userData?.st && { st: eventData.userData.st }),
          ...(eventData.userData?.db && { db: eventData.userData.db }),
        },
        ...(eventData.customData && {
          custom_data: {
            ...(eventData.customData.content_type && { content_type: eventData.customData.content_type }),
            ...(eventData.customData.content_category && { content_category: eventData.customData.content_category }),
            ...(eventData.customData.content_ids && { content_ids: eventData.customData.content_ids }),
            ...(eventData.customData.content_name && { content_name: eventData.customData.content_name }),
            ...(eventData.customData.currency && { currency: eventData.customData.currency }),
            ...(eventData.customData.value && { value: eventData.customData.value }),
            ...(eventData.customData.num_items && { num_items: eventData.customData.num_items }),
            ...(eventData.customData.transaction_id && { transaction_id: eventData.customData.transaction_id }),
            // Weight loss specific custom data
            ...(eventData.customData.bmi && { bmi: eventData.customData.bmi }),
            ...(eventData.customData.age_group && { age_group: eventData.customData.age_group }),
            ...(typeof eventData.customData.eligible === 'boolean' && { eligible: eventData.customData.eligible }),
            ...(eventData.customData.billing_period && { billing_period: eventData.customData.billing_period }),
            ...(eventData.customData.dosage && { dosage: eventData.customData.dosage }),
            ...(eventData.customData.coupon_applied && { coupon_applied: eventData.customData.coupon_applied }),
            ...(eventData.customData.variant_selected && { variant_selected: eventData.customData.variant_selected }),
            ...(eventData.customData.subscription_id && { subscription_id: eventData.customData.subscription_id }),
            ...(eventData.customData.plan_name && { plan_name: eventData.customData.plan_name }),
            ...(eventData.customData.billing_cycle && { billing_cycle: eventData.customData.billing_cycle }),
          }
        })
      }]
    };

    const result = await sendToFacebookAPI(payload);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = createSafeErrorMessage(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}