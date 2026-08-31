/**
 * SMS Service for SevaSaathi — Real OTP Delivery via Fast2SMS
 *
 * Single clean path:
 * 1. We generate a 6-digit OTP
 * 2. We store its salted hash in DB
 * 3. We send OTP via Fast2SMS (route: "otp") — they use their pre-approved DLT template
 * 4. Verification always happens against the DB hash
 *
 * If Fast2SMS API key is not configured → dev mode (OTP logged to console & shown in UI)
 */

import { getFast2SmsApiKey } from './config';

export interface SmsResult {
  success: boolean;
  /** True if SMS was actually sent via Fast2SMS. False = dev mode. */
  delivered: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Extract 10-digit Indian number from any format.
 * Handles: +918076998046, 918076998046, 8076998046
 */
function to10Digit(phone: string): string {
  let p = phone.replace(/[^0-9]/g, '');
  // Strip leading 91 if 12 digits
  if (p.length === 12 && p.startsWith('91')) {
    p = p.slice(2);
  }
  // Strip leading +91 already stripped, handle any remaining
  if (p.length > 10) {
    p = p.slice(p.length - 10);
  }
  return p;
}

/**
 * Send OTP via Fast2SMS
 * Uses route="otp" which uses Fast2SMS's pre-approved DLT template.
 * No custom template needed — Fast2SMS handles DLT compliance.
 *
 * API: POST https://www.fast2sms.com/dev/bulkV2
 */
async function sendViaFast2Sms(phone: string, otp: string, apiKey: string): Promise<SmsResult> {
  const numbers = to10Digit(phone);

  console.log(`\n📱 Fast2SMS → phone: ${numbers}, otp: ${otp}`);

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: otp,
      numbers,
      flash: 0,
    }),
  });

  const data = await response.json();
  console.log(`📱 Fast2SMS response:`, JSON.stringify(data));

  if (data.return === true && data.status_code === 200) {
    const smsId = Array.isArray(data.sms_id) ? data.sms_id[0] : undefined;
    console.log(`✅ OTP ${otp} sent successfully to ${numbers} via Fast2SMS`);
    return { success: true, delivered: true, messageId: smsId };
  }

  const errorMsg = data.message || 'Fast2SMS API error';
  console.error(`❌ Fast2SMS failed for ${numbers}: ${errorMsg}`);
  return { success: false, delivered: false, error: errorMsg };
}

/**
 * Send phone OTP — the main entry point.
 *
 * - If Fast2SMS API key → send via Fast2SMS OTP route
 * - If nothing → dev mode (console log + UI fallback)
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = await getFast2SmsApiKey();

  // No credentials → dev mode
  if (!apiKey) {
    console.log(`\n📱 DEV MODE — PHONE: ${phone}, OTP: ${otp}`);
    console.log(`⚠️  Fast2SMS API key not configured. Add it in Admin Settings or .env (FAST2SMS_API_KEY)`);
    return { success: true, delivered: false };
  }

  return await sendViaFast2Sms(phone, otp, apiKey);
}

/**
 * Check if SMS (Fast2SMS) is configured.
 */
export async function isSmsConfigured(): Promise<boolean> {
  return !!(await getFast2SmsApiKey());
}
