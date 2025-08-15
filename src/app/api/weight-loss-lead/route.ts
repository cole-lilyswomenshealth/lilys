// src/app/api/weight-loss-lead/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { salesforceService } from '@/lib/salesforce';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { formData, contactInfo } = await request.json();

    // DEBUG LOG: Request received
    console.log('[SALESFORCE_DEBUG] Weight Loss Lead API - Request received:', {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasFormData: !!formData,
      hasContactInfo: !!contactInfo,
      formDataKeys: formData ? Object.keys(formData) : [],
      contactInfoKeys: contactInfo ? Object.keys(contactInfo) : []
    });

    if (!formData) {
      console.log('[SALESFORCE_DEBUG] Request validation failed: Missing formData');
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    // DEBUG LOG: Data transformation
    const leadData = salesforceService.transformFormDataToLead(formData, contactInfo);
    console.log('[SALESFORCE_DEBUG] Lead data transformed:', {
      leadData: leadData,
      requiredFieldsPresent: {
        firstName: !!leadData.FirstName,
        lastName: !!leadData.LastName,
        email: !!leadData.Email,
        company: !!leadData.Company
      }
    });

    // DEBUG LOG: Before Salesforce call
    console.log('[SALESFORCE_DEBUG] Calling Salesforce API...');
    const result = await salesforceService.createWeightLossLead(leadData);
    
    // DEBUG LOG: Salesforce response
    console.log('[SALESFORCE_DEBUG] Salesforce API response:', {
      success: result.success,
      leadId: result.id,
      error: result.error,
      timestamp: new Date().toISOString()
    });

    if (result.success) {
      console.log('[SALESFORCE_DEBUG] Lead created successfully:', result.id);
      return NextResponse.json({
        success: true,
        message: 'Request processed successfully'
      });
    } else {
      console.error('[SALESFORCE_DEBUG] Lead creation failed:', {
        error: result.error,
        leadData: leadData
      });
      return NextResponse.json({
        success: false,
        error: `Processing failed: ${result.error}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[SALESFORCE_DEBUG] Unexpected API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}