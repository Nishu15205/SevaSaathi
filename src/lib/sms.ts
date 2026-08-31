/**
 * SMS Service for SevaSaathi — Real OTP Delivery via Fast2SMS
 *
 * Strategy:
 * 1. We generate a 6-digit OTP
 * 2. We store its salted hash in DB
 * 3. Try route="otp" first (Fast2SMS pre-approved template)
 * 4. If that fails, fall back to route="dlt" with our registered template
 * 5. Verification always happens against the DB hash
 */

import { getFast2SmsApiKey, getConfig } from './config';

export interface SmsResult {
  success: boolean;
  delivered: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Extract 10-digit Indian number from any format.
 */
function to10Digit(phone: string): string {
  let p = phone.replace(/[^0-9]/g, '');
  if (p.length === 12 && p.startsWith('91')) p = p.slice(2);
  if (p.length > 10) p = p.slice(p.length - 10);
  return p;
}

/**
 * Send via Fast2SMS route="otp"
 * Uses their pre-approved DLT OTP template.
 * Requires: website verification completed on Fast2SMS dashboard.
 */
async function sendViaOtpRoute(phone: string, otp: string, apiKey: string): Promise<SmsResult> {
  const numbers = to10Digit(phone);
  console.log(`\n📱 Fast2SMS OTP route → phone: ${numbers}, otp: ${otp}`);

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { 'authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ route: 'otp', variables_values: otp, numbers, flash: 0 }),
  });

  const data = await response.json();
  console.log(`📱 Fast2SMS OTP route response:`, JSON.stringify(data));

  if (data.return === true) {
    console.log(`✅ OTP ${otp} sent via OTP route to ${numbers}`);
    return { success: true, delivered: true, messageId: Array.isArray(data.sms_id) ? data.sms_id[0] : undefined };
  }
  return { success: false, delivered: false, error: data.message || 'OTP route failed' };
}

/**
 * Send via Fast2SMS route="dlt"
 * Uses your own DLT-approved template.
 * Template must have {{OTP}} or {#var#} placeholder.
 */
async function sendViaDltRoute(phone: string, otp: string, apiKey: string, templateId: string): Promise<SmsResult> {
  const numbers = to10Digit(phone);
  console.log(`\n📱 Fast2SMS DLT route → phone: ${numbers}, otp: ${otp}, template: ${templateId}`);

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { 'authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: 'dlt',
      template_id: templateId,
      numbers,
      flash: 0,
    }),
  });

  const data = await response.json();
  console.log(`📱 Fast2SMS DLT route response:`, JSON.stringify(data));

  if (data.return === true) {
    console.log(`✅ OTP ${otp} sent via DLT route to ${numbers}`);
    return { success: true, delivered: true, messageId: Array.isArray(data.sms_id) ? data.sms_id[0] : undefined };
  }
  return { success: false, delivered: false, error: data.message || 'DLT route failed' };
}

/**
 * Send phone OTP — main entry point.
 *
 * Tries in order:
 * 1. route="otp" (Fast2SMS pre-approved template — needs website verification)
 * 2. route="dlt" (your DLT template — needs template_id configured)
 * 3. dev mode (no SMS)
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = await getFast2SmsApiKey();

  if (!apiKey) {
    console.log(`\n📱 DEV MODE — PHONE: ${phone}, OTP: ${otp}`);
    console.log(`⚠️  Fast2SMS API key not configured.`);
    return { success: true, delivered: false };
  }

  // Try 1: OTP route (pre-approved template)
  const otpResult = await sendViaOtpRoute(phone, otp, apiKey);
  if (otpResult.delivered) return otpResult;

  // Try 2: DLT route (custom template)
  const templateId = await getConfig('SMS', 'FAST2SMS_DLT_TEMPLATE_ID');
  if (templateId) {
    const dltResult = await sendViaDltRoute(phone, otp, apiKey, templateId);
    if (dltResult.delivered) return dltResult;
  }

  // Both failed
  console.error(`❌ Fast2SMS failed. OTP route: ${otpResult.error}`, templateId ? `DLT route failed too` : '(no DLT template configured)');
  return { success: false, delivered: false, error: otpResult.error };
}

export async function isSmsConfigured(): Promise<boolean> {
  return !!(await getFast2SmsApiKey());
}
