# GoHighLevel (GHL) Integration Documentation

## Overview
Integration between ForHer (Lily's Women's Health) telehealth platform and GoHighLevel CRM for lead management and customer tracking.

**Integration Date**: 2025-11-05
**Status**: Implementation Ready - Field Mappings Received
**Implementation Approach**: Code-based (Next.js API Routes + Stripe Webhooks)
**GHL Location ID**: Vu2giIsaSzilUPa8K4ec
**Note**: New website - No existing customer migration needed

---

## Integration Objectives

### 1. Lead Injection (Website → GHL)
Send all consultation survey submissions to GHL as leads with comprehensive survey data.

### 2. Customer Tracking (Stripe → GHL)
Automatically sync paying customers from Stripe to GHL with subscription metadata.

---

## Technical Architecture

### Current Tech Stack
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Payment**: Stripe v17
- **Auth**: Supabase Auth
- **CRM (Current)**: Salesforce (SOAP API)

### Implementation Strategy
- **Approach**: Server-side API integration (no third-party automation tools)
- **Pattern**: Parallel data submission (GHL + Salesforce + Supabase)
- **Error Handling**: Silent failures in production (non-blocking)
- **Phone Format**: E.164 conversion (+15555555555)

---

## Part 1: Survey Lead Injection

### GHL API Endpoint
```
POST https://services.leadconnectorhq.com/contacts/

Headers:
  Authorization: Bearer pit-9f0be75c-0556-49b8-a5ca-91435113abcb
  Content-Type: application/json
  Version: 2021-07-28

Body:
  {
    "locationId": "Vu2giIsaSzilUPa8K4ec",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@test.com",
    "phone": "+15555555555",
    "tags": ["lead", "weight-loss"],
    "source": "Website - Weight Loss Survey",
    "customFields": [
      {"key": "age_group", "value": "35-44"},
      {"key": "current_weight", "value": "180"}
    ]
  }
```

**Authentication & Format Updates (2025-11-07)**:
- **Authentication**: Private Integration Tokens (pit-xxxx) still require "Bearer" prefix per official GHL docs
- **Custom Fields**: Must be sent as `customFields` (plural) array with `{key, value}` objects (not single `customField` object)

### Survey Types & Data Collected

#### 1. Weight Management Survey (`/c/wm`)
**11 Questions Total**

| Field ID | Question | Type | Options/Format |
|----------|----------|------|----------------|
| `age-group` | Age group | Single Select | 18-24, 25-34, 35-44, 45-54, 55+ |
| `gender` | Are you female? | Single Select | Yes, No |
| `current-weight` | Current weight | Number Input | Pounds (numeric) |
| `height` | Height | Height Input | Feet + Inches (JSON object) |
| `bmi` | BMI (calculated) | Calculated | Numeric (auto-calculated) |
| `pregnant` | Currently pregnant? | Single Select | Yes, No |
| `breastfeeding` | Currently breastfeeding? | Single Select | Yes, No |
| `medical-conditions` | Medical conditions | Multi-Select | Type 1 Diabetes, Type 2 Diabetes, Hypertension, PCOS, Thyroid Disorder, Heart Disease, Kidney/Liver Disease, Depression/Anxiety, None |
| `prescription-medications` | Takes prescription meds? | Single Select | Yes, No |
| `eating-disorder` | Eating disorder diagnosis? | Single Select | Yes, No |
| `previous-weight-loss` | Previous weight loss attempts? | Single Select | First attempt, Didn't work, Worked temporarily |

**Contact Info Fields:**
- First Name
- Last Name
- Email
- Phone
- State (full name, e.g., "California")
- Date of Birth (YYYY-MM-DD)

**Calculated/Derived Fields:**
- `bmi`: Auto-calculated from weight + height
- `eligible`: Boolean (eligibility status based on survey answers)
- `age_group_category`: Derived from DOB

---

#### 2. Hair Loss Survey (`/c/hl`)
**7 Questions Total**

| Field ID | Question | Type | Options/Format |
|----------|----------|------|----------------|
| `age-group` | Age group | Single Select | 18-24, 25-34, 35-44, 45-54, 55+ |
| `gender` | Are you female? | Single Select | Yes, No |
| `hair-loss-duration` | When did hair loss start? | Single Select | <6 months, 6-12 months, >1 year |
| `affected-areas` | Affected scalp areas | Multi-Select | General thinning, Crown thinning, Receding hairline, Bald spots, No loss |
| `medical-conditions` | Medical conditions | Multi-Select | PCOS, Thyroid disorder, Anemia, Autoimmune disorder, None |
| `family-history` | Family history of hair loss? | Single Select | Yes, No |
| `current-treatments` | Current hair loss treatments? | Single Select | None, OTC products, Prescription, Hair procedures |

