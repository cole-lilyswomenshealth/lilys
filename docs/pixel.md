# Facebook Pixel Tracking Implementation

## Overview
Enterprise-level Facebook tracking implementation for ForHer weight loss user journey with dual client-side and server-side tracking for maximum data accuracy and iOS 14+ compliance.

## Architecture
- **Client-side**: Facebook Pixel for immediate PageView events
- **Server-side**: Conversions API for reliable event tracking with custom data
- **Dual tracking**: Bypasses iOS restrictions and ad blockers

## Configuration
- **FACEBOOK_PIXEL_ID**: `1442940036980408` (Client-side pixel)
- **FACEBOOK_ACCESS_TOKEN**: Server-side API access token
- **FACEBOOK_DATASET_ID**: Conversions API dataset ID

---

## Tracking Events by User Journey

### 1. Survey Start - Lead Event
**File**: `src/app/c/wm/lose-weight/components/WeightLossForm.tsx:165-170`
**Trigger**: First question interaction (offset === 1)
**Facebook Event**: `Lead`

```typescript
trackSurveyStart(window.location.href)
```

**Facebook Variables**:
- `content_category`: "weight_loss_assessment"
- `content_name`: "survey_started"
- `value`: 0
- `currency`: "USD"

---

### 2. Survey Completion - CompleteRegistration Event
**File**: `src/app/c/wm/lose-weight/components/WeightLossForm.tsx:228-237`
**Trigger**: Last question submitted with contact info
**Facebook Event**: `CompleteRegistration`

```typescript
trackSurveyCompletion(
  window.location.href,
  contactInfo,        // User data for hashing
  bmi,               // Calculated BMI
  ageGroup,          // Age group selection
  isEligible         // Medical eligibility
)
```

**Facebook Variables**:
- `content_category`: "weight_loss_assessment"
- `content_name`: "survey_completed"
- `em`: [hashed_email]
- `fn`: [hashed_first_name]
- `ln`: [hashed_last_name]
- `st`: [state]
- `db`: [date_of_birth_YYYYMMDD]
- `bmi`: [calculated_bmi]
- `age_group`: [age_range]
- `eligible`: [true/false]

---

### 3. Results Page View - ViewContent Event
**File**: `src/app/c/wm/results/page.tsx:144-159`
**Trigger**: Results page load
**Facebook Event**: `ViewContent`

```typescript
trackResultsPageView(
  window.location.href,
  'semaglutide',     // Recommended plan
  isEligible         // From session storage
)
```

**Facebook Variables**:
- `content_type`: "subscription_recommendation"
- `content_category`: "weight_loss_results"
- `content_ids`: ["semaglutide"]
- `eligible`: [true/false]
- `content_name`: "semaglutide_recommendation"

---

### 4. Subscription Page View - ViewContent Event
**File**: `src/app/(default)/subscriptions/components/SubscriptionDetails.tsx:225-241`
**Trigger**: Subscription page load
**Facebook Event**: `ViewContent`

```typescript
trackSubscriptionView(
  window.location.href,
  subscription.slug.current,    // e.g., "semaglutide"
  subscription.title,           // e.g., "Semaglutide"
  currentPrice                  // Selected variant or base price
)
```

**Facebook Variables**:
- `content_type`: "subscription_plan"
- `content_category`: "weight_loss"
- `content_ids`: [subscription_slug]
- `content_name`: [subscription_title]
- `value`: [price]
- `currency`: "USD"

---

### 5. Variant Selection - AddToCart Event
**File**: `src/app/(default)/subscriptions/components/SubscriptionDetails.tsx:243-264`
**Trigger**: User selects a subscription variant
**Facebook Event**: `AddToCart`

```typescript
trackVariantSelection(
  window.location.href,
  subscription.slug.current,
  subscription.title,
  selectedVariant.title,        // e.g., "2.5mg - 3 Month"
  selectedVariant.price,
  selectedVariant.billingPeriod,
  dosage                        // e.g., "2.5mg"
)
```

**Facebook Variables**:
- `content_type`: "subscription_variant"
- `content_ids`: [subscription_slug]
- `content_name`: "[subscription_title] - [variant_title]"
- `value`: [variant_price]
- `currency`: "USD"
- `billing_period`: [monthly/three_month/six_month/annually]
- `dosage`: [amount + unit]
- `variant_selected`: [variant_title]

---

### 6. Purchase Initiation - InitiateCheckout Event
**File**: `src/app/(default)/subscriptions/components/PurchaseSection.tsx:76-94`
**Trigger**: "Buy Now" button click
**Facebook Event**: `InitiateCheckout`

```typescript
trackPurchaseInitiation(
  window.location.href,
  subscription.slug.current,
  subscription.title,
  finalPrice,                   // After coupon discount
  appliedCouponCode,           // If any
  selectedVariantTitle         // Selected variant
)
```

**Facebook Variables**:
- `content_type`: "subscription"
- `content_ids`: [subscription_slug]
- `content_name`: [subscription_title]
- `value`: [final_price_after_discount]
- `currency`: "USD"
- `num_items`: 1
- `coupon_applied`: [coupon_code_or_null]
- `variant_selected`: [variant_title]

---

### 7. Purchase Completion - Purchase Event
**File**: To be implemented in Stripe success webhook
**Trigger**: Successful payment completion
**Facebook Event**: `Purchase`

