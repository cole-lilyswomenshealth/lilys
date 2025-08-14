// src/types/salesforce.ts

/**
 * Salesforce API Response Types
 */
export interface SalesforceAuthResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export interface SalesforceCreateResponse {
  id: string;
  success: boolean;
  errors: any[];
}

export interface SalesforceErrorResponse {
  message: string;
  errorCode: string;
  fields?: string[];
}

/**
 * Salesforce Lead Object Fields
 * Matches the standard Lead object with custom fields
 */
export interface WeightLossLeadData {
  // Contact Information - Updated with new fields
  FirstName: string;
  LastName: string;
  Phone?: string;
  Company: string;
  Country?: string;
  State?: string;
  DOB__c?: string; // Date of Birth in YYYY-MM-DD format

  // Demographics
  Age_Group__c?: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  Is_Female__c?: 'Yes' | 'No';

  // Health Metrics
  Current_Weight__c?: number;
  Height_Feet__c?: number;
  Height_Inches__c?: number;
  BMI__c?: number;

  // Medical History
  Is_Pregnant__c?: 'Yes' | 'No';
  Is_Breastfeeding__c?: 'Yes' | 'No';
  Medical_Conditions__c?: string;
  Takes_Prescription_Medications__c?: 'Yes' | 'No';
  Has_Eating_Disorder__c?: 'Yes' | 'No';

  // Weight Loss History
  Previous_Weight_Loss_Attempts__c?: 'first-attempt' | 'didnt-work' | 'worked-temporarily';

  // System Fields
  Form_Submission_Date__c: string; // ISO date string
  LeadSource: string;
  Lead_Name__c: string; // For list view visibility
}

export interface SalesforceServiceResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface WeightLossLeadApiRequest {
  formData: Record<string, any>;
  contactInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state: string;
    dateOfBirth: string;
  };
}

export interface WeightLossLeadApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}


export interface FormDataMapping {
  [key: string]: string | string[] | number | object;
}

export interface ContactInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  dateOfBirth: string;
}