# Comprehensive Codebase Analysis: ForHer Telehealth Platform

## Executive Summary
ForHer (Lily's Women's Health) is an enterprise-grade Next.js 15 telehealth platform specializing in women's health with a focus on weight loss through GLP-1 medications (Semaglutide & Tirzepatide). The platform features subscription management, telemedicine integration, multi-channel analytics, and CRM integration.

---

## 1. Architecture & Tech Stack

### Core Technologies
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript 5 (strict mode enabled)
- **Runtime**: React 19.1.0
- **Database**: Supabase (PostgreSQL)
- **CMS**: Sanity v3
- **Authentication**: Supabase Auth
- **Payments**: Stripe v17
- **Styling**: Tailwind CSS 3.4.1
- **Deployment**: Vercel (assumed from Next.js config)

### Additional Integrations
- **Analytics**: Facebook Pixel + Conversions API, Google Analytics
- **CRM**: Salesforce (SOAP API for lead management)
- **Telemedicine**: Qualiphy API
- **Email**: Resend
- **Rate Limiting**: Upstash Redis
- **AI**: OpenAI (likely for consultations)
- **i18n**: i18next (English & Spanish support)

---

## 2. Project Structure & Architecture Patterns

### Next.js 15 App Router Structure
```
src/
├── app/
│   ├── (default)/              # Default layout group
│   │   ├── page.tsx            # Homepage
│   │   ├── packages/           # Subscription packages
│   │   ├── subscriptions/      # Subscription management
│   │   ├── appointment/        # Appointment booking
│   │   ├── blog/               # Blog with Sanity CMS
│   │   ├── (legal)/            # Legal pages (nested group)
│   │   └── contact/            # Contact page
│   ├── account/                # User account management
│   │   └── subscriptions/      # User subscription dashboard
│   ├── c/                      # Consultation flows
│   │   ├── wm/                 # Weight management
│   │   ├── hl/                 # Hair loss
│   │   ├── b/                  # Birth control
│   │   └── consultation/       # General consultations
│   ├── admin/                  # Admin dashboard
│   ├── studio/                 # Sanity Studio CMS
│   ├── api/                    # API routes
│   └── layout.tsx              # Root layout
├── components/                 # Reusable UI components
├── store/                      # Zustand state management
├── lib/                        # Utility libraries
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
├── utils/                      # Utility functions
├── contexts/                   # React contexts
├── i18n/                       # Internationalization
├── sanity/                     # Sanity CMS configuration
└── services/                   # Business logic services
```

### Routing Architecture
- **Route Groups**: `(default)`, `(legal)` - for layout organization without URL segments
- **Dynamic Routes**: `[slug]`, `[category]` - for blog and subscriptions
- **Parallel Routes**: Separate consultation flows (wm, hl, b)

---

## 3. State Management Patterns

### Zustand Stores (with Persistence)

#### 1. **authStore.ts** - Authentication Management
```typescript
Pattern: Zustand + Session Storage Persistence
Features:
- User session management
- Supabase Auth integration
- Automatic session checking
- Sign out functionality
Storage: sessionStorage (auth-storage)
```

#### 2. **subscriptionStore.ts** - Subscription Management
```typescript
Pattern: Zustand + Session Storage + Broadcast Channel
Features:
- Multi-subscription support
- Active subscription detection
- Cross-tab synchronization (BroadcastChannel API)
- Automatic status sync with Stripe
- 30-second cache mechanism
- Optimistic UI updates
Storage: sessionStorage (subscription-storage)
Key Methods:
- fetchUserSubscriptions(userId, forceRefresh)
- cancelUserSubscription(subscriptionId)
- syncSubscriptionStatuses(userId)
```

#### 3. **Form Stores**
- `wmFormStore.ts` - Weight management form state
- `consultFormStore.ts` - Consultation form state
- `authFormStore.ts` - Authentication form state
- `orderStore.ts` - Order/checkout state

### State Management Patterns
```typescript
// Pattern 1: Persistent store with cross-tab sync
export const useSubscriptionStore = create<State>()(
  persist(
    (set, get) => ({
      // State and actions
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ /* select fields */ })
    }
  )
);

// Pattern 2: Broadcast Channel for cross-tab communication
broadcastSubscriptionChange('updated');
```

---

## 4. Authentication & Authorization

### Pattern: Supabase Auth + Zustand
**File**: `src/components/Auth/AuthProvider.tsx`

