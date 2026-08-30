/**
 * SMS Service for SevaSaathi
 * 
 * Uses MSG91 OTP API to send OTP via SMS.
 * Reads auth key from backend config (DB) first, falls back to env.
 * Template ID is optional — if not set, uses MSG91's built-in OTP feature.
 */

import { getMsg91AuthKey, getMsg91TemplateId } from './config';

export interface SmsResult {
  success: boolean;
  actuallyDelivered: boolean;
  messageId?: string;
  error?: string;
}

// Error messages that indicate account/compliance issues (not transient)
const ACCOUNT_ERROR_PATTERNS = [
  'dlt',
  'template',
  'sender',
  'account',
  'approved',
  'permission',
  'blocked',
  'suspended',
  'inactive',
  'invalid auth',
  'unauthorized',
  'authentication failed',
];

function isAccountError(errorMsg: string): boolean {
  const lower = errorMsg.toLowerCase();
  return ACCOUNT_ERROR_PATTERNS.some(p => lower.includes(p));
}

/**
 * Send OTP via MSG91 Flow API (requires template_id)
 */
async function sendViaMsg91Flow(phone: string, otp: string, authKey: string, templateId: string): Promise<SmsResult> {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    // Already has country code
  } else if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const response = await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'authkey': authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      recipients: [{ mobiles: cleanPhone, var1: otp }],
    }),
  });

  const data = await response.json();
  console.log(`📱 MSG91 Flow response for ${cleanPhone}:`, JSON.stringify(data));

  if (data.type === 'success') {
    return { success: true, actuallyDelivered: true, messageId: data.message_id?.toString() };
  }

  const errorMsg = data.message || 'MSG91 error';
  if (isAccountError(errorMsg)) {
    return { success: false, actuallyDelivered: false, error: errorMsg };
  }
  throw new Error(errorMsg);
}

/**
 * Send OTP via MSG91 OTP API (no template needed, uses built-in OTP feature)
 */
async function sendViaMsg91Otp(phone: string, otp: string, authKey: string): Promise<SmsResult> {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    // keep as-is
  } else if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'authkey': authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      otp,
      otp_length: 6,
      mobile: cleanPhone,
    }),
  });

  const data = await response.json();
  console.log(`📱 MSG91 OTP response for ${cleanPhone}:`, JSON.stringify(data));

  if (data.type === 'success') {
    return { success: true, actuallyDelivered: true, messageId: data.request_id?.toString() };
  }

  const errorMsg = data.message || 'MSG91 error';
  if (isAccountError(errorMsg)) {
    return { success: false, actuallyDelivered: false, error: errorMsg };
  }
  throw new Error(errorMsg);
}

export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();

  if (authKey) {
    try {
      // If template_id is configured, use Flow API (custom message)
      // Otherwise use OTP API (built-in MSG91 OTP)
      if (templateId) {
        return await sendViaMsg91Flow(phone, otp, authKey, templateId);
      }
      return await sendViaMsg91Otp(phone, otp, authKey);
    } catch (err: any) {
      throw err;
    }
  }

  // No credentials → dev mode
  console.log(`\n📱 PHONE OTP for ${phone}: ${otp}`);
  console.log(`   ⚠️ Add MSG91_AUTH_KEY to .env or Admin > Credentials for real SMS delivery\n`);
  return { success: true, actuallyDelivered: false };
}

export async function isSmsConfigured(): Promise<boolean> {
  const key = await getMsg91AuthKey();
  return !!key;
}
