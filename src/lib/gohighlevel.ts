/**
 * GoHighLevel (GHL) CRM Service
 * Minimal implementation for lead management
 */

import type { GHLWeightLossLead, GHLApiResponse } from '@/types/gohighlevel';

const GHL_API_URL = process.env.GHL_API_URL || 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_ENABLED = process.env.GHL_INTEGRATION_ENABLED === 'true';

export class GoHighLevelService {
  private apiKey: string;
  private locationId: string;
  private baseUrl: string;

  constructor() {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      throw new Error('GHL_API_KEY and GHL_LOCATION_ID required');
    }
    this.apiKey = GHL_API_KEY;
    this.locationId = GHL_LOCATION_ID;
    this.baseUrl = GHL_API_URL;
  }

  /**
   * Create or update contact in GHL
   */
  async upsertContact(data: GHLWeightLossLead): Promise<GHLApiResponse> {
    if (!GHL_ENABLED) {
      console.log('GHL integration disabled');
      return { message: 'GHL disabled' };
    }

    const payload = {
      ...data,
      locationId: this.locationId,
    };

    const response = await fetch(`${this.baseUrl}/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GHL API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }
}

export const ghlService = new GoHighLevelService();
