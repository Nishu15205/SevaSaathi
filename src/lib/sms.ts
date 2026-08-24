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

  throw new Error(data.message || 'Fast2SMS error');
}

export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = await getFast2SmsApiKey();

  if (apiKey) {
    const result = await sendViaFast2SMS(phone, otp, apiKey);
    return result;
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
