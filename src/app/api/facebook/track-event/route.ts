import { NextRequest, NextResponse } from "next/server";
import { facebookEventSchema, validateRequest, createSafeErrorMessage } from '@/utils/validation';
import { rateLimit } from '@/utils/rateLimit';
import crypto from 'crypto';

interface FacebookEventRequest {
  eventName: 'ViewContent' | 'Purchase';
  eventSourceUrl: string;
  userAgent?: string;
  ipAddress?: string;
  fbp?: string;
  fbc?: string;
  customData?: Record<string, any>;
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
    };
    custom_data?: {
      content_type?: string;
      content_category?: string;
      content_ids?: string[];
      currency?: string;
      value?: number;
    };
  }>;
}

async function sendToFacebookAPI(payload: FacebookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN!;
    const datasetId = process.env.FACEBOOK_DATASET_ID!;
    
    if (!accessToken || !datasetId) {
      throw new Error('Missing Facebook configuration');
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${datasetId}/events?access_token=${accessToken}`, {
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
        },
        ...(eventData.customData && {
          custom_data: {
            ...(eventData.customData.content_type && { content_type: eventData.customData.content_type }),
            ...(eventData.customData.content_category && { content_category: eventData.customData.content_category }),
            ...(eventData.customData.content_ids && { content_ids: eventData.customData.content_ids }),
            ...(eventData.customData.currency && { currency: eventData.customData.currency }),
            ...(eventData.customData.value && { value: eventData.customData.value }),
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