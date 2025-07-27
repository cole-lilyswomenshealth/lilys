import { NextRequest, NextResponse } from "next/server";
import { bizSdk } from 'facebook-nodejs-business-sdk';
import { facebookEventSchema, validateRequest, createSafeErrorMessage } from '@/utils/validation';
import { rateLimit } from '@/utils/rateLimit';
import crypto from 'crypto';

const { FacebookAdsApi, ServerEvent, EventRequest, UserData, CustomData } = bizSdk;

interface FacebookEventRequest {
  eventName: 'ViewContent' | 'Purchase';
  eventSourceUrl: string;
  userAgent?: string;
  ipAddress?: string;
  customData?: Record<string, any>;
}

interface FacebookEventResponse {
  success: boolean;
  error?: string;
}

class FacebookConversionsClient {
  private api: typeof FacebookAdsApi;
  private accessToken: string;
  private datasetId: string;

  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN!;
    this.datasetId = process.env.FACEBOOK_DATASET_ID!;
    
    if (!this.accessToken || !this.datasetId) {
      throw new Error('Missing Facebook configuration');
    }

    this.api = FacebookAdsApi.init(this.accessToken);
  }

  async sendEvent(eventData: FacebookEventRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const userData = new UserData();
      
      if (eventData.ipAddress) {
        userData.setClientIpAddress(eventData.ipAddress);
      }
      
      if (eventData.userAgent) {
        userData.setClientUserAgent(eventData.userAgent);
      }

      const customData = new CustomData();
      if (eventData.customData) {
        if (eventData.customData.content_type) {
          customData.setContentType(eventData.customData.content_type);
        }
        if (eventData.customData.content_category) {
          customData.setContentCategory(eventData.customData.content_category);
        }
        if (eventData.customData.content_ids) {
          customData.setContentIds(eventData.customData.content_ids);
        }
      }

      const serverEvent = new ServerEvent();
      serverEvent.setEventName(eventData.eventName);
      serverEvent.setEventTime(Math.floor(Date.now() / 1000));
      serverEvent.setEventSourceUrl(eventData.eventSourceUrl);
      serverEvent.setActionSource('website');
      serverEvent.setUserData(userData);
      serverEvent.setCustomData(customData);
      serverEvent.setEventId(crypto.randomUUID());

      const eventRequest = new EventRequest(this.datasetId);
      eventRequest.setEvents([serverEvent]);

      await eventRequest.execute();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
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
    
    if (!eventData.ipAddress) {
      const forwarded = req.headers.get('x-forwarded-for');
      eventData.ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
                           req.headers.get('x-real-ip') || undefined;
    }
    
    if (!eventData.userAgent) {
      eventData.userAgent = req.headers.get('user-agent') || undefined;
    }

    const client = new FacebookConversionsClient();
    const result = await client.sendEvent(eventData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send event' },
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