```typescript
Flow:
1. AuthProvider wraps entire app
2. Checks sessionStorage for existing auth
3. Subscribes to Supabase auth state changes
4. Auto-fetches subscriptions on authentication
5. Cleans up on sign out

Events Handled:
- SIGNED_IN: Set user + fetch subscriptions
- SIGNED_OUT: Clear user + reset subscriptions
- USER_UPDATED: Refresh user data
- TOKEN_REFRESHED: Update user session
```

### Protected Routes Pattern
```typescript
// Middleware pattern in pages
if (!isAuthenticated) {
  const returnUrl = encodeURIComponent(window.location.pathname);
  router.push(`/login?returnUrl=${returnUrl}`);
  return;
}
```

### Security Features
- RLS (Row Level Security) on Supabase tables
- Service role bypass for admin operations
- Cookie-based sessions
- Auto token refresh

---

## 5. API Integration Patterns

### 1. **Qualiphy API** - Telemedicine Integration
**File**: `src/app/api/qualiphy/route.ts`

```typescript
Features:
- Exam scheduling (Semaglutide exam 2413, Tirzepatide exam 2414)
- Dynamic pharmacy selection (Belmar for Semaglutide, Revive Rx for Tirzepatide)
- Dynamic dose package selection (Phase 1: always dose 1)
- State validation (29 supported states)
- Submission limit enforcement (1 per user)
- Meeting URL generation

Pharmacy Config Pattern:
const getPharmacyConfig = (examId: number) => {
  const medicationType = examId === 2413 ? 'semaglutide' : 'tirzepatide';
  return PHARMACY_DETAILS[medicationType];
};

Data Flow:
1. Validate user data
2. Check submission count in Supabase
3. Get exam_pos_id for dose level
4. Call Qualiphy exam_invite API
5. Store meeting URL in Supabase user_data
6. Return meeting link to user
```

