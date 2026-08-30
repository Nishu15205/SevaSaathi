/**
 * SMS Service for SevaSaathi
 * 
 * Uses MSG91 OTP API v5 — let MSG91 generate & send OTP,
 * and verify through MSG91's verify endpoint.
 * Falls back to server-side DB hash when MSG91 is not configured.
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
 * Send OTP via MSG91 Flow API (custom template with var1)
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
 * Send OTP via MSG91 OTP API — MSG91 generates & sends its own OTP.
 * No template needed. Verification happens via MSG91's verify endpoint.
 */
async function sendViaMsg91Otp(phone: string, authKey: string): Promise<SmsResult> {
  const mobile = cleanPhone(phone);
  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile,
      otp_length: 4,
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
 * Verify OTP via MSG91's verify endpoint.
 */
export async function verifyViaMsg91Otp(phone: string, otp: string, authKey: string): Promise<boolean> {
  const mobile = cleanPhone(phone);
  const response = await fetch('https://api.msg91.com/api/v5/otp/verify', {
    method: 'POST',
    headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, otp }),
  });
  const data = await response.json();
  console.log(`📱 MSG91 Verify response for ${mobile}:`, JSON.stringify(data));
  return data.type === 'success';
}

/**
 * Send phone OTP.
 * - If template_id configured → Flow API (custom message)
 * - If only authKey → OTP API (MSG91 generates OTP)
 * - If nothing → dev mode (OTP shown in UI)
 * 
 * Returns the OTP in dev mode or when using Flow API (since we generate it).
 * When using OTP API, MSG91 generates it so we return empty string.
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();

  if (authKey) {
    try {
      if (templateId) {
        // Flow API: we generate OTP, MSG91 just delivers it
        return await sendViaMsg91Flow(phone, otp, authKey, templateId);
      }
      // OTP API: MSG91 generates and sends its own OTP
      return await sendViaMsg91Otp(phone, authKey);
    } catch (err: any) {
      throw err;
    }
  }

  // No credentials → dev mode
  console.log(`\n📱 PHONE OTP for ${phone}: ${otp}`);
  console.log(`   ⚠️ Add MSG91_AUTH_KEY to .env or Admin > Credentials for real SMS delivery\n`);
  return { success: true, actuallyDelivered: false };
}

/**
 * Check if MSG91 is configured with Flow API (template).
 * If yes, caller should verify via DB hash.
 * If only authKey (no template), caller should verify via MSG91.
 */
export async function getVerificationMode(): Promise<'msg91' | 'db' | 'dev'> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();
  if (!authKey) return 'dev';
  if (templateId) return 'db'; // We generated OTP, verify from DB hash
  return 'msg91'; // MSG91 generated OTP, verify via MSG91
}

export async function isSmsConfigured(): Promise<boolean> {
  return !!(await getMsg91AuthKey());
}
