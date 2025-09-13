# Rate Limiting Implementation Guide

## Overview

This document provides detailed specifications for implementing proper rate limiting in the ForHer telehealth platform. The current generic rate limiting approach has been identified as flawed and needs to be replaced with a business-logic-aware system.

## Current Issues Analysis

### Problems with Current Implementation

1. **Ghost Request Accumulation**: Rate limit counters persist across sessions without visibility
2. **Inappropriate IP-based Fallback**: Purchase endpoints shouldn't fall back to IP-based limiting
3. **No Request Classification**: All HTTP requests count equally (auth failures, validation errors, successful operations)
4. **Generic Design**: Treats critical purchase flows like generic API endpoints
5. **No Admin Visibility**: Cannot inspect or reset rate limit states for debugging
6. **Development Friction**: Testing/debugging increments production-like counters

### Specific ForHer Context

- **Purchase endpoints require authentication**: Users must be logged in
- **Critical business flow**: Failed purchases = lost revenue
- **Testing requirements**: Developers need to test without hitting limits
- **User experience**: Legitimate users should never be blocked
- **Fraud prevention**: Need to prevent actual abuse without false positives

## Proposed Rate Limiting Strategy

### 1. Business-Logic-Aware Rate Limiting

Instead of counting HTTP requests, count **business actions**:

```typescript
// Only increment after successful business validations
enum RateLimitAction {
  STRIPE_CHECKOUT_CREATED = 'stripe_checkout_created',
  SUBSCRIPTION_MODIFIED = 'subscription_modified',
  APPOINTMENT_BOOKED = 'appointment_booked',
  PASSWORD_RESET_SENT = 'password_reset_sent'
}
```

### 2. User-Centric Approach

**Remove IP-based fallbacks** for authenticated endpoints:

```typescript
// ❌ Current (problematic)
const baseKey = userId ? `user:${userId}` : defaultKeyGenerator(req);

// ✅ Proposed
export async function purchaseRateLimit(userId: string): Promise<RateLimitResult> {
  // Requires userId - no fallback
  return await checkRateLimit(`purchase:user:${userId}`, config);
}
```

### 3. Tiered Rate Limiting

Different limits based on endpoint criticality:

```typescript
interface RateLimitTier {
  windowMs: number;
  maxRequests: number;
  action: RateLimitAction;
  description: string;
}

const RATE_LIMIT_TIERS = {
  // Critical business operations - very permissive
  PURCHASE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 purchase attempts per hour
    action: RateLimitAction.STRIPE_CHECKOUT_CREATED,
    description: 'Stripe checkout session creation'
  },
  
  // Subscription changes - moderate
  SUBSCRIPTION: {
    windowMs: 30 * 60 * 1000, // 30 minutes  
    maxRequests: 15,
    action: RateLimitAction.SUBSCRIPTION_MODIFIED,
    description: 'Subscription modifications'
  },
  
  // Authentication - restrictive
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    action: RateLimitAction.PASSWORD_RESET_SENT,
    description: 'Password reset attempts'
  }
};
```

### 4. Rate Limit Placement Strategy

**Move rate limiting to the right place** in the request lifecycle:

```typescript
// ❌ Current: Rate limit at request start
export async function POST(req: NextRequest) {
  const rateLimitResult = await purchaseRateLimit(req, userId); // TOO EARLY
  
  // ... validation, auth, business logic
}

// ✅ Proposed: Rate limit after validations
export async function POST(req: NextRequest) {
  // 1. Validate request data
  const validation = validateRequest(schema, data);
  if (!validation.success) return 400;
  
  // 2. Check authentication  
  const user = await getAuthenticatedUser();
  if (!user) return 401;
  
  // 3. Validate business logic
  const subscription = await getSubscription(data.subscriptionId);
  if (!subscription) return 404;
  
  // 4. NOW check rate limit (only for legitimate requests)
  const rateLimitResult = await purchaseRateLimit(user.id);
  if (!rateLimitResult.success) return 429;
  
  // 5. Perform business action
  const stripeSession = await stripe.checkout.sessions.create(...);
  
  // 6. Increment rate limit AFTER successful action
  await incrementRateLimit(user.id, RateLimitAction.STRIPE_CHECKOUT_CREATED);
}
```

## Implementation Specifications

### 1. Enhanced Rate Limit Interface

```typescript
interface EnhancedRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  action: RateLimitAction;
  userId: string;
  metadata: {
    firstRequestTime: number;
    lastRequestTime: number;
    requestHistory: Array<{
      timestamp: number;
      action: RateLimitAction;
      success: boolean;
    }>;
  };
}

interface RateLimitStorage {
  // Core data
  count: number;
  resetTime: number;
  
  // Enhanced tracking
  userId: string;
  action: RateLimitAction;
  firstRequestTime: number;
  lastRequestTime: number;
  
  // Request history (last 10 attempts)
  history: Array<{
    timestamp: number;
    success: boolean;
    ip?: string;
    userAgent?: string;
  }>;
}
```

