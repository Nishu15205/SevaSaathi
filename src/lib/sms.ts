/**
 * SMS Service for SevaSaathi
 * 
 * Uses MSG91 Flow API to send OTP via SMS.
 * Reads auth key + template ID from backend config (DB) first, falls back to env.
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

async function sendViaMsg91(phone: string, otp: string, authKey: string, templateId: string): Promise<SmsResult> {
  // MSG91 expects phone without + prefix, e.g. 919876543210
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    // Already has country code, keep as-is
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
      recipients: [
        {
          mobiles: cleanPhone,
          var1: otp,
        },
      ],
    }),
  });

  const data = await response.json();
  console.log(`📱 MSG91 response for ${cleanPhone}:`, JSON.stringify(data));

  if (data.type === 'success') {
    return { success: true, actuallyDelivered: true, messageId: data.message_id?.toString() };
  }

  const errorMsg = data.message || 'MSG91 error';

  // If it's an account/compliance error, mark specially so callers can fall back
  if (isAccountError(errorMsg)) {
    return { success: false, actuallyDelivered: false, error: errorMsg };
  }

  throw new Error(errorMsg);
}

export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();

  if (authKey && templateId) {
    try {
      const result = await sendViaMsg91(phone, otp, authKey, templateId);
      return result;
    } catch (err: any) {
      // Transient network error — let caller handle it
      throw err;
    }
  }

  // No credentials → dev mode
  console.log(`\n📱 PHONE OTP for ${phone}: ${otp}`);
  console.log(`   ⚠️ Add MSG91_AUTH_KEY + MSG91_TEMPLATE_ID to .env or Admin > Credentials for real SMS delivery\n`);
  return { success: true, actuallyDelivered: false };
}

export async function isSmsConfigured(): Promise<boolean> {
  const key = await getMsg91AuthKey();
  const template = await getMsg91TemplateId();
  return !!(key && template);
}