**Contact Info**: Same as Weight Management

---

#### 3. Birth Control Survey (`/c/b`)
**7 Questions Total**

| Field ID | Question | Type | Options/Format |
|----------|----------|------|----------------|
| `age` | Age group | Single Select | 18-24, 25-34, 35-44, 45-54, 55+ |
| `gender` | Are you female? | Single Select | Yes, No |
| `pregnant` | Currently pregnant? | Single Select | Yes, No |
| `breastfeeding` | Currently breastfeeding? | Single Select | Yes, No |
| `medical-conditions` | Medical conditions | Multi-Select | Diabetes, Hypertension, Heart Disease, Blood Clots, Depression/Anxiety, None |
| `bc-history` | Birth control history? | Single Select | Never, Side effects, Well tolerated |
| `preferred-method` | Preferred BC method? | Single Select | Pills, IUD, Implant, Not sure |

**Contact Info**: Same as Weight Management

---

### Tagging Strategy

**Survey Type Tags:**
- Weight Management: `["lead", "weight-loss"]`
- Hair Loss: `["lead", "hair-loss"]`
- Birth Control: `["lead", "birth-control"]`

**Status Tags** (optional):
- `["eligible"]` - Passed eligibility screening
- `["ineligible"]` - Failed eligibility screening
- `["appointment-scheduled"]` - Scheduled Qualiphy appointment

---

### GHL Custom Field Mapping (RECEIVED ✅)

**Received Date**: 2025-11-05

#### Universal Contact Fields
| Our Field | GHL Field Name | GHL Field ID |
|-----------|----------------|--------------|
| firstName | First Name | first_name |
| lastName | Last Name | last_name |
| email | Email | email |
| phone | Phone | phone |
| state | State | state |
| dateOfBirth | Date of Birth | date_of_birth |

#### Weight Management Survey Fields
| Our Field | GHL Field Name | GHL Field ID |
|-----------|----------------|--------------|
| age-group | Age Group | age_group |
| gender (female) | Female | female |
| current-weight | Current Weight | current_weight |
| height | Height | height |
| bmi | BMI | bmi |
| pregnant | Pregnant | pregnant |
| breastfeeding | Breastfeeding | breastfeeding |
| medical-conditions | Medical Conditions | medical_conditions |
| prescription-medications | Medications | medications |
| eating-disorder | Eating Disorder | eating_disorder |
| previous-weight-loss | Previous Weight Loss | previous_weight_loss |
| eligible | Elegible | elegible |

**Note**: Height will be sent as a combined string (e.g., "5'7\"") since GHL has single field

---

## Part 2: Stripe Customer Injection

### Stripe Webhook Integration

**Webhook Events to Monitor:**
- `invoice.payment_succeeded` → First successful payment (new customer)
- `customer.subscription.created` → New subscription created
- `customer.subscription.updated` → Subscription status change

### Customer Data Available