### 2. Environment-Aware Rate Limiting

```typescript
// Different limits for different environments
const getRateLimitConfig = (action: RateLimitAction) => {
  const baseConfig = RATE_LIMIT_TIERS[action];
  
  // Development environment - very permissive
  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseConfig,
      maxRequests: baseConfig.maxRequests * 10, // 10x higher limits
      windowMs: baseConfig.windowMs / 2 // Shorter windows
    };
  }
  
  // Staging environment - moderate
  if (process.env.VERCEL_ENV === 'preview') {
    return {
      ...baseConfig,
      maxRequests: baseConfig.maxRequests * 3
    };
  }
  
  // Production - strict limits
  return baseConfig;
};
```

### 3. Admin/Debug Interface

```typescript
// Admin endpoints for rate limit management
export async function GET(req: NextRequest) {
  // GET /api/admin/rate-limits?userId=123
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (userId) {
    return NextResponse.json({
      purchase: await getRateLimitStatus(userId, RateLimitAction.STRIPE_CHECKOUT_CREATED),
      subscription: await getRateLimitStatus(userId, RateLimitAction.SUBSCRIPTION_MODIFIED),
      auth: await getRateLimitStatus(userId, RateLimitAction.PASSWORD_RESET_SENT)
    });
  }
  
  // Return system-wide rate limit stats
  return NextResponse.json({
    totalUsers: await getTotalRateLimitedUsers(),
    activeWindows: await getActiveRateLimitWindows(),
    recentBlocks: await getRecentRateLimitBlocks()
  });
}

export async function DELETE(req: NextRequest) {
  // DELETE /api/admin/rate-limits?userId=123&action=purchase
  // Clear specific user's rate limit for action
  const userId = req.nextUrl.searchParams.get('userId');
  const action = req.nextUrl.searchParams.get('action');
  
  if (userId && action) {
    await clearRateLimit(userId, action as RateLimitAction);
    return NextResponse.json({ success: true });
  }
}
```

### 4. Redis Implementation with Fallback

```typescript
export async function checkBusinessRateLimit(
  userId: string,
  action: RateLimitAction
): Promise<EnhancedRateLimitResult> {
  const config = getRateLimitConfig(action);
  const key = `rate_limit:${action}:user:${userId}`;
  const now = Date.now();
  
  // Try Redis first
  const redis = await initRedis();
  if (redis) {
    try {
      const data = await redis.get(key);
      const current = data ? JSON.parse(data) : null;
      
      // Check if window expired
      if (!current || now > current.resetTime) {
        // Create new window
        const newWindow: RateLimitStorage = {
          count: 1,
          resetTime: now + config.windowMs,
          userId,
          action,
          firstRequestTime: now,
          lastRequestTime: now,
          history: [{
            timestamp: now,
            success: true
          }]
        };
        
        await redis.setex(key, Math.ceil(config.windowMs / 1000), JSON.stringify(newWindow));
        
        return {
          success: true,
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          resetTime: newWindow.resetTime,
          action,
          userId,
          metadata: {
            firstRequestTime: now,
            lastRequestTime: now,
            requestHistory: newWindow.history
          }
        };
      }
      
      // Increment existing window
      current.count++;
      current.lastRequestTime = now;
      current.history.push({
        timestamp: now,
        success: current.count <= config.maxRequests
      });
      
      // Keep only last 10 history entries
      if (current.history.length > 10) {
        current.history = current.history.slice(-10);
      }
      
      const ttl = Math.ceil((current.resetTime - now) / 1000);
      await redis.setex(key, ttl, JSON.stringify(current));
      
      return {
        success: current.count <= config.maxRequests,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - current.count),
        resetTime: current.resetTime,
        action,
        userId,
        metadata: {
          firstRequestTime: current.firstRequestTime,
          lastRequestTime: current.lastRequestTime,
          requestHistory: current.history
        }
      };
      
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fall through to memory store
    }
  }
  
  // Memory store fallback (similar implementation)
  return memoryStoreRateLimit(userId, action, config);
}
```

### 5. Specific ForHer Endpoints

#### Purchase Flow (`/api/stripe/subscriptions`)

