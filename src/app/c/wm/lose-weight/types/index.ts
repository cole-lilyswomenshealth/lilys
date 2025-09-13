//src/app/c/wm/lose-weight/types/index.ts

// Question option type
export interface QuestionOption {
  id: string;
  label: string;
}

// Base question interface
export interface BaseQuestion {
  id: string;
  question: string;
  description: string;
  type: QuestionType;
  conditionalDisplay?: (formData: Record<string, any>) => boolean;
}

// Question types enum
export enum QuestionType {
  SingleSelect = "single-select",
  MultiSelect = "multi-select",
  TextInput = "text-input",
  HeightInput = "height-input",
  ContactInfo = "contact-info"
}

// Single select question
export interface SingleSelectQuestion extends BaseQuestion {
  type: QuestionType.SingleSelect;
  options: QuestionOption[];
}

// Multi select question
export interface MultiSelectQuestion extends BaseQuestion {
  type: QuestionType.MultiSelect;
  options: QuestionOption[];
}

// Text input question
export interface TextInputQuestion extends BaseQuestion {
  type: QuestionType.TextInput;
  placeholder: string;
  inputType: string; // "text", "number", etc.
  validation?: (value: string) => boolean;
  errorMessage?: string;
}

// Height input question
export interface HeightInputQuestion extends BaseQuestion {
  type: QuestionType.HeightInput;
  placeholder: string;
  inputType: string; // "height"
  validation?: (value: string) => boolean;
  errorMessage?: string;
}

// Contact info question
export interface ContactInfoQuestion extends BaseQuestion {
  type: QuestionType.ContactInfo;
  fields: {
    firstName: boolean;
    lastName: boolean;
    email: boolean;
    phone: boolean;
    state: boolean;
    dateOfBirth: boolean;
  };
}

// Union type of all question types
export type Question = SingleSelectQuestion | MultiSelectQuestion | TextInputQuestion | HeightInputQuestion | ContactInfoQuestion;

// Updated contact info data interface
export interface ContactInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  dateOfBirth: string;
}

// Form response type
export interface FormResponse {
  [questionId: string]: string | string[] | number | ContactInfoData;
}

// Form data state
export interface FormState {
  responses: FormResponse;
  currentOffset: number;
}

// US States data
export interface USState {
  name: string;
  abbreviation: string;
}

// All US states plus DC
export const US_STATES: USState[] = [
  { name: 'Alabama', abbreviation: 'AL' },
  { name: 'Alaska', abbreviation: 'AK' },
  { name: 'Arizona', abbreviation: 'AZ' },
  { name: 'Arkansas', abbreviation: 'AR' },
  { name: 'California', abbreviation: 'CA' },
  { name: 'Colorado', abbreviation: 'CO' },
  { name: 'Connecticut', abbreviation: 'CT' },
  { name: 'Delaware', abbreviation: 'DE' },
  { name: 'District of Columbia', abbreviation: 'DC' },
  { name: 'Florida', abbreviation: 'FL' },
  { name: 'Georgia', abbreviation: 'GA' },
  { name: 'Hawaii', abbreviation: 'HI' },
  { name: 'Idaho', abbreviation: 'ID' },
  { name: 'Illinois', abbreviation: 'IL' },
  { name: 'Indiana', abbreviation: 'IN' },
  { name: 'Iowa', abbreviation: 'IA' },
  { name: 'Kansas', abbreviation: 'KS' },
  { name: 'Kentucky', abbreviation: 'KY' },
  { name: 'Louisiana', abbreviation: 'LA' },
  { name: 'Maine', abbreviation: 'ME' },
  { name: 'Maryland', abbreviation: 'MD' },
  { name: 'Massachusetts', abbreviation: 'MA' },
  { name: 'Michigan', abbreviation: 'MI' },
  { name: 'Minnesota', abbreviation: 'MN' },
  { name: 'Mississippi', abbreviation: 'MS' },
  { name: 'Missouri', abbreviation: 'MO' },
  { name: 'Montana', abbreviation: 'MT' },
  { name: 'Nebraska', abbreviation: 'NE' },
  { name: 'Nevada', abbreviation: 'NV' },
  { name: 'New Hampshire', abbreviation: 'NH' },
  { name: 'New Jersey', abbreviation: 'NJ' },
  { name: 'New Mexico', abbreviation: 'NM' },
  { name: 'New York', abbreviation: 'NY' },
  { name: 'North Carolina', abbreviation: 'NC' },
  { name: 'North Dakota', abbreviation: 'ND' },
  { name: 'Ohio', abbreviation: 'OH' },
  { name: 'Oklahoma', abbreviation: 'OK' },
  { name: 'Oregon', abbreviation: 'OR' },
  { name: 'Pennsylvania', abbreviation: 'PA' },
  { name: 'Rhode Island', abbreviation: 'RI' },
  { name: 'South Carolina', abbreviation: 'SC' },
  { name: 'South Dakota', abbreviation: 'SD' },
  { name: 'Tennessee', abbreviation: 'TN' },
  { name: 'Texas', abbreviation: 'TX' },
  { name: 'Utah', abbreviation: 'UT' },
  { name: 'Vermont', abbreviation: 'VT' },
  { name: 'Virginia', abbreviation: 'VA' },
  { name: 'Washington', abbreviation: 'WA' },
  { name: 'West Virginia', abbreviation: 'WV' },
  { name: 'Wisconsin', abbreviation: 'WI' },
  { name: 'Wyoming', abbreviation: 'WY' }
];