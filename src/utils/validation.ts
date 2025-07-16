// src/utils/validation.ts
import { z } from 'zod';

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid UUID format');

// Email validation schema
const emailSchema = z.string().email('Invalid email format').max(255);

// Subscription ID validation (can be UUID or Stripe ID)
const subscriptionIdSchema = z.string()
  .min(1, 'Subscription ID is required')
  .max(255, 'Subscription ID too long')
  .refine(
    (id) => {
      // Check if it's a UUID or Stripe subscription ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const stripeSubRegex = /^sub_[a-zA-Z0-9]{14,}$/;
      return uuidRegex.test(id) || stripeSubRegex.test(id);
    },
    'Invalid subscription ID format'
  );

// Coupon code validation
const couponCodeSchema = z.string()
  .min(1, 'Coupon code is required')
  .max(50, 'Coupon code too long')
  .regex(/^[A-Z0-9_-]+$/i, 'Invalid coupon code format');

// Variant key validation
const variantKeySchema = z.string()
  .min(1, 'Variant key is required')
  .max(100, 'Variant key too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid variant key format');

// Status validation
const statusSchema = z.enum([
  'active',
  'cancelled',
  'pending',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
  'incomplete',
  'expired'
]);

// User data validation schemas
export const userIdSchema = uuidSchema;
export const userEmailSchema = emailSchema;

// Subscription validation schemas
export const subscriptionPurchaseSchema = z.object({
  subscriptionId: subscriptionIdSchema,
  userId: userIdSchema,
  userEmail: userEmailSchema,
  variantKey: variantKeySchema.optional(),
  couponCode: couponCodeSchema.optional(),
});

export const subscriptionCancelSchema = z.object({
  subscriptionId: subscriptionIdSchema,
  immediate: z.boolean().default(true),
});

export const subscriptionStatusUpdateSchema = z.object({
  subscriptionId: subscriptionIdSchema,
  status: statusSchema,
  isActive: z.boolean(),
});

// Sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase();
  const result = emailSchema.safeParse(sanitized);
  
  if (!result.success) {
    throw new Error('Invalid email format');
  }
  
  return result.data;
}

export function sanitizeUserId(userId: string): string {
  const sanitized = sanitizeString(userId);
  const result = userIdSchema.safeParse(sanitized);
  
  if (!result.success) {
    throw new Error('Invalid user ID format');
  }
  
  return result.data;
}

export function sanitizeSubscriptionId(subscriptionId: string): string {
  const sanitized = sanitizeString(subscriptionId);
  const result = subscriptionIdSchema.safeParse(sanitized);
  
  if (!result.success) {
    throw new Error('Invalid subscription ID format');
  }
  
  return result.data;
}

// Validation middleware function
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errorMessage = result.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      return { success: false, error: errorMessage };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Validation failed' 
    };
  }
}

// Error response helper
export function createValidationErrorResponse(error: string) {
  return {
    success: false,
    error: `Validation error: ${error}`,
    code: 'VALIDATION_ERROR'
  };
}

// Safe error message for client (removes sensitive info)
export function createSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove sensitive information from error messages
    const message = error.message
      .replace(/password|token|secret|key/gi, '[REDACTED]')
      .replace(/\b\d{4,}\b/g, '[REDACTED]'); // Remove potential IDs
    
    return message;
  }
  
  return 'An unexpected error occurred';
}