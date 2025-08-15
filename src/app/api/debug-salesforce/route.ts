// src/app/api/debug-salesforce/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { salesforceService } from '@/lib/salesforce';

// TypeScript interfaces for debug responses
interface EnvironmentStatus {
  hasUsername: boolean;
  hasPassword: boolean;
  hasLoginUrl: boolean;
  loginUrl?: string;
  usernamePrefix?: string;
}

interface SalesforceAuthResponse {
  success: boolean;
  sessionId?: string;
  serverUrl?: string;
  error?: string;
  responseStatus?: number;
  responseText?: string;
}

interface LeadCreationResponse {
  success: boolean;
  leadId?: string;
  error?: string;
  responseStatus?: number;
  responseText?: string;
  leadData?: any;
}

interface DebugResponse {
  environment: EnvironmentStatus;
  authentication: SalesforceAuthResponse;
  leadCreation: LeadCreationResponse;
  timestamp: string;
  totalDuration: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log('[SALESFORCE_DEBUG_PAGE] Starting comprehensive debug test...');

    // Step 1: Check Environment Variables
    const environment: EnvironmentStatus = {
      hasUsername: !!process.env.SALESFORCE_USERNAME,
      hasPassword: !!process.env.SALESFORCE_PASSWORD,
      hasLoginUrl: !!process.env.SALESFORCE_LOGIN_URL,
      loginUrl: process.env.SALESFORCE_LOGIN_URL,
      usernamePrefix: process.env.SALESFORCE_USERNAME ? 
        process.env.SALESFORCE_USERNAME.substring(0, 15) + '...' : undefined
    };

    console.log('[SALESFORCE_DEBUG_PAGE] Environment check:', environment);

    // Initialize authentication response
    let authentication: SalesforceAuthResponse = {
      success: false,
      error: 'Not attempted'
    };

    // Initialize lead creation response
    let leadCreation: LeadCreationResponse = {
      success: false,
      error: 'Not attempted'
    };

    // Step 2: Test Authentication (only if env vars exist)
    if (environment.hasUsername && environment.hasPassword && environment.hasLoginUrl) {
      try {
        console.log('[SALESFORCE_DEBUG_PAGE] Testing authentication...');
        
        // Create a test instance to access the private login method
        const testService = new (class extends (salesforceService as any).constructor {
          async testLogin() {
            return super.login();
          }
        })();

        const authResult = await testService.testLogin();
        
        authentication = {
          success: true,
          sessionId: authResult.sessionId,
          serverUrl: authResult.serverUrl
        };

        console.log('[SALESFORCE_DEBUG_PAGE] Authentication successful');

        // Step 3: Test Lead Creation (only if auth successful)
        if (authentication.success) {
          console.log('[SALESFORCE_DEBUG_PAGE] Testing lead creation...');

          // Hardcoded test payload - exactly matching your working localhost test
          const testFormData = {
            'age-group': '25-34',
            'gender': 'yes',
            'current-weight': '180',
            'height': '{"feet":5,"inches":6}',
            'pregnant': 'no',
            'breastfeeding': 'no',
            'medical-conditions': ['none'],
            'prescription-medications': 'no',
            'eating-disorder': 'no',
            'previous-weight-loss': 'No, this is my first attempt'
          };

          const testContactInfo = {
            firstName: 'Debug',
            lastName: 'Test',
            email: 'debug@lilyswomenshealth.com',
            phone: '+1234567890',
            state: 'VA',
            dateOfBirth: '1990-01-01'
          };

          const leadData = salesforceService.transformFormDataToLead(testFormData, testContactInfo);
          const result = await salesforceService.createWeightLossLead(leadData);

          leadCreation = {
            success: result.success,
            leadId: result.id,
            error: result.error,
            leadData: leadData
          };

          console.log('[SALESFORCE_DEBUG_PAGE] Lead creation result:', result);
        } else {
          leadCreation.error = 'Skipped - Authentication failed';
        }

      } catch (authError) {
        console.error('[SALESFORCE_DEBUG_PAGE] Authentication error:', authError);
        authentication = {
          success: false,
          error: authError instanceof Error ? authError.message : 'Unknown authentication error'
        };
        leadCreation.error = 'Skipped - Authentication failed';
      }
    } else {
      authentication.error = 'Missing environment variables';
      leadCreation.error = 'Skipped - Missing environment variables';
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const debugResponse: DebugResponse = {
      environment,
      authentication,
      leadCreation,
      timestamp: new Date().toISOString(),
      totalDuration
    };

    console.log('[SALESFORCE_DEBUG_PAGE] Debug test completed:', debugResponse);

    return NextResponse.json(debugResponse);

  } catch (error) {
    console.error('[SALESFORCE_DEBUG_PAGE] Unexpected error:', error);
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const errorResponse: DebugResponse = {
      environment: {
        hasUsername: false,
        hasPassword: false,
        hasLoginUrl: false
      },
      authentication: {
        success: false,
        error: 'Debug test failed'
      },
      leadCreation: {
        success: false,
        error: 'Debug test failed'
      },
      timestamp: new Date().toISOString(),
      totalDuration
    };

    return NextResponse.json(
      { 
        ...errorResponse,
        error: `Debug test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Use POST method to run debug test' },
    { status: 405 }
  );
}