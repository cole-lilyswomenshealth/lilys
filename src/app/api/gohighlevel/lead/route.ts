/**
 * GHL Lead Creation API
 * Creates/updates leads in GoHighLevel CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { ghlService } from '@/lib/gohighlevel';
import { formatPhoneToE164 } from '@/utils/phoneFormatter';
import type { GHLWeightLossLead, GHLWeightLossCustomFields } from '@/types/gohighlevel';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Format phone to E.164
    const phone = formatPhoneToE164(data.phone);

    // Build custom fields from survey data (GHL format: array of {key, value} objects)
    const customFieldsData: GHLWeightLossCustomFields = {
      age_group: data.ageGroup,
      female: data.isFemale ? 'Yes' : 'No',
      current_weight: data.currentWeight,
      height: data.height ? `${data.height.feet}'${data.height.inches}"` : undefined,
      bmi: data.bmi,
      pregnant: data.isPregnant ? 'Yes' : 'No',
      breastfeeding: data.isBreastfeeding ? 'Yes' : 'No',
      medical_conditions: Array.isArray(data.medicalConditions)
        ? data.medicalConditions.join(', ')
        : data.medicalConditions,
      medications: data.takesPrescriptionMedications ? 'Yes' : 'No',
      eating_disorder: data.hasEatingDisorder ? 'Yes' : 'No',
      previous_weight_loss: data.previousWeightLossAttempts,
      elegible: data.eligible ? 'Yes' : 'No',
      state: data.state,
      date_of_birth: data.dateOfBirth,
    };

    // Convert to GHL's required array format
    const customFields = Object.entries(customFieldsData)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({ key, value: String(value) }));

    // Create GHL lead payload
    const ghlLead: GHLWeightLossLead = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone,
      locationId: process.env.GHL_LOCATION_ID!,
      tags: ['lead', 'weight-loss'],
      source: 'Website - Weight Loss Survey',
      customFields,
    };

    // Send to GHL
    const result = await ghlService.upsertContact(ghlLead);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('GHL API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