**From Stripe Customer Object:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+15555555555",
  "tags": ["stripe", "customer"]
}
```

**Subscription Metadata (Custom Fields):**
| Field | Description | Example |
|-------|-------------|---------|
| `subscription_id` | Stripe subscription ID | `sub_1234567890` |
| `stripe_customer_id` | Stripe customer ID | `cus_1234567890` |
| `plan_name` | Subscription plan name | "Semaglutide Monthly Subscription" |
| `medication_type` | Medication type | "Semaglutide" or "Tirzepatide" |
| `billing_amount` | Monthly billing amount | 297.00 |
| `billing_period` | Billing frequency | "month" or "year" |
| `billing_cycle` | Detailed cycle | "monthly", "quarterly", "annual" |
| `subscription_status` | Current status | "active", "trialing", "past_due", "canceled" |
| `start_date` | Subscription start date | "2025-01-15T10:30:00Z" |
| `next_billing_date` | Next billing date | "2025-02-15T10:30:00Z" |
| `trial_end` | Trial end date (if applicable) | "2025-01-22T10:30:00Z" |
| `pharmacy_name` | Assigned pharmacy | "Belmar Pharmacy" or "Revive Rx" |
| `dose_level` | Current dose level | 1, 2, 3, etc. |

**Coupon/Discount Data:**
| Field | Description | Example |
|-------|-------------|---------|
| `coupon_code` | Applied coupon code | "SAVE20" |
| `discount_amount` | Discount amount | 59.40 |
| `discount_percentage` | Discount percentage | 20 |

---

### GHL Stripe Customer Field Mapping (RECEIVED ✅)

**Received Date**: 2025-11-05

#### Subscription Metadata Fields
| Our Field | GHL Field Name | GHL Field ID | Campaign Use |
|-----------|----------------|--------------|--------------|
| subscription_id | Stripe Subscription ID | stripe_subscription_id | - |
| stripe_customer_id | Stripe Customer ID | stripe_customer_id | - |
| plan_name | Stripe Plan Name | stripe_plan_name | - |
| medication_type | Stripe Medication Type | stripe_medication_type | ✅ Campaign enrollment (Semaglutide vs Tirzepatide) |
| billing_amount | Stripe Billing Amount | stripe_billing_amount | - |
| billing_period | Stripe Billing Period | stripe_billing_period | - |
| subscription_status | Stripe Subscription Status | stripe_subscription_status | - |
| start_date | Stripe Start Date | stripe_start_date | - |
| next_billing_date | Stripe Next Billing Date | stripe_next_billing_date | ✅ Refill reminders |
| pharmacy_name | Stripe Pharmacy Name | stripe_pharmacy_name | - |
| dose_level | Stripe Dose Level | stripe_dose_level | ✅ Refill/upgrade campaigns |

**Customer Tags**: `["stripe", "customer"]` or both (GHL confirmed both work)

**GHL Campaign Automations**:
- `stripe_medication_type` → Triggers Semaglutide or Tirzepatide specific campaigns
- `stripe_dose_level` → Triggers dose escalation and refill campaigns
- `stripe_next_billing_date` → Triggers refill reminder automations

---

## Implementation Plan

### Phase 1: Core Infrastructure Setup
**Status**: Ready to implement
**Estimated Time**: 1-2 hours

**Files to Create**:
1. `src/lib/gohighlevel.ts` - GHL service class with API methods
2. `src/utils/phoneFormatter.ts` - E.164 phone number formatter
3. `src/app/api/gohighlevel/lead/route.ts` - Lead creation API endpoint
4. `src/types/gohighlevel.ts` - TypeScript interfaces for GHL data

**Environment Variables** (add to `.env.local`):
```bash
# GoHighLevel Integration
GHL_API_KEY=pit-9f0be75c-0556-49b8-a5ca-91435113abcb
GHL_LOCATION_ID=Vu2giIsaSzilUPa8K4ec
GHL_API_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
GHL_INTEGRATION_ENABLED=true
```

**Note**: As of 2025-11-07, GHL uses Private Integration Token (pit-xxxx) format. Despite being called "Private Integration" tokens, they still use standard Bearer token authentication format.

---

### Phase 2: Survey Lead Injection (Weight Loss Form)
**Status**: Ready to implement after Phase 1
**Estimated Time**: 2-3 hours
**Priority**: HIGH - Start with Weight Loss Survey only

**Files to Modify**:
1. `src/app/c/wm/lose-weight/components/WeightLossForm.tsx`
2. `src/hooks/useUserDataSubmission.ts` (add GHL call)

**Implementation Details**:
- **Initial submission**: Basic contact info only (first_name, last_name, email, phone)
- **Survey fields**: All weight management fields mapped to GHL custom fields
- **Tags**: `["lead", "weight-loss"]`
- **Non-blocking**: GHL failures should NOT prevent form submission
- **Parallel submission**: GHL + Salesforce + Supabase (all run simultaneously)

**Data Flow**:
```typescript
User submits Weight Loss Form
↓
Promise.all([
  salesforceService.createLead(),     // Existing
  supabaseService.saveUserData(),     // Existing
  ghlService.createLead()             // NEW - Non-blocking
])
```

**NOT Implementing (Future)**:
- Hair Loss Form integration (Phase 3 if needed)
- Birth Control Form integration (Phase 3 if needed)

---

### Phase 3: Stripe Customer Sync
**Status**: Implement after Phase 2
**Estimated Time**: 2-3 hours

**Files to Modify**:
1. `src/app/api/stripe/webhook/route.ts` - Main webhook handler
2. Find subscription creation/update handlers

**Webhook Events to Handle**:
```typescript
// Primary event for new customers
'invoice.payment_succeeded' → First payment → Tag as customer + add subscription metadata

