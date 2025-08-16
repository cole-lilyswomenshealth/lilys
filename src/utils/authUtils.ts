// src/utils/authUtils.ts
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

/**
 * Parse a JWT token to get its expiration time
 * @param token The JWT token to parse
 * @returns The expiration time in milliseconds, or null if invalid
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;
  
  try {
    // Get the payload section of the JWT
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    // Decode the base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    // Parse the JSON
    const payload = JSON.parse(jsonPayload);
    
    // Get expiration time
    if (payload.exp) {
      return payload.exp * 1000; // Convert to milliseconds
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is about to expire
 * @param token The token to check
 * @param thresholdMinutes Minutes before expiration to consider it "about to expire"
 * @returns True if the token is about to expire, false otherwise
 */
export function isTokenAboutToExpire(token: string | null, thresholdMinutes: number = 5): boolean {
  if (!token) return true; // No token means it's expired
  
  const expTime = getTokenExpiration(token);
  if (!expTime) return true; // Can't determine expiration time
  
  const now = Date.now();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return expTime - now < thresholdMs;
}

/**
 * Save auth data to sessionStorage
 * @param accessToken The access token
 * @param refreshToken The refresh token
 * @param userId The user ID
 */
export function saveAuthDataToStorage(accessToken: string, refreshToken: string, userId: string): void {
  try {
    sessionStorage.setItem('auth_access_token', accessToken);
    sessionStorage.setItem('auth_refresh_token', refreshToken);
    sessionStorage.setItem('auth_user_id', userId);
    sessionStorage.setItem('auth_last_check', Date.now().toString());
  } catch (error) {
  }
}

/**
 * Clear auth data from sessionStorage
 */
export function clearAuthDataFromStorage(): void {
  try {
    sessionStorage.removeItem('auth_access_token');
    sessionStorage.removeItem('auth_refresh_token');
    sessionStorage.removeItem('auth_user_id');
    sessionStorage.removeItem('auth_last_check');
  } catch (error) {
  }
}

/**
 * Hook to get a function that ensures user is authenticated
 * @returns A function that ensures the user is authenticated
 */
export function useEnsureAuthenticated() {
  const { isAuthenticated, checkSession } = useAuthStore();
  
  return async (): Promise<boolean> => {
    // If already authenticated, return true
    if (isAuthenticated) return true;
    
    // Otherwise, check session with Supabase
    try {
      await checkSession();
      
      // Get updated auth state
      const { isAuthenticated: isNowAuthenticated } = useAuthStore.getState();
      return isNowAuthenticated;
    } catch (error) {
      return false;
    }
  };
}

/**
 * Create csrf token for security
 * @returns A csrf token
 */
export function createCsrfToken(): string {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
  }
  
  return token;
}

/**
 * Verify CSRF token
 * @param token The token to verify
 * @returns True if valid, false otherwise
 */
export function verifyCsrfToken(token: string): boolean {
  try {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token === storedToken;
  } catch (error) {
    return false;
  }
}

/**
 * Handle potential auth redirect and session validation
 * Useful for pages that receive redirects from Stripe
 */
export async function handleAuthRedirect(returnPath: string = '/') {
  // Check for session
  const { data } = await supabase.auth.getSession();
  
  if (!data.session) {
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnPath)}`;
    return false;
  }
  
  // Update auth store if we have a valid session
  if (data.session.user) {
    const { setUser } = useAuthStore.getState();
    setUser(data.session.user);
  }
  
  return true;
}