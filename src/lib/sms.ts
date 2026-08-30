/**
 * SMS Service for SevaSaathi
 * 
 * Uses MSG91 OTP API v5 — we generate OTP, pass it to MSG91 for delivery,
 * and verify against our DB hash. MSG91 is just the delivery channel.
 * Falls back to dev mode when MSG91 is not configured.
 */

import { getMsg91AuthKey, getMsg91TemplateId } from './config';

export interface SmsResult {
  success: boolean;
  actuallyDelivered: boolean;
  messageId?: string;
  error?: string;
}

const ACCOUNT_ERROR_PATTERNS = [
  'dlt', 'template', 'sender', 'account', 'approved',
  'permission', 'blocked', 'suspended', 'inactive',
  'invalid auth', 'unauthorized', 'authentication failed',
];

function isAccountError(errorMsg: string): boolean {
  const lower = errorMsg.toLowerCase();
  return ACCOUNT_ERROR_PATTERNS.some(p => lower.includes(p));
}

function cleanPhone(phone: string): string {
  let p = phone.replace(/[^0-9]/g, '');
  if (p.length === 10) p = '91' + p;
  return p;
}

/**
 * Send OTP via MSG91 Flow API (custom DLT template with var1)
 */
async function sendViaMsg91Flow(phone: string, otp: string, authKey: string, templateId: string): Promise<SmsResult> {
  const mobile = cleanPhone(phone);
  const response = await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: templateId,
      recipients: [{ mobiles: mobile, var1: otp }],
    }),
  });
  const data = await response.json();
  console.log(`📱 MSG91 Flow response for ${mobile}:`, JSON.stringify(data));
  if (data.type === 'success') {
    return { success: true, actuallyDelivered: true, messageId: data.message_id?.toString() };
  }
  const errorMsg = data.message || 'MSG91 error';
  if (isAccountError(errorMsg)) return { success: false, actuallyDelivered: false, error: errorMsg };
  throw new Error(errorMsg);
}

/**
 * Send OTP via MSG91 OTP API — we pass our own OTP so MSG91 just delivers it.
 * This avoids MSG91 generating a different OTP than what we store in DB.
 */
async function sendViaMsg91Otp(phone: string, otp: string, authKey: string): Promise<SmsResult> {
  const mobile = cleanPhone(phone);
  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile,
      otp,                // Pass our OTP — MSG91 delivers it, doesn't generate its own
      otp_length: otp.length,
    }),
  });
  const data = await response.json();
  console.log(`📱 MSG91 OTP response for ${mobile}:`, JSON.stringify(data));
  if (data.type === 'success') {
    return { success: true, actuallyDelivered: true, messageId: data.request_id?.toString() };
  }
  const errorMsg = data.message || 'MSG91 error';
  if (isAccountError(errorMsg)) return { success: false, actuallyDelivered: false, error: errorMsg };
  throw new Error(errorMsg);
}

/**
 * Send phone OTP.
 * - If authKey + template_id → Flow API (custom DLT template)
 * - If only authKey → OTP API (pass our OTP for delivery)
 * - If nothing → dev mode (OTP shown in UI)
 * 
 * Always returns the same OTP that was passed in (for dev mode UI display).
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();

  if (authKey) {
    try {
      if (templateId) {
        return await sendViaMsg91Flow(phone, otp, authKey, templateId);
      }
      // OTP API: pass our own OTP for delivery
      return await sendViaMsg91Otp(phone, otp, authKey);
    } catch (err: any) {
      throw err;
    }
  }

  // No credentials → dev mode
  console.log(`\n📱 DEV MODE — PHONE: ${phone}, OTP: ${otp}`);
  return { success: true, actuallyDelivered: false };
}

/**
 * Always verify via DB hash now.
 * We always generate & store our own OTP.
 */
export function getVerificationMode(): 'db' | 'dev' {
  // Both MSG91 modes now store hash in DB, so always 'db'
  return 'db';
}

export async function isSmsConfigured(): Promise<boolean> {
  return !!(await getMsg91AuthKey());
}
