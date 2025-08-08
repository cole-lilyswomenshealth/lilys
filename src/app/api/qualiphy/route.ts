// src/app/api/qualiphy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pharmacy configurations are now based on exam type (subscription-specific)

// State name to abbreviation mapping
const STATE_TO_ABBREVIATION: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC'
};

interface QualiphyApiResponse {
  http_code: number;
  meeting_url?: string;
  meeting_uuid?: string;
  patient_exams?: Array<{
    patient_exam_id: number;
    exam_title: string;
    exam_id: number;
  }>;
  error_message?: string;
}

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  state: string;
  dob: string;
  submission_count: number;
  meeting_url?: string;
  meeting_uuid?: string;
  exam_pos_id?: number;
  dose_level?: number;
  created_at: string;
  updated_at: string;
}

// Pharmacy configurations based on medication type
const PHARMACY_DETAILS = {
  semaglutide: {
    ncpdpid: "0604923",
    pharmacy_name: "BELMAR PHARMACY",
    pharmacy_address_line_1: "231 VIOLET STRE 140",
    pharmacy_address_line_2: "",
    pharmacy_zip_code: "80401",
    pharmacy_city: "GOLDEN",
    pharmacy_state: "CO",
    pharmacy_phone: "(800) 525-9473",
    pharmacy_type: "Retail"
  },
  tirzepatide: {
    ncpdpid: "5920740",
    pharmacy_name: "Revive Rx",
    pharmacy_address_line_1: "3831 Golf Dr. A",
    pharmacy_address_line_2: "",
    pharmacy_zip_code: "77018",
    pharmacy_city: "Houston",
    pharmacy_state: "TX",
    pharmacy_phone: "(888) 689-2271",
    pharmacy_type: "Retail~SupportsDigitalSignature~Compounding~D..."
  }
} as const;

// Get pharmacy config based on exam ID
const getPharmacyConfig = (examId: number) => {
  // Exam ID 2413 = Semaglutide, 2414 = Tirzepatide
  const medicationType = examId === 2413 ? 'semaglutide' : 'tirzepatide';
  const pharmacyDetails = PHARMACY_DETAILS[medicationType];

  return {
    pharmacy_id: 12,
    ...pharmacyDetails,
    provider_pos_selection: 2,
    custom_pharmacy_patient_billing: 1,
    custom_pharmacy_delivery_method: 2,
    custom_pharmacy: 2,
    custom_pharmacy_patient_choice: 1,
    custom_pharmacy_clinic_billing: "Lilys Womens"
  };
};

