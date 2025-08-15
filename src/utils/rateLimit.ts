// src/utils/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';

// Types
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
}

// Redis client setup (conditional)
let redisClient: any = null;

async function initRedis() {
  if (redisClient) return redisClient;
  
  try {
    // Check if Redis environment variables are available
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN;
    
    if (!redisUrl) {
      console.warn('Redis URL not configured, using in-memory fallback');
      return null;
    }
    
    // Dynamic import to avoid bundle issues if Redis is not available
    try {
      const { Redis } = await import('@upstash/redis');
      
      redisClient = new Redis({
        url: redisUrl,
        token: redisToken,
      });
      
      // Test connection
      await redisClient.ping();
      console.log('✅ Redis connected successfully');
      return redisClient;
    } catch (importError) {
      console.warn('❌ Redis package not installed, using in-memory fallback');
      return null;
    }
  } catch (error) {
    console.warn('❌ Redis connection failed, using fallback:', error);
    return null;
  }
}

// In-memory fallback for rate limiting
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Redis-based rate limiting with in-memory fallback
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = await initRedis();
  const now = Date.now();
  const resetTime = now + config.windowMs;
  
  if (redis) {
    try {
      // Redis implementation
      const pipe = redis.pipeline();
      const redisKey = `rate_limit:${key}`;
      
      // Increment counter
      pipe.incr(redisKey);
      // Set expiration
      pipe.expire(redisKey, Math.ceil(config.windowMs / 1000));
      // Get TTL
      pipe.ttl(redisKey);
      
      const results = await pipe.exec();
      const count = results[0] as number;
      const ttl = results[2] as number;
      
      const actualResetTime = ttl > 0 ? now + (ttl * 1000) : resetTime;
      
      return {
        success: count <= config.maxRequests,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count),
        resetTime: actualResetTime,
      };
    } catch (error) {
      console.warn('Redis rate limit check failed, using fallback:', error);
      // Fall through to memory store
    }
  }
  
  // In-memory fallback
  const existing = memoryStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // First request or expired window
    memoryStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }
  
  // Increment counter
  existing.count++;
  memoryStore.set(key, existing);
  
  return {
    success: existing.count <= config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetTime: existing.resetTime,
  };
}

/**
 * Default key generator - uses IP address and user agent
 */
function defaultKeyGenerator(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || 
    req.headers.get('x-real-ip') || 
    req.headers.get('cf-connecting-ip') || 
    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent.slice(0, 50)}`;
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }
): Promise<RateLimitResult> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(req);
  
  return await checkRateLimit(key, config);
}

/**
 * Subscription-specific rate limiting
 */
export async function subscriptionRateLimit(
  req: NextRequest,
  userId?: string
): Promise<RateLimitResult> {
  const baseKey = userId ? `user:${userId}` : defaultKeyGenerator(req);
  
  return await checkRateLimit(`subscription:${baseKey}`, {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 subscription operations per 5 minutes
  });
}

/**
 * Purchase-specific rate limiting (more restrictive)
 */
export async function purchaseRateLimit(
  req: NextRequest,
  userId?: string
): Promise<RateLimitResult> {
  const baseKey = userId ? `user:${userId}` : defaultKeyGenerator(req);
  
  return await checkRateLimit(`purchase:${baseKey}`, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 purchase attempts per hour
  });
}

/**
 * Admin operation rate limiting
 */
export async function adminRateLimit(
  req: NextRequest,
  adminEmail: string
): Promise<RateLimitResult> {
  return await checkRateLimit(`admin:${adminEmail}`, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 admin operations per minute
  });
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  });
  
  return NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    { status: 429, headers }
  );
}