### 2. **Stripe API** - Payment Processing
**Files**:
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/webhook/handlers/*.ts`

```typescript
Webhook Events Handled:
- checkout.session.completed
- invoice.payment_succeeded
- invoice.payment_failed
- customer.subscription.updated
- customer.subscription.deleted
- payment_intent.succeeded
- payment_intent.payment_failed

Pattern: Event Router → Handler Functions
Handlers Update: user_subscriptions table in Supabase

Subscription Management:
- POST /api/stripe/subscriptions/cancel - Cancel subscription
- POST /api/stripe/subscriptions/reactivate - Reactivate subscription
- POST /api/stripe/subscriptions/status - Sync status with Stripe
- POST /api/stripe/payment-session - Create payment session
```

### 3. **Facebook Conversions API** - Analytics
**File**: `src/app/api/facebook/track-event/route.ts`

```typescript
Pattern: Dual Tracking (Client Pixel + Server API)

Events Tracked:
- ViewContent: Subscription page visits
- Purchase: Successful payments
- Lead: Form submissions
- CompleteRegistration: Account creation
- AddToCart: Subscription selection
- InitiateCheckout: Checkout initiation

Custom Data Fields:
- Weight loss: bmi, age_group, eligible, billing_period, dosage
- Subscriptions: subscription_id, plan_name, billing_cycle
- Marketing: coupon_applied, variant_selected

Security Features:
- SHA256 hashing for PII (email, phone, name)
- Rate limiting (50 requests per 5 minutes)
- Zod schema validation
- Sensitive data redaction in errors
```

### 4. **Salesforce SOAP API** - Lead Management
**File**: `src/lib/salesforce.ts`

```typescript
Pattern: SOAP Authentication → REST API Operations

Custom Object: Weight_Loss_Lead__c
Fields:
- Contact: FirstName, LastName, Email, Phone, State, DOB
- Demographics: Age_Group__c, Is_Female__c
- Health: Current_Weight__c, Height_Feet__c, Height_Inches__c, BMI__c
- Medical: Is_Pregnant__c, Medical_Conditions__c, Has_Eating_Disorder__c
- History: Previous_Weight_Loss_Attempts__c
- Meta: Form_Submission_Date__c, LeadSource

Data Flow:
1. SOAP login → get sessionId
2. Transform form data → Salesforce Lead object
3. POST to REST API with Bearer token
4. Return lead ID

State Mapping:
- Converts abbreviations (NY) to full names (New York)
- Ensures Salesforce picklist compatibility
```

---

## 6. Component Patterns

### 1. **Server Components (Default)**
```typescript
// Pattern: Async server component with Sanity data fetching
export default async function BlogPage() {
  const posts = await sanityClient.fetch(QUERY);
  return <PostList posts={posts} />;
}
```

### 2. **Client Components**
```typescript
// Pattern: 'use client' directive + hooks
'use client';
export default function InteractiveForm() {
  const [state, setState] = useState();
  const { user } = useAuthStore();
  // ...
}
```

### 3. **Form Components**
```typescript
// Pattern: Multi-step forms with Zustand state
Features:
- Progress tracking
- Step validation
- Form persistence
- Dynamic question rendering
- Eligibility checking

Example: WeightLossForm
- Tracks progress (getProgressPercentage)
- Validates eligibility (checkEligibility)
- Submits to Salesforce + Supabase
- Facebook event tracking
```

### 4. **Reusable Component Library**
```
Auth: AuthProvider, LoginButton, LogoutButton, AuthCallback
Analytics: FacebookPixel, FacebookTracker
UI: Modal, ProgressBar, SubmitButton, LoadingFallback
Content: PortableText (Sanity), FaqAccordion, Ticker
Navigation: LanguageSwitcher, GlobalFooter
```

---

## 7. Database Schema Patterns

### Supabase Tables (Inferred)
```
user_data:
- id, email, first_name, last_name, phone, state, dob
- submission_count (limits Qualiphy appointments)
- meeting_url, meeting_uuid (from Qualiphy)
- exam_pos_id, dose_level
- created_at, updated_at

user_subscriptions:
- id, user_id, user_email
- plan_name, subscription_name
- billing_amount, billing_period
- start_date, end_date, next_billing_date
- status, is_active
- stripe_subscription_id, sanity_id
- cancellation_date
- created_at, updated_at

stripe_customers:
- Maps Supabase users to Stripe customers

orders / order_items:
- Stripe checkout and payment records
```

### RLS (Row Level Security) Pattern
```sql
-- Users can only access their own data
CREATE POLICY user_policy ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 8. Validation & Security Patterns

### Zod Schema Validation
**File**: `src/utils/validation.ts`

```typescript
Schemas:
- userIdSchema: UUID validation
- userEmailSchema: Email validation
- subscriptionIdSchema: UUID or Stripe ID
- couponCodeSchema: Alphanumeric codes
- statusSchema: Enum of subscription statuses
- facebookEventSchema: Event tracking validation

Functions:
- validateRequest(schema, data): Generic validator
- sanitizeString/Email/UserId: Input sanitization
- createSafeErrorMessage: Remove PII from errors
```

### Security Best Practices
1. **Input Sanitization**: Remove HTML tags, quotes, length limits
2. **PII Hashing**: SHA256 for Facebook API
3. **Rate Limiting**: Upstash Redis (50 req/5min)
4. **Error Handling**: Silent failures in production
5. **Environment Variables**: All sensitive data in .env.local

---

## 9. Key Features & Capabilities

### Core Features

#### 1. **Multi-Medication Subscription System**
- Semaglutide & Tirzepatide subscriptions
- Stripe-managed recurring billing
- Auto status sync
- Cancellation/reactivation support
- Multiple subscription support per user

#### 2. **Telemedicine Appointments**
- Qualiphy integration
- Automated scheduling
- Pharmacy assignment based on medication
- State-based availability (29 states)
- One appointment per user limit
- Dynamic dose progression (Phase 1: dose 1)

#### 3. **Multi-Channel Consultation Flows**
```
/c/wm - Weight Management
/c/hl - Hair Loss
/c/b - Birth Control
/c/consultation - General Consultations

Pattern:
1. Introduction → Questions → Contact Info → Submit
2. Eligibility checking
3. BMI calculation
4. Salesforce lead creation
5. Supabase data storage
6. Facebook event tracking
```

#### 4. **Content Management (Sanity CMS)**
- Blog with categories
- Dynamic subscription pages
- Portable Text rendering
- Image optimization
- Live preview support

#### 5. **Internationalization (i18n)**
- English & Spanish support
- Automatic language detection
- Translation management
- RTL support ready

#### 6. **Analytics & Tracking**
```
Client-side:
- Facebook Pixel (PageView)
- Google Analytics

Server-side:
- Facebook Conversions API (ViewContent, Purchase, Lead)
- Custom event data (BMI, eligibility, subscription details)
- PII hashing
- Cross-device tracking (fbp, fbc cookies)
```

#### 7. **Admin Dashboard**
- Subscription management
- Status synchronization
- Price comparison
- Manual subscription creation
- User data access

---

## 10. Code Quality Patterns

### TypeScript Patterns
```typescript
// 1. Const assertions for type safety
const EXAM_OPTIONS = {
  semaglutide: { id: 2413, title: '...' },
  tirzepatide: { id: 2414, title: '...' }
} as const;

// 2. Strict interface definitions
interface Subscription {
  id: string;
  status: 'active' | 'cancelled' | 'pending';
  // ...
}

// 3. Generic helper functions
function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T>
```

### Error Handling Patterns
```typescript
// 1. Try-catch with typed errors
try {
  await operation();
} catch (error: unknown) {
  const errorMessage = error instanceof Error
    ? error.message
    : 'Unknown error';
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}

// 2. Silent failures in production
try {
  await submitToSalesforce(data);
} catch (error) {
  // Handle error silently in production
}

// 3. Safe error messages (remove PII)
export function createSafeErrorMessage(error: unknown): string {
  return message.replace(/password|token|secret/gi, '[REDACTED]');
}
```

### API Route Pattern
```typescript
// Standard Next.js 15 API route
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    // Validate
    const validation = validateRequest(schema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    // Process
    const result = await processData(validation.data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## 11. Performance Optimizations

### Caching Strategies
```typescript
// 1. Subscription store cache (30-second TTL)
const hasRecentData = lastSync && (now - lastSync) < 30000;
if (hasRecentData && !forceRefresh) {
  return; // Use cached data
}

// 2. React Server Components (automatic caching)
// 3. Next.js Image optimization
// 4. Zustand persistence (sessionStorage)
```

### Loading States
- Skeleton loaders
- Loading fallback components
- Progressive enhancement
- Optimistic UI updates

---

## 12. Notable Patterns & Best Practices

### 1. **Cross-Tab Synchronization**
```typescript
// BroadcastChannel for subscription updates
const channel = new BroadcastChannel('subscription_status');
channel.postMessage({ type: 'SUBSCRIPTION_STATUS_CHANGE' });
```

### 2. **Dual Data Storage**
```typescript
// Pattern: Salesforce (CRM) + Supabase (App Data)
await Promise.all([
  submitToSalesforce(leadData),
  submitUserDataInBackground(userData)
]);
```

### 3. **Dynamic Configuration**
```typescript
// Pattern: Configuration based on business logic
const pharmacyConfig = getPharmacyConfig(examId);
const examPosId = await getExamPosId(examId, state);
```

### 4. **Medication-Specific Logic**
```typescript
// Pattern: Determine medication from plan name
const planName = subscription.plan_name?.toLowerCase() || '';
if (planName.includes('semaglutide')) return EXAM_OPTIONS.semaglutide;
if (planName.includes('tirzepatide')) return EXAM_OPTIONS.tirzepatide;
```

---

## 13. Environment Configuration

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Qualiphy
QUALIPHY_API_KEY=

# Facebook
FACEBOOK_PIXEL_ID=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_API_VERSION=

# Salesforce
SALESFORCE_USERNAME=
SALESFORCE_PASSWORD=
SALESFORCE_LOGIN_URL=

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=

# Upstash Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# OpenAI (optional)
OPENAI_API_KEY=

# Resend (email)
RESEND_API_KEY=

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=
```

---

## 14. Additional Documentation

For more detailed information on specific features, please refer to:

- [Qualiphy API Integration](./qualiphy_api.md)
- [Qualiphy Packages](./qualiphy_packages.md)
- [Facebook Pixel Implementation](./pixel.md)
- [Rate Limiting](./rate_limit.md)
- [Marketing Integration](./marketing.md)
- [Security Analysis Guide](./SECURITY_ANALYSIS_GUIDE.md)
- [RLS Policies](./enable_rls_policies.sql)
- [Product Removal Guide](./product_remove.md)
- [Dead Code Cleanup](./dead_code.md)

---

## Summary

This is a **production-grade, enterprise-level telehealth platform** with:

- **Modern Architecture**: Next.js 15, React 19, TypeScript 5
- **Comprehensive Integrations**: 7+ third-party services
- **Robust State Management**: Zustand with persistence & cross-tab sync
- **Advanced Analytics**: Dual-channel Facebook tracking
- **Security-First**: Zod validation, rate limiting, PII protection
- **Scalable Database**: Supabase with RLS
- **Professional Patterns**: Error handling, type safety, optimization
- **Multi-Language Support**: i18n ready
- **CMS Integration**: Sanity for content management

The codebase follows **minimal, enterprise-quality** principles with excellent separation of concerns, comprehensive error handling, and production-ready patterns throughout.

---

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in environment variables
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Build & Deploy

```bash
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

**Last Updated**: 2025-11-04
**Platform Version**: Next.js 15.2.4
**Maintained By**: ForHer Development Team
