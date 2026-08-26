/**
 * SMS Service for SevaSaathi
 * 
 * Reads API key from backend config (DB) first, falls back to env.
 */

import { getFast2SmsApiKey } from './config';

export interface SmsResult {
  success: boolean;
  actuallyDelivered: boolean;
  messageId?: string;
  error?: string;
}

// Error messages from Fast2SMS that indicate account/compliance issues (not transient)
const DLT_ERROR_PATTERNS = [
  'website verification',
  'dlt',
  'template',
  'sender id',
  'senderid',
  'account',
  'approved',
  'permission',
  'blocked',
  'suspended',
  'inactive',
];

function isDltOrAccountError(errorMsg: string): boolean {
  const lower = errorMsg.toLowerCase();
  return DLT_ERROR_PATTERNS.some(p => lower.includes(p));
}

async function sendViaFast2SMS(phone: string, otp: string, apiKey: string): Promise<SmsResult> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: otp,
      numbers: cleanPhone,
      flash: 0,
    }),
  });

  const data = await response.json();
  console.log(`📱 Fast2SMS response for ${cleanPhone}:`, JSON.stringify(data));
  
  if (data.return === true) {
    return { success: true, actuallyDelivered: true, messageId: data.message_id?.toString() };
  }

  const errorMsg = data.message || 'Fast2SMS error';

  // If it's a DLT/compliance error, mark it specially so callers can fall back to dev mode
  if (isDltOrAccountError(errorMsg)) {
    return { success: false, actuallyDelivered: false, error: errorMsg };
  }

  throw new Error(errorMsg);
}

export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = await getFast2SmsApiKey();

  if (apiKey) {
    try {
      const result = await sendViaFast2SMS(phone, otp, apiKey);
      return result;
    } catch (err: any) {
      // Transient network error — let caller handle it
      throw err;
    }
  }

  // No API key → dev mode
  console.log(`\n📱 PHONE OTP for ${phone}: ${otp}`);
  console.log(`   ⚠️ Add FAST2SMS_API_KEY to .env or Admin > Credentials for real SMS delivery\n`);
  return { success: true, actuallyDelivered: false };
}

export async function isSmsConfigured(): Promise<boolean> {
  const key = await getFast2SmsApiKey();
  return !!key;
}