// Get exam_pos_id for specific dose level
async function getExamPosId(examId: number, state: string): Promise<number> {
  try {
    const response = await fetch('https://api.qualiphy.me/api/partner_pharmacy_treatment_packages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Clinic-API/1.0'
      },
      body: JSON.stringify({
        api_key: process.env.QUALIPHY_API_KEY,
        exam_ids: [examId],
        patient_state: state,
        pharmacy_ids: 12
      })
    });
    
    if (!response.ok) {
      throw new Error(`Qualiphy packages API error: ${response.status}`);
    }
    
    const packages = await response.json();
    
    // Filter and find dose 1 package (Phase 1: always dose 1)
    let dose1Package;
    
    if (examId === 2413) { // Semaglutide
      dose1Package = packages.find((p: any) => 
        p.title.includes('Semaglutide - Injection - Dose 1') &&
        !p.title.includes('Niacinamide')
      );
    } else if (examId === 2414) { // Tirzepatide  
      dose1Package = packages.find((p: any) =>
        (p.title.includes('Dose 1:') || p.title.includes('eDose 1:')) &&
        !p.title.includes('Niacinamide') &&
        !p.title.includes('Weekly -')
      );
    }
    
    return dose1Package?.exam_pos_id || packages[0]?.exam_pos_id;
    
  } catch (error) {
    console.error('Error fetching Qualiphy packages:', error);
    // Fallback to known dose 1 exam_pos_ids
    return examId === 2413 ? 9608 : 9680;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phoneNumber, dob, state, examId } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber || !dob || !state || !examId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert state to abbreviation
    const stateAbbreviation = STATE_TO_ABBREVIATION[state];
    if (!stateAbbreviation) {
      return NextResponse.json(
        { success: false, error: 'Invalid state provided' },
        { status: 400 }
      );
    }

    // Get pharmacy configuration based on exam type
    const pharmacyConfig = getPharmacyConfig(examId);
    
    // Get correct exam_pos_id for dose 1 (Phase 1: always dose 1)
    const examPosId = await getExamPosId(examId, stateAbbreviation);
    const doseLevel = 1; // Phase 1: always dose 1, Phase 2: implement progression

    // Check if user already exists and has submitted
    const { data: existingUserData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error when checking user:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      );
    }

    // Check submission limit
    if (existingUserData && (existingUserData.submission_count || 0) >= 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You have already submitted a consultation request. Only one submission is allowed per account.',
          meetingUrl: existingUserData.meeting_url || 'https://app.qualiphy.me/meeting/your-appointment'
        },
        { status: 400 }
      );
    }

    // Validate Qualiphy API key
    if (!process.env.QUALIPHY_API_KEY) {
      console.error('QUALIPHY_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Scheduling service not configured' },
        { status: 500 }
      );
    }

    // Prepare Qualiphy API payload with pharmacy details
    const qualiphyPayload = {
      api_key: process.env.QUALIPHY_API_KEY,
      exams: [examId],
      exam_pos_id: examPosId, // Dynamic package selection
      first_name: firstName,
      last_name: lastName,
      email: email,
      dob: dob,
      phone_number: phoneNumber,
      state: stateAbbreviation,
      tele_state: stateAbbreviation,
      // Pharmacy configuration
      ...pharmacyConfig
    };


    // Call Qualiphy API
    const qualiphyResponse = await fetch('https://api.qualiphy.me/api/exam_invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Clinic-API/1.0'
      },
      body: JSON.stringify(qualiphyPayload)
    });


    // FIXED: Better error handling for non-JSON responses
    let qualiphyData: QualiphyApiResponse;
    
    try {
      const responseText = await qualiphyResponse.text();
      
      // Check if response looks like JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        qualiphyData = JSON.parse(responseText);
      } else {
        console.error('Non-JSON response from Qualiphy:', responseText);
        return NextResponse.json(
          { success: false, error: 'Invalid response from scheduling service' },
          { status: 502 }
        );
      }
    } catch (parseError) {
      console.error('Failed to parse Qualiphy response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid response format from scheduling service' },
        { status: 502 }
      );
    }

    // Check for success
    const isSuccess = qualiphyData.http_code === 200 && qualiphyData.meeting_url;
    
    if (isSuccess) {
      // Save or update user data
      const now = new Date().toISOString();
      
      if (existingUserData) {
        const { data: updatedData, error: updateError } = await supabaseAdmin
          .from('user_data')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber,
            state: state,
            dob: dob,
            submission_count: (existingUserData.submission_count || 0) + 1,
            updated_at: now,
            meeting_url: qualiphyData.meeting_url,
            meeting_uuid: qualiphyData.meeting_uuid,
            exam_pos_id: examPosId,
            dose_level: doseLevel
          })
          .eq('email', email)
          .select('id, submission_count')
          .single();

        if (updateError) {
          console.error('Failed to update user data:', updateError);
        }
      } else {
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('user_data')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phoneNumber,
            state: state,
            dob: dob,
            submission_count: 1,
            created_at: now,
            updated_at: now,
            meeting_url: qualiphyData.meeting_url,
            meeting_uuid: qualiphyData.meeting_uuid,
            exam_pos_id: examPosId,
            dose_level: doseLevel
          })
          .select('id, submission_count')
          .single();

        if (insertError) {
          console.error('Failed to insert user data:', insertError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment scheduled successfully',
        meetingUrl: qualiphyData.meeting_url,
        meetingUuid: qualiphyData.meeting_uuid,
        patientExams: qualiphyData.patient_exams
      });
      
    } else {
      // Error cases
      let errorMessage = 'Failed to schedule appointment';
      
      if (qualiphyData.error_message) {
        errorMessage = qualiphyData.error_message;
      } else if (qualiphyData.http_code === 400) {
        errorMessage = 'Invalid appointment data provided';
      } else if (qualiphyData.http_code === 401) {
        errorMessage = 'Authentication failed with scheduling service';
      } else if (qualiphyData.http_code === 500) {
        errorMessage = 'Scheduling service is temporarily unavailable';
      }
      
      console.error('Qualiphy API error:', errorMessage, qualiphyData);
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: qualiphyData.http_code || 500 }
      );
    }

  } catch (error: unknown) {
    console.error('Unexpected error in Qualiphy API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again later.' 
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