```typescript
trackPurchaseCompletion(
  eventSourceUrl,
  subscriptionSlug,
  subscriptionTitle,
  paidAmount,                   // Actual charged amount
  transactionId,               // Stripe payment intent ID
  subscriptionId,              // Internal subscription ID
  billingCycle                 // Billing frequency
)
```

**Facebook Variables**:
- `content_type`: "subscription"
- `content_ids`: [subscription_slug]
- `value`: [paid_amount]
- `currency`: "USD"
- `transaction_id`: [stripe_payment_intent_id]
- `subscription_id`: [internal_subscription_id]
- `plan_name`: [subscription_title]
- `billing_cycle`: [billing_period]

---

## Implementation Files

### Core Infrastructure
- **`src/utils/validation.ts`**: Enhanced Facebook event schema with all new event types and custom data fields
- **`src/app/api/facebook/track-event/route.ts`**: Server-side Conversions API endpoint with user data hashing
- **`src/utils/facebookTracking.ts`**: All tracking functions with proper TypeScript interfaces
- **`src/components/Analytics/FacebookPixel.tsx`**: Client-side pixel with global type declarations

### Integration Points
- **`src/app/c/wm/lose-weight/components/WeightLossForm.tsx`**: Survey start and completion tracking
- **`src/app/c/wm/results/page.tsx`**: Results page view tracking
- **`src/app/(default)/subscriptions/components/SubscriptionDetails.tsx`**: Subscription view and variant selection
- **`src/app/(default)/subscriptions/components/PurchaseSection.tsx`**: Purchase initiation tracking

---

## Facebook Business Manager Filtering

### Event Manager Custom Filters

#### 1. Weight Loss Funnel Analysis
```
Event = "Lead" AND content_category = "weight_loss_assessment"
Event = "CompleteRegistration" AND content_category = "weight_loss_assessment"
Event = "ViewContent" AND content_category = "weight_loss_results"
Event = "InitiateCheckout" AND content_type = "subscription"
Event = "Purchase" AND content_type = "subscription"
```

#### 2. Eligibility Segmentation
```
Event = "CompleteRegistration" AND eligible = true
Event = "ViewContent" AND eligible = false
```

#### 3. BMI-based Targeting
```
Event = "CompleteRegistration" AND bmi >= 25 AND bmi < 30
Event = "CompleteRegistration" AND bmi >= 30
```

#### 4. Geographic Analysis
```
Event = "CompleteRegistration" AND st = "California"
Event = "CompleteRegistration" AND st = "Texas"
```

#### 5. Price Sensitivity Analysis
```
Event = "InitiateCheckout" AND coupon_applied IS NOT NULL
Event = "Purchase" AND value > 200
Event = "AddToCart" AND billing_period = "annually"
```

#### 6. Product Performance
```
Event = "ViewContent" AND content_ids CONTAINS "semaglutide"
Event = "AddToCart" AND content_ids CONTAINS "tirzepatide"
Event = "Purchase" AND plan_name CONTAINS "Semaglutide"
```

### Custom Audiences

#### 1. High-Intent Users
- **Survey Completers**: `Event = "CompleteRegistration"`
- **Eligible Users**: `Event = "CompleteRegistration" AND eligible = true`
- **High BMI**: `Event = "CompleteRegistration" AND bmi >= 30`

#### 2. Retargeting Audiences
- **Survey Starters**: `Event = "Lead"` NOT `Event = "CompleteRegistration"`
- **Results Viewers**: `Event = "ViewContent" AND content_category = "weight_loss_results"`
- **Cart Abandoners**: `Event = "InitiateCheckout"` NOT `Event = "Purchase"`

#### 3. Lookalike Sources
- **Purchasers**: `Event = "Purchase"`
- **High-Value Purchasers**: `Event = "Purchase" AND value > 300`
- **Annual Subscribers**: `Event = "Purchase" AND billing_cycle = "annually"`

### Custom Conversions

#### 1. Qualified Lead
- **Event**: `CompleteRegistration`
- **Filter**: `content_category = "weight_loss_assessment" AND eligible = true`

#### 2. Product Interest
- **Event**: `ViewContent`
- **Filter**: `content_type = "subscription_plan"`

#### 3. High-Intent Purchase
- **Event**: `InitiateCheckout`
- **Filter**: `value > 200`

#### 4. Subscription Success
- **Event**: `Purchase`
- **Filter**: `content_type = "subscription"`

---

## Data Quality & Privacy

### Automatic Data Hashing
- **Email**: Meta automatically hashes `em` parameter
- **Names**: Meta automatically hashes `fn` and `ln` parameters
- **DOB**: Formatted as YYYYMMDD before sending

### GDPR/CCPA Compliance
- No sensitive health data sent to Meta
- Only aggregated BMI values (not specific weight/height)
- User consent handled through existing privacy policy

### Error Handling
- Silent failures in production
- Development logging for debugging
- Enterprise-level error boundaries in components

---

## Testing & Validation

### Facebook Events Manager
1. Navigate to **Events Manager** → **Test Events**
2. Use browser extension or test code to verify events
3. Check **Data Sources** → **Conversions API** for server-side events

### Expected Event Flow
1. **Lead** → Survey start
2. **CompleteRegistration** → Survey completion with user data
3. **ViewContent** → Results page with eligibility status
4. **ViewContent** → Subscription page with pricing
5. **AddToCart** → Variant selection with dosage info
6. **InitiateCheckout** → Purchase button with coupon data
7. **Purchase** → Payment success with transaction details

This implementation provides enterprise-level tracking with rich custom data for advanced audience building and campaign optimization.