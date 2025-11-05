// GoHighLevel (GHL) TypeScript Types

/**
 * GHL Contact - Universal fields for all leads
 */
export interface GHLContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // E.164 format: +15555555555
  locationId: string; // GHL Location ID
  tags?: string[]; // e.g., ["lead", "weight-loss"]
  customField?: Record<string, string | number | boolean | null>; // Custom fields object
  source?: string; // Lead source
  state?: string; // Full state name (e.g., "California")
  dateOfBirth?: string; // YYYY-MM-DD format
}

/**
 * Weight Management Survey - Custom fields
 */
export interface GHLWeightLossCustomFields {
  age_group?: string; // "18-24", "25-34", "35-44", "45-54", "55+"
  female?: string; // "Yes" or "No"
  current_weight?: number; // Pounds
  height?: string; // Combined string: "5'7\"" or "5 feet 7 inches"
  bmi?: number; // Calculated BMI
  pregnant?: string; // "Yes" or "No"
  breastfeeding?: string; // "Yes" or "No"
  medical_conditions?: string; // Comma-separated: "Type 1 Diabetes, PCOS, Hypertension"
  medications?: string; // "Yes" or "No"
  eating_disorder?: string; // "Yes" or "No"
  previous_weight_loss?: string; // "First attempt", "Didn't work", "Worked temporarily"
  elegible?: string; // "Yes" or "No" (note: GHL spelling)
  state?: string; // Full state name
  date_of_birth?: string; // YYYY-MM-DD
}

/**
 * Weight Loss Lead Data - Complete structure for GHL API
 */
export interface GHLWeightLossLead {
  // Required contact fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // E.164 format
  locationId: string;

  // Optional fields
  tags: string[]; // ["lead", "weight-loss"]
  source?: string;

  // Custom fields
  customField: GHLWeightLossCustomFields;
}

/**
 * Stripe Customer Metadata - Custom fields (Future Phase)
 */
export interface GHLStripeCustomFields {
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  stripe_plan_name?: string;
  stripe_medication_type?: string; // "Semaglutide" or "Tirzepatide"
  stripe_billing_amount?: number;
  stripe_billing_period?: string; // "month" or "year"
  stripe_subscription_status?: string; // "active", "trialing", "past_due", "canceled"
  stripe_start_date?: string; // ISO 8601
  stripe_next_billing_date?: string; // ISO 8601
  stripe_pharmacy_name?: string;
  stripe_dose_level?: number;
}

/**
 * GHL API Response
 */
export interface GHLApiResponse {
  contact?: {
    id: string;
    locationId: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    tags?: string[];
  };
  message?: string;
  error?: string;
}

/**
 * GHL Error Response
 */
export interface GHLError {
  statusCode: number;
  message: string;
  error?: string;
}
