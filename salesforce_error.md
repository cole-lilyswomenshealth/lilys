# Salesforce Debug Logging Documentation

## Overview
This document describes the debugging logs added to diagnose Salesforce lead creation issues between localhost and Vercel environments.

## Added Debug Logs

### 1. API Route Logs (`src/app/api/weight-loss-lead/route.ts`)

#### Log Pattern: `[SALESFORCE_DEBUG]`
All Salesforce-related logs use this prefix for easy filtering in Vercel logs.

#### Logs Added:

**A. Request Received Log:**
```javascript
console.log('[SALESFORCE_DEBUG] Weight Loss Lead API - Request received:', {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  hasFormData: !!formData,
  hasContactInfo: !!contactInfo,
  formDataKeys: formData ? Object.keys(formData) : [],
  contactInfoKeys: contactInfo ? Object.keys(contactInfo) : []
});
```
- **Purpose**: Verify request data structure
- **What to check**: Are formData and contactInfo properly received?

**B. Data Transformation Log:**
```javascript
console.log('[SALESFORCE_DEBUG] Lead data transformed:', {
  leadData: leadData,
  requiredFieldsPresent: {
    firstName: !!leadData.FirstName,
    lastName: !!leadData.LastName,
    email: !!leadData.Email,
    company: !!leadData.Company
  }
});
```
- **Purpose**: Verify data transformation is working
- **What to check**: Are required fields properly mapped?

**C. Before Salesforce Call Log:**
```javascript
console.log('[SALESFORCE_DEBUG] Calling Salesforce API...');
```
- **Purpose**: Mark the start of Salesforce operation

**D. Salesforce Response Log:**
```javascript
console.log('[SALESFORCE_DEBUG] Salesforce API response:', {
  success: result.success,
  leadId: result.id,
  error: result.error,
  timestamp: new Date().toISOString()
});
```
- **Purpose**: See actual Salesforce response
- **What to check**: Is `result.success` false? What's the error message?

**E. Success Log:**
```javascript
console.log('[SALESFORCE_DEBUG] Lead created successfully:', result.id);
```
- **Purpose**: Confirm successful lead creation

**F. Failure Log:**
```javascript
console.error('[SALESFORCE_DEBUG] Lead creation failed:', {
  error: result.error,
  leadData: leadData
});
```
- **Purpose**: Detailed failure information
- **What to check**: Specific error from Salesforce API

**G. Unexpected Error Log:**
```javascript
console.error('[SALESFORCE_DEBUG] Unexpected API error:', {
  message: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
  name: error instanceof Error ? error.name : 'Unknown',
  timestamp: new Date().toISOString()
});
```
- **Purpose**: Catch any unexpected errors

### 2. Salesforce Service Logs (To be added)

#### Additional logs needed in `src/lib/salesforce.ts`:

**A. Authentication logs**
**B. SOAP request/response logs**
**C. Environment variable validation logs**

## How to View Logs in Vercel

### 1. Real-time Function Logs:
```bash
# In Vercel dashboard
Functions → View Function Logs → Filter by "[SALESFORCE_DEBUG]"
```

### 2. CLI Monitoring:
```bash
vercel logs --follow
```

### 3. Specific Function Logs:
```bash
vercel logs [deployment-url] --since=1h
```

## Expected Log Flow (Success)

1. `[SALESFORCE_DEBUG] Weight Loss Lead API - Request received`
2. `[SALESFORCE_DEBUG] Lead data transformed`
3. `[SALESFORCE_DEBUG] Calling Salesforce API...`
4. `[SALESFORCE_DEBUG] Salesforce API response` (with success: true)
5. `[SALESFORCE_DEBUG] Lead created successfully`

## Expected Log Flow (Failure)

1. `[SALESFORCE_DEBUG] Weight Loss Lead API - Request received`
2. `[SALESFORCE_DEBUG] Lead data transformed`
3. `[SALESFORCE_DEBUG] Calling Salesforce API...`
4. `[SALESFORCE_DEBUG] Salesforce API response` (with success: false)
5. `[SALESFORCE_DEBUG] Lead creation failed` (with detailed error)

## Common Issues to Look For

### 1. Environment Variables Missing:
- Look for: "Missing Salesforce credentials" in logs
- Solution: Check Vercel environment variables

### 2. Authentication Failure:
- Look for: "Authentication failed" in Salesforce response
- Solution: Verify credentials and security token

### 3. Network/Firewall Issues:
- Look for: Timeout or connection errors
- Solution: Check if Vercel IPs are whitelisted in Salesforce

### 4. Data Validation Errors:
- Look for: Salesforce field validation errors
- Solution: Check required field mappings

## Cleanup Instructions

To remove all debug logging after issue is resolved:

### 1. Remove from API Route:
Replace the entire POST function in `src/app/api/weight-loss-lead/route.ts` with the original version (removing all `console.log` and `console.error` statements with `[SALESFORCE_DEBUG]` prefix).

### 2. Remove from Salesforce Service:
Remove all `console.log` statements added to `src/lib/salesforce.ts`.

### 3. Delete This File:
```bash
rm salesforce_error.md
```

### 4. Search for Remaining Debug Logs:
```bash
grep -r "SALESFORCE_DEBUG" src/
```

## Quick Debug Commands

### Filter Vercel logs for Salesforce errors:
```bash
vercel logs | grep "SALESFORCE_DEBUG"
```

### Check last 50 Salesforce-related logs:
```bash
vercel logs --since=1h | grep "SALESFORCE_DEBUG" | tail -50
```

---

**Note**: This debugging setup is temporary and should be removed once the issue is identified and resolved.