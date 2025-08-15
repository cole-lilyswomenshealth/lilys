# Salesforce Debug Dashboard Documentation

## Overview
This document describes the debugging dashboard created to diagnose Salesforce lead creation issues between localhost and Vercel environments.

## Files Created

### 1. Debug Dashboard Page
**File:** `src/app/debug-salesforce/page.tsx`
- **Purpose**: React component that provides a web interface for debugging Salesforce integration
- **Features**:
  - TypeScript interfaces for all response types
  - Real-time debug test execution
  - Comprehensive error display
  - Environment variables status
  - Step-by-step debugging results

### 2. Debug API Endpoint
**File:** `src/app/api/debug-salesforce/route.ts`
- **Purpose**: Backend API that performs comprehensive Salesforce testing
- **Features**:
  - Environment variables validation
  - Authentication testing
  - Lead creation testing with hardcoded payload
  - Detailed error reporting

## TypeScript Interfaces

### Core Interfaces Defined:

```typescript
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
```

## Hardcoded Test Payload

The debug API uses this exact payload (matching successful localhost test):

```javascript
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
```

## Debug Flow

### Step 1: Environment Check
- Validates presence of `SALESFORCE_USERNAME`
- Validates presence of `SALESFORCE_PASSWORD`
- Validates presence of `SALESFORCE_LOGIN_URL`
- Shows partial username for verification

### Step 2: Authentication Test
- Attempts Salesforce SOAP login
- Returns session ID and server URL on success
- Captures detailed error messages on failure

### Step 3: Lead Creation Test
- Only runs if authentication succeeds
- Uses hardcoded test payload
- Transforms data using existing service methods
- Attempts to create lead in Salesforce
- Returns lead ID on success or detailed error

## Dashboard Features

### 1. Test Summary Section
- Timestamp of test execution
- Total duration in milliseconds
- Environment status (Ready/Missing Vars)
- Overall test result (Success/Failed)

### 2. Environment Variables Section
- Visual status indicators (✅/❌)
- Masked sensitive values
- Shows actual login URL
- Shows partial username for verification

### 3. Authentication Results Section
- Success/failure status
- Session ID length (for verification)
- Server URL (for verification)
- Full error messages and SOAP responses

### 4. Lead Creation Results Section
- Success/failure status
- Generated Lead ID
- HTTP response status
- Detailed error messages
- Test payload used

### 5. Raw JSON Section
- Expandable section with complete debug response
- Useful for technical analysis

## Access Information

### URL Access:
- **Local**: `http://localhost:3000/debug-salesforce`
- **Production**: `https://www.lilyswomenshealth.com/debug-salesforce`

### API Endpoint:
- **Local**: `http://localhost:3000/api/debug-salesforce`
- **Production**: `https://www.lilyswomenshealth.com/api/debug-salesforce`

## Usage Instructions

### For Testing:
1. Deploy the debug files to Vercel
2. Navigate to the debug dashboard URL
3. Click "🚀 Run Salesforce Debug Test"
4. Review results in each section
5. Check for differences between localhost and production results

### For Troubleshooting:
1. **Environment Issues**: Check if all three environment variables show ✅
2. **Authentication Issues**: Look at authentication section for SOAP errors
3. **Lead Creation Issues**: Check lead creation section for Salesforce API errors
4. **Network Issues**: Check if authentication succeeds but lead creation fails

## Debug Log Pattern

All debug dashboard logs use the pattern: `[SALESFORCE_DEBUG_PAGE]`

Example logs you'll see:
```
[SALESFORCE_DEBUG_PAGE] Starting comprehensive debug test...
[SALESFORCE_DEBUG_PAGE] Environment check: {...}
[SALESFORCE_DEBUG_PAGE] Testing authentication...
[SALESFORCE_DEBUG_PAGE] Authentication successful
[SALESFORCE_DEBUG_PAGE] Testing lead creation...
[SALESFORCE_DEBUG_PAGE] Lead creation result: {...}
[SALESFORCE_DEBUG_PAGE] Debug test completed: {...}
```

## Security Considerations

### Data Protection:
- Passwords are never displayed, only their presence
- Usernames are partially masked
- Session IDs are only shown by length
- Test data uses safe dummy values

### Access Control:
- No authentication required (temporary debug tool)
- Should be removed after debugging is complete
- Contains no sensitive business logic

## Cleanup Instructions

### Files to Remove:
1. `src/app/debug-salesforce/page.tsx`
2. `src/app/api/debug-salesforce/route.ts`
3. `debug_salesforce.md` (this file)

### Steps to Clean Up:
1. **Remove Files**:
   ```bash
   rm -rf src/app/debug-salesforce/
   rm -rf src/app/api/debug-salesforce/
   rm debug_salesforce.md
   ```

2. **Search for Remaining Debug Code**:
   ```bash
   grep -r "SALESFORCE_DEBUG_PAGE" src/
   grep -r "debug-salesforce" src/
   ```

3. **Remove Debug Logs from Original Files**:
   - Remove all `[SALESFORCE_DEBUG]` logs from `src/app/api/weight-loss-lead/route.ts`
   - Remove all `[SALESFORCE_DEBUG]` logs from `src/lib/salesforce.ts`
   - See `salesforce_error.md` for specific cleanup instructions

4. **Verify Cleanup**:
   ```bash
   grep -r "SALESFORCE_DEBUG" src/
   ```
   Should return no results.

## Expected Results

### Localhost (Working):
- ✅ Environment: All variables present
- ✅ Authentication: Success with session ID
- ✅ Lead Creation: Success with lead ID

### Vercel (Broken):
- ❌ Environment: Missing variables OR
- ❌ Authentication: SOAP/network error OR
- ❌ Lead Creation: API permission error

The debug dashboard will reveal exactly where the difference lies between the two environments.

---

**Note**: This debugging setup is temporary and should be removed once the Salesforce integration issue is identified and resolved.