// Secondary events for status tracking
'customer.subscription.updated' → Status changes (active, past_due, canceled)
```

**Implementation Details**:
- **When**: Only on first successful payment (`invoice.payment_succeeded`)
- **Action**: Update existing GHL contact (matched by email)
- **Tags**: Add `["stripe", "customer"]`
- **Metadata**: Include all subscription fields from mapping table
- **Contact matching**: Use email to find existing lead in GHL
- **Update, don't create**: Lead already exists from survey submission

**Data Flow**:
```typescript
Stripe webhook: invoice.payment_succeeded
↓
1. Update Supabase user_subscriptions (existing)
↓
2. Fetch user email from Supabase
↓
3. Call GHL API: Update contact by email
   - Add tags: ["stripe", "customer"]
   - Add custom fields: subscription metadata
   - medication_type → Triggers campaign enrollment
   - dose_level → Triggers refill campaigns
```

**Important Notes**:
- ✅ Website is NEW - No need to migrate existing customers
- ✅ All future customers will flow through: Survey → GHL Lead → Payment → GHL Customer
- ✅ GHL will use `stripe_medication_type` for campaign automation
- ✅ GHL will use `stripe_dose_level` for refill/upgrade campaigns

---

### Phase 4: Testing & Monitoring (Final Phase)
**Estimated Time**: 1-2 hours

**Test Cases**:
1. ✅ Submit weight loss survey → Verify GHL contact created with all fields
2. ✅ Invalid phone format → Verify E.164 conversion works
3. ✅ GHL API failure → Verify form submission still succeeds
4. ✅ Complete payment → Verify contact tagged as customer with subscription data
5. ✅ Multi-select medical conditions → Verify comma-separated format
6. ✅ Height field → Verify proper string formatting (5'7")

**Monitoring**:
- Log all GHL API calls with success/failure status
- Track error rates (alert if >10% failure rate)
- Verify campaign enrollments triggered by medication_type

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Completes Survey                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               ForHer Next.js Application                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Survey Form Component (Weight Loss/Hair/BC)         │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Parallel Data Submission (Promise.all)        │  │
│  │                                                       │  │
│  │  1. Salesforce Lead API ────► Salesforce CRM        │  │
│  │  2. Supabase user_data ─────► Supabase DB           │  │
│  │  3. GoHighLevel API ────────► GHL CRM (NEW)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   User Purchases via Stripe                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Stripe Webhook                          │
│              (invoice.payment_succeeded)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          ForHer Webhook Handler (/api/stripe/webhook)       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Update Supabase user_subscriptions               │  │
│  │  2. Send customer data to GHL (NEW)                  │  │
│  │     - Tag as "customer", "stripe"                    │  │
│  │     - Include subscription metadata                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Strategy

### Philosophy
**Non-blocking failures**: GHL integration failures should NOT prevent:
- Survey submission
- User account creation
- Stripe payment processing
- Qualiphy appointment scheduling

### Implementation
```typescript
try {
  await ghlService.createLead(leadData);
  console.log('✅ GHL lead created successfully');
} catch (error) {
  // Silent failure in production
  console.error('❌ GHL sync failed:', error);
  // Continue with user flow
}
```

### Monitoring & Logging
- Log all GHL API calls with timestamps
- Track success/failure rates
- Alert on sustained failures (>10% error rate)

---

## Testing Strategy

### Test Cases

**Lead Injection**:
1. ✅ Submit weight loss survey → Verify GHL contact created
2. ✅ Submit hair loss survey → Verify correct tags applied
3. ✅ Submit birth control survey → Verify custom fields populated
4. ✅ Invalid phone format → Verify E.164 conversion
5. ✅ GHL API failure → Verify non-blocking behavior
6. ✅ Multi-select fields → Verify comma-separated string format

**Customer Sync**:
1. ✅ New Stripe subscription → Verify GHL contact tagged as "customer"
2. ✅ Subscription update → Verify GHL contact updated
3. ✅ Subscription cancellation → Verify status updated in GHL
4. ✅ Coupon applied → Verify discount data sent to GHL

---

## Security & Compliance

### Data Protection
- ✅ **PII Handling**: All personal data transmitted over HTTPS
- ✅ **Phone Format**: E.164 standardization before sending
- ✅ **Email Validation**: Zod schema validation
- ✅ **API Key Security**: Stored in environment variables (never committed)

### Rate Limiting
- **Current**: 50 requests per 5 minutes (Upstash Redis)
- **GHL Limits**: To be confirmed with GHL team

### Data Retention
- GHL will become source of truth for lead data
- Supabase retains operational data
- Salesforce continues parallel tracking

---

## Decisions from GHL Team (Received 2025-11-05)

### 1. Custom Field Names ✅ RESOLVED
**Status**: Received complete mapping (see Fields.csv)
- All weight loss survey fields mapped
- All subscription metadata fields mapped
- Standard contact fields confirmed

### 2. Initial Requirements ✅ RESOLVED
**GHL Team Response**:
> "For now, the only required data on initial lead creation from the survey we need is basic contact info (first name, last name, email, phone). The additional survey fields are already set up in GHL, so if it's easy for you to pass them now, great! Otherwise we can add those later once the core lead flow is live."

**Our Decision**: Send ALL survey fields from the start (it's easy with our architecture)

### 3. Stripe Integration Approach ✅ RESOLVED
**GHL Team Response**:
> "For your webhook flow: are you planning to receive Stripe webhooks on your server first and then send the data to GHL (via API upsert)? That works perfectly. Just treat it the same way you send the survey form data."

**Confirmed Approach**: Server-to-GHL API via Stripe webhooks (not GHL inbound webhook)

### 4. Phone Format ✅ RESOLVED
**Our Implementation**: E.164 format (+15555555555)

### 5. Multi-Select Fields ✅ RESOLVED
**Our Implementation**: Comma-separated strings (e.g., "Type 1 Diabetes, PCOS, Hypertension")

### 6. Height Field ✅ RESOLVED
**GHL Field**: Single field called "height"
**Our Format**: Combined string like "5'7\"" or "5 feet 7 inches"

### 7. Tagging Strategy ✅ RESOLVED
**Survey Leads**: `["lead", "weight-loss"]`
**Paying Customers**: `["stripe", "customer"]` (GHL confirmed both tags work)

### 8. Contact Update Strategy ✅ RESOLVED
**Approach**: Update existing contact when lead becomes customer
- Match by email address
- Add customer tags
- Append subscription metadata to existing lead record

### 9. Campaign Automation Fields ✅ RESOLVED
**GHL Will Use**:
- `stripe_medication_type` → Enroll in Semaglutide vs Tirzepatide campaigns
- `stripe_dose_level` → Trigger refill upgrade campaigns
- `stripe_next_billing_date` → Refill reminder automations

### 10. Historical Data Migration ✅ NOT NEEDED
**Status**: New website - No existing customers to migrate

---

## Timeline

### Development Phase (Updated 2025-11-05)

**Phase 1: Infrastructure** (1-2 hours)
- Create GHL service class
- Create phone formatter utility
- Create API endpoint
- Add environment variables

**Phase 2: Weight Loss Form Integration** (2-3 hours)
- Modify WeightLossForm.tsx
- Add GHL call to submission flow
- Test lead creation with all survey fields
- Verify non-blocking behavior

**Phase 3: Stripe Customer Sync** (2-3 hours)
- Add GHL update to Stripe webhook handler
- Map subscription metadata to GHL custom fields
- Test customer tagging and field population
- Verify campaign automation triggers

**Phase 4: Testing & Deployment** (1-2 hours)
- End-to-end testing
- Error handling validation
- Production deployment
- Monitor initial submissions

**Total Estimated Time**: 6-10 hours
**Target Completion**: TBD

### Prerequisites ✅ ALL COMPLETE
- ✅ GHL custom field mapping received (2025-11-05)
- ✅ API credentials confirmed (Location ID: Vu2giIsaSzilUPa8K4ec)
- ✅ Implementation approach confirmed (server-to-GHL API)
- ✅ Field format decisions made
- ✅ Campaign automation fields identified

---

## Success Metrics

### KPIs to Track
1. **Lead Capture Rate**: % of surveys successfully sent to GHL
2. **Customer Sync Rate**: % of Stripe payments synced to GHL
3. **API Error Rate**: % of failed GHL API calls
4. **Data Accuracy**: Manual spot-check of 20 random contacts
5. **Performance Impact**: Average survey submission time (should be <200ms additional latency)

---

## Rollback Plan

If integration issues arise:
1. **Immediate**: Disable GHL API calls via feature flag
2. **Short-term**: Continue Salesforce + Supabase only
3. **Long-term**: Fix issues in staging, re-deploy to production

**Feature Flag**:
```bash
# .env.local
GHL_INTEGRATION_ENABLED=false  # Set to false to disable
```

---

## Support & Maintenance

### Ongoing Responsibilities
- **ForHer Dev Team**: API integration, error monitoring, bug fixes
- **GHL Team**: Custom field setup, webhook configuration, API support

### Contact Information
- **ForHer Technical Contact**: [Your Email]
- **GHL Account Manager**: [Their Email]
- **Integration Support**: [Support Channel]

---

**Document Version**: 1.0
**Last Updated**: 2025-11-04
**Author**: ForHer Development Team
**Status**: Awaiting GHL Custom Field Mapping
