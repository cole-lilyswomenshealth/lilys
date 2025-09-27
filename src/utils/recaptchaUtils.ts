// src/utils/recaptchaUtils.ts

/**
 * Verify reCAPTCHA token on the server
 * @param token - The reCAPTCHA token from the client
 * @param secretKey - The reCAPTCHA secret key
 * @param action - The action that was performed
 * @returns Promise with verification result
 */
export async function verifyRecaptcha(
    token: string,
    secretKey: string,
    action: string
  ): Promise<{ success: boolean; score?: number; error?: string }> {
    // Skip reCAPTCHA verification in development mode
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        score: 0.9
      };
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      });
  
      const data = await response.json();
  
      if (!data.success) {
        return {
          success: false,
          error: 'reCAPTCHA verification failed'
        };
      }
  
      // Check if action matches and score is acceptable (>= 0.5)
      if (data.action !== action) {
        return {
          success: false,
          error: 'Action mismatch'
        };
      }
  
      if (data.score < 0.5) {
        return {
          success: false,
          error: 'Low reCAPTCHA score'
        };
      }
  
      return {
        success: true,
        score: data.score
      };
    } catch (error) {
      return {
        success: false,
        error: 'reCAPTCHA verification error'
      };
    }
  }