/**
 * Phone Formatter - E.164 Standard for GHL API
 * Converts any US phone format to +1XXXXXXXXXX
 */

export function formatPhoneToE164(phone: string): string {
  if (!phone) throw new Error('Phone number required');

  // Extract digits only
  const digits = phone.replace(/\D/g, '');

  // Handle 10 or 11 digit numbers
  const cleaned = digits.length === 10 ? `1${digits}` : digits;

  // Validate and return
  if (!/^1\d{10}$/.test(cleaned)) {
    throw new Error(`Invalid phone: ${phone}`);
  }

  return `+${cleaned}`;
}
