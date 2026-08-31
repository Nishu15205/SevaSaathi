/**
 * SMS Service for SevaSaathi
 * 
 * MSG91 OTP API v5 — let MSG91 generate & send OTP using their pre-approved
 * DLT template (best delivery rate). Verification happens via MSG91's endpoint.
 * 
 * If template_id is configured → Flow API (our custom template with var1)
 * If only authKey → OTP API (MSG91 generates & sends its own OTP)
 * If nothing → dev mode (OTP shown in UI)
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
 * We generate OTP, MSG91 delivers it via our approved template.
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
 * Send OTP via MSG91 OTP API — MSG91 generates its own OTP using their
 * pre-approved DLT template. This has the highest delivery success rate.
 * Verification must happen via MSG91's verify endpoint.
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
 * Used when MSG91 generated the OTP (OTP API mode without template).
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
 * - If authKey + template_id → Flow API (we generate OTP, verify via DB)
 * - If only authKey → OTP API (MSG91 generates OTP, verify via MSG91)
 * - If nothing → dev mode (OTP shown in UI)
 */
export async function sendPhoneOtp(phone: string, ourOtp: string): Promise<SmsResult> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();

  if (authKey) {
    try {
      if (templateId) {
        // Flow API: we generate OTP, MSG91 just delivers it
        return await sendViaMsg91Flow(phone, ourOtp, authKey, templateId);
      }
      // OTP API: MSG91 generates & sends its own 4-digit OTP
      return await sendViaMsg91Otp(phone, authKey);
    } catch (err: any) {
      throw err;
    }
  }

  // No credentials → dev mode
  console.log(`\n📱 DEV MODE — PHONE: ${phone}, OTP: ${ourOtp}`);
  return { success: true, actuallyDelivered: false };
}

/**
 * Get the verification mode based on config.
 * - 'msg91': MSG91 generated OTP, verify via MSG91's endpoint
 * - 'db': We generated OTP (Flow API), verify against DB hash
 * - 'dev': No SMS configured, verify against DB hash
 */
export async function getVerificationMode(): Promise<'msg91' | 'db' | 'dev'> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();
  if (!authKey) return 'dev';
  if (templateId) return 'db';
  return 'msg91';
}

export async function isSmsConfigured(): Promise<boolean> {
  return !!(await getMsg91AuthKey());
}
