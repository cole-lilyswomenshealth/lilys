# Facebook Pixel Debug Modifications

## Issue: URL Tracking Not Capturing Specific Subscription Pages

**Problem**: Facebook Events Manager shows root URL (`https://www.lilyswomenshealth.com/`) instead of specific subscription URLs like `/subscriptions/semaglutide`.

**Root Cause**: Potential timing issue between Next.js router and Facebook tracking execution.

---

## Debug Modifications Added

### 1. SubscriptionDetails.tsx Debug Logging

**File**: `src/app/(default)/subscriptions/components/SubscriptionDetails.tsx`

**Location**: Around line 225-241 (trackSubscriptionView call)

```typescript
// DEBUG: Log URL being sent to Facebook
console.log('🔍 DEBUG: Tracking URL:', window.location.href);
console.log('🔍 DEBUG: Router pathname:', router.pathname || 'undefined');
console.log('🔍 DEBUG: Window location pathname:', window.location.pathname);

trackSubscriptionView(
  window.location.href,
  subscription.slug.current,
  subscription.title,
  currentPrice
);
```

### 2. Variant Selection Debug Logging

**File**: `src/app/(default)/subscriptions/components/SubscriptionDetails.tsx`

**Location**: Around line 243-264 (trackVariantSelection call)

```typescript
// DEBUG: Log URL being sent to Facebook
console.log('🔍 DEBUG: Variant Selection URL:', window.location.href);

trackVariantSelection(
  window.location.href,
  subscription.slug.current,
  subscription.title,
  selectedVariant.title,
  selectedVariant.price,
  selectedVariant.billingPeriod,
  dosage
);
```

### 3. Purchase Initiation Debug Logging

**File**: `src/app/(default)/subscriptions/components/PurchaseSection.tsx`

**Location**: Around line 76-94 (trackPurchaseInitiation call)

```typescript
// DEBUG: Log URL being sent to Facebook
console.log('🔍 DEBUG: Purchase Initiation URL:', window.location.href);

trackPurchaseInitiation(
  window.location.href,
  subscription.slug.current,
  subscription.title,
  finalPrice,
  appliedCouponCode,
  selectedVariantTitle
);
```

---

## How to Test

1. **Open browser dev tools** (F12)
2. **Navigate to subscription page** (e.g., `/subscriptions/semaglutide`)
3. **Check console logs** for the debug messages
4. **Compare logged URL** with what appears in Facebook Events Manager

### Expected Output:
```
🔍 DEBUG: Tracking URL: https://www.lilyswomenshealth.com/subscriptions/semaglutide
🔍 DEBUG: Router pathname: /subscriptions/[slug]
🔍 DEBUG: Window location pathname: /subscriptions/semaglutide
```

### If URL is Wrong:
- If showing root URL (`/`) instead of `/subscriptions/semaglutide`
- Indicates timing issue with Next.js routing

---

## Cleanup Instructions

**After debugging is complete**, remove all lines containing:
- `console.log('🔍 DEBUG:`
- The corresponding debug logging statements

**Files to clean:**
- `src/app/(default)/subscriptions/components/SubscriptionDetails.tsx`
- `src/app/(default)/subscriptions/components/PurchaseSection.tsx`

**Search pattern for cleanup:**
```bash
grep -r "🔍 DEBUG" src/
```

---

## Alternative Solutions (if URL timing is confirmed)

### Option 1: Use Next.js Router
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
const fullUrl = `${window.location.origin}${router.pathname}`;
```

### Option 2: Pass URL as Prop
```typescript
// From parent component
const currentUrl = `${window.location.origin}/subscriptions/${subscription.slug.current}`;
trackSubscriptionView(currentUrl, ...);
```

### Option 3: Delay Tracking
```typescript
// Wait for router to settle
setTimeout(() => {
  trackSubscriptionView(window.location.href, ...);
}, 100);
```

---

## Status: 🟡 DEBUGGING IN PROGRESS

- [ ] Add debug logging to SubscriptionDetails.tsx
- [ ] Add debug logging to PurchaseSection.tsx  
- [ ] Test URL capture in browser
- [ ] Verify Facebook Events Manager shows correct URLs
- [ ] Remove debug logging after issue resolved

**Date Added**: 2025-01-16
**Reporter**: User
**Priority**: Medium (affects Facebook analytics accuracy)