```typescript
export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request
    const data = await req.json();
    const validation = validateRequest(subscriptionPurchaseSchema, data);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }
    
    // 2. Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    // 3. Validate subscription exists
    const subscription = await getSubscription(data.subscriptionId);
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }
    
    // 4. Check business rate limit
    const rateLimitResult = await checkBusinessRateLimit(user.id, RateLimitAction.STRIPE_CHECKOUT_CREATED);
    if (!rateLimitResult.success) {
      const resetMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
      return NextResponse.json({
        success: false,
        error: `Too many purchase attempts. Please try again in ${resetMinutes} minutes.`,
        rateLimitInfo: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          action: rateLimitResult.action
        }
      }, { status: 429 });
    }
    
    // 5. Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      // ... stripe configuration
    });
    
    // 6. Success - return checkout URL
    return NextResponse.json({
      success: true,
      sessionId: stripeSession.id,
      url: stripeSession.url
    });
    
  } catch (error) {
    // Error handling
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Appointment Booking (`/api/appointment-access`)

```typescript
export async function POST(req: NextRequest) {
  // Similar structure but with RateLimitAction.APPOINTMENT_BOOKED
  const rateLimitResult = await checkBusinessRateLimit(user.id, RateLimitAction.APPOINTMENT_BOOKED);
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
describe('Business Rate Limiting', () => {
  test('should allow legitimate purchase attempts', async () => {
    const userId = 'test-user-123';
    
    // First request should succeed
    const result1 = await checkBusinessRateLimit(userId, RateLimitAction.STRIPE_CHECKOUT_CREATED);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(9); // 10 - 1
    
    // 10th request should succeed
    for (let i = 0; i < 9; i++) {
      await checkBusinessRateLimit(userId, RateLimitAction.STRIPE_CHECKOUT_CREATED);
    }
    
    const result10 = await checkBusinessRateLimit(userId, RateLimitAction.STRIPE_CHECKOUT_CREATED);
    expect(result10.success).toBe(true);
    expect(result10.remaining).toBe(0);
    
    // 11th request should be blocked
    const result11 = await checkBusinessRateLimit(userId, RateLimitAction.STRIPE_CHECKOUT_CREATED);
    expect(result11.success).toBe(false);
    expect(result11.remaining).toBe(0);
  });
  
  test('should reset after window expires', async () => {
    // Mock time to test window expiration
  });
  
  test('should handle Redis failures gracefully', async () => {
    // Mock Redis failure and test memory fallback
  });
});
```

### 2. Integration Tests

```typescript
describe('Purchase Flow with Rate Limiting', () => {
  test('should complete purchase within rate limits', async () => {
    const user = await createTestUser();
    const subscription = await createTestSubscription();
    
    // Should succeed
    const response = await fetch('/api/stripe/subscriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify({
        subscriptionId: subscription.id,
        userId: user.id,
        userEmail: user.email
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.url).toContain('stripe.com');
  });
  
  test('should block after exceeding rate limit', async () => {
    // Test rate limit blocking behavior
  });
});
```

## Migration Plan

### Phase 1: Assessment
1. **Audit current rate limit usage** across all endpoints
2. **Identify ghost counters** in production memory/Redis
3. **Document current limits** and their business impact

### Phase 2: Implementation
1. **Create new rate limiting utilities** with business logic awareness
2. **Update critical endpoints** (purchase, subscription management)
3. **Add admin interface** for monitoring and debugging

### Phase 3: Rollout
1. **Deploy with feature flag** (old system as fallback)
2. **Monitor business metrics** (conversion rates, user complaints)
3. **Gradually migrate** all endpoints to new system

### Phase 4: Cleanup
1. **Remove old rate limiting code**
2. **Clear legacy rate limit data**
3. **Update documentation** and monitoring

## Monitoring and Alerting

### Key Metrics to Track
- **Purchase conversion rate** (before/after rate limiting changes)
- **Rate limit hit frequency** per endpoint
- **False positive blocks** (legitimate users blocked)
- **Actual abuse prevented** (malicious traffic blocked)

### Alert Conditions
- **Spike in rate limit blocks** (potential system issue)
- **Drop in conversion rate** (too restrictive limits)
- **High error rates** on purchase endpoints
- **Redis/storage failures** affecting rate limiting

## Configuration Management

### Environment Variables
```bash
# Rate limiting storage
RATE_LIMIT_REDIS_URL=redis://...
RATE_LIMIT_FALLBACK_MEMORY=true

# Rate limiting multipliers by environment
RATE_LIMIT_DEV_MULTIPLIER=10    # 10x higher limits in development
RATE_LIMIT_STAGING_MULTIPLIER=3 # 3x higher limits in staging
RATE_LIMIT_PROD_MULTIPLIER=1    # Standard limits in production

# Admin access
RATE_LIMIT_ADMIN_ENABLED=true
RATE_LIMIT_ADMIN_SECRET=admin_secret_key
```

### Feature Flags
```typescript
const RATE_LIMIT_CONFIG = {
  // Feature toggles
  enableBusinessLogicRateLimit: process.env.ENABLE_BUSINESS_RATE_LIMIT === 'true',
  enableAdminInterface: process.env.RATE_LIMIT_ADMIN_ENABLED === 'true',
  enableRequestHistory: process.env.RATE_LIMIT_HISTORY_ENABLED === 'true',
  
  // Per-endpoint toggles
  enablePurchaseRateLimit: true,
  enableSubscriptionRateLimit: true,
  enableAuthRateLimit: true,
};
```

This implementation provides a robust, business-aware rate limiting system specifically designed for the ForHer platform's needs while maintaining flexibility for future requirements.