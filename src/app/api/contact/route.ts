// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { verifyRecaptcha } from '@/utils/recaptchaUtils';

// Initialize Resend only if API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
  honeypot: z.string().optional(), // For spam protection
  recaptchaToken: z.string().optional(), // reCAPTCHA token
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string): string {
  return `contact_${ip}`;
}

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // 5 requests per 15 minutes

  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, resetTime: existing.resetTime };
  }

  rateLimitStore.set(key, { count: existing.count + 1, resetTime: existing.resetTime });
  return { allowed: true };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || cfConnectingIP || '127.0.0.1';
}

function generateAdminEmailTemplate(data: ContactFormData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a1a !important;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #fc4e87, #f093fb);
          color: white !important;
          padding: 30px 20px;
          text-align: center;
        }
        .content {
          padding: 30px;
          background: white;
        }
        .field {
          margin-bottom: 20px;
        }
        .label {
          font-weight: 600;
          color: #fc4e87 !important;
          margin-bottom: 5px;
          display: block;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .value {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          border-left: 4px solid #fc4e87;
          font-size: 16px;
          color: #1a1a1a !important;
        }
        .message-content {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 4px;
          border-left: 4px solid #fc4e87;
          white-space: pre-wrap;
          font-family: inherit;
          line-height: 1.6;
          color: #1a1a1a !important;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #4a5568 !important;
          border-top: 1px solid #e9ecef;
        }
        .timestamp {
          font-size: 12px;
          color: #718096 !important;
        }
        .reply-button {
          display: inline-block;
          background: #fc4e87;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0 10px 0;
        }
        .email-link {
          color: #fc4e87 !important;
          text-decoration: none;
        }
        .security-badge {
          background: #e8f5e8;
          color: #2d5a2d !important;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-block;
          margin-top: 10px;
        }
        p, div, span {
          color: #1a1a1a !important;
        }
        @media (prefers-color-scheme: dark) {
          body, .content, .container {
            background: white !important;
          }
          .value, .message-content, .footer {
            background: #f8f9fa !important;
          }
          p, div, span, .value, .message-content {
            color: #1a1a1a !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px; color: black !important;">📧 New Contact Form Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; color: black !important;">Lily's Women's Health Website</p>
        </div>
        
        <div class="content">
          <div class="field">
            <span class="label">Customer Name:</span>
            <div class="value">${data.name}</div>
          </div>
          
          <div class="field">
            <span class="label">Email Address:</span>
            <div class="value">
              <a href="mailto:${data.email}" class="email-link">
                ${data.email}
              </a>
            </div>
          </div>
          
          <div class="field">
            <span class="label">Subject:</span>
            <div class="value">${data.subject}</div>
          </div>
          
          <div class="field">
            <span class="label">Message:</span>
            <div class="message-content">${data.message}</div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="reply-button">
              Reply to Customer
            </a>
            ${data.recaptchaToken ? '<div class="security-badge">🛡️ Verified by reCAPTCHA</div>' : ''}
          </div>
        </div>
        
        <div class="footer">
          <p class="timestamp">
            📅 Received: ${new Date().toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </p>
          <p style="margin: 10px 0 0 0; color: #4a5568 !important;">
            💡 <strong>Tip:</strong> Reply directly to this email or click the button above to respond to ${data.name}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY || !resend) {
      return NextResponse.json(
        { success: false, error: 'Email service temporarily unavailable. Please try again later.' },
        { status: 500 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime) : new Date();
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.',
          resetTime: resetTime.toISOString()
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Validate input
    const validationResult = contactFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid form data',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check honeypot (spam protection)
    if (data.honeypot && data.honeypot.trim() !== '') {
      // Silently reject spam but return success to avoid revealing the honeypot
      return NextResponse.json({ 
        success: true, 
        message: 'Thank you for your message! We\'ll get back to you within 24 hours.' 
      });
    }

    // Verify reCAPTCHA if token is provided
    if (data.recaptchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      try {
        const recaptchaResult = await verifyRecaptcha(
          data.recaptchaToken,
          process.env.RECAPTCHA_SECRET_KEY,
          'contact'
        );

        if (!recaptchaResult.success) {
          return NextResponse.json(
            { success: false, error: 'Security verification failed. Please try again.' },
            { status: 400 }
          );
        }

      } catch (recaptchaError) {
        return NextResponse.json(
          { success: false, error: 'Security verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Email configuration - simplified for single email setup
    const toEmail = 'cole@lilyswomenshealth.com'; // Admin email
    const fromEmail = 'onboarding@resend.dev'; // Use Resend's default domain
    
    // Send only admin notification email (no auto-reply to user)
    const adminEmailResult = await resend.emails.send({
      from: `Lily's Contact Form <${fromEmail}>`,
      to: [toEmail],
      replyTo: data.email, // Allow direct reply to customer
      subject: `🔔 Contact Form: ${data.subject}`,
      html: generateAdminEmailTemplate(data),
      text: `New contact form submission from ${data.name} (${data.email})\n\nSubject: ${data.subject}\n\nMessage:\n${data.message}\n\nReceived: ${new Date().toLocaleString()}\n\nReply to: ${data.email}${data.recaptchaToken ? '\n\n🛡️ Verified by reCAPTCHA' : ''}`,
    });

    if (adminEmailResult.error) {
      return NextResponse.json(
        { success: false, error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    // Success response - only admin gets email, user gets this confirmation
    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
      messageId: adminEmailResult.data?.id
    });

  } catch (error) {
    // Generic error response without exposing internal details
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}