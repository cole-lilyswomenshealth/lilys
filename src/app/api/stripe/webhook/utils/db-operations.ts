// src/app/api/stripe/webhook/utils/db-operations.ts
import { supabase, sanityClient } from './db-clients';
import { 
  SubscriptionUpdateData, 
  SanitySubscriptionUpdateData,
  OrderUpdateData,
  SanityOrderUpdateData
} from './types';

/**
 * Update a user subscription in Supabase
 */
export async function updateSupabaseSubscription(
  id: string,
  data: Partial<SubscriptionUpdateData>,
  matchField: 'id' | 'stripe_subscription_id' | 'stripe_session_id' = 'id'
): Promise<void> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update(data)
    .eq(matchField, id);

  if (error) {
    throw new Error(`Failed to update subscription in Supabase: ${error.message}`);
  }
  
}

/**
 * Update a user subscription in Sanity
 */
export async function updateSanitySubscription(
  id: string,
  data: Partial<SanitySubscriptionUpdateData>
): Promise<void> {
  try {
    await sanityClient
      .patch(id)
      .set(data)
      .commit();
      
  } catch (error) {
    throw new Error(`Failed to update subscription in Sanity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an order in Supabase
 */
export async function updateSupabaseOrder(
  id: string,
  data: Partial<OrderUpdateData>,
  matchField: 'id' | 'stripe_session_id' = 'id'
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update(data)
    .eq(matchField, id);

  if (error) {
    throw new Error(`Failed to update order in Supabase: ${error.message}`);
  }
  
}

/**
 * Update an order in Sanity
 */
export async function updateSanityOrder(
  id: string,
  data: Partial<SanityOrderUpdateData>
): Promise<void> {
  try {
    await sanityClient
      .patch(id)
      .set(data)
      .commit({visibility: 'sync'});
      
  } catch (error) {
    throw new Error(`Failed to update order in Sanity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a user subscription from Supabase by various fields
 */
export async function getSupabaseSubscription(
  value: string,
  field: 'id' | 'stripe_subscription_id' | 'stripe_session_id' = 'id'
) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('id, sanity_id')
    .eq(field, value)
    .single();
  
  if (error) {
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }
  
  return data;
}