// src/app/api/weight-loss-lead/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { salesforceService } from '@/lib/salesforce';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { formData, contactInfo } = await request.json();

    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    const leadData = salesforceService.transformFormDataToLead(formData, contactInfo);
    const result = await salesforceService.createWeightLossLead(leadData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Request processed successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Processing failed: ${result.error}`
      }, { status: 400 });
    }

  } catch (error) {
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