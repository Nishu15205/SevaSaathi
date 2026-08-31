/**
 * SMS Service for SevaSaathi — Real OTP Delivery via MSG91
 *
 * Simple, single-path approach:
 * 1. We generate a 6-digit OTP
 * 2. We store its salted hash in DB
 * 3. We pass our OTP to MSG91 API — MSG91 delivers it via their pre-approved DLT template
 * 4. Verification always happens against the DB hash
 *
 * If MSG91 auth key is not configured → dev mode (OTP logged to console & shown in UI)
 */

import { getMsg91AuthKey, getMsg91TemplateId } from './config';

export interface SmsResult {
  success: boolean;
  /** True if SMS was actually sent via MSG91. False = dev mode. */
  delivered: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Clean phone: strip non-digits, prepend 91 if 10-digit Indian number
 * Returns digits only (e.g., "918076998046" for +91-8076998046)
 */
function cleanPhone(phone: string): string {
  let p = phone.replace(/[^0-9]/g, '');
  // If 10-digit Indian number (starts with 6-9), prepend country code
  if (p.length === 10 && /^[6-9]/.test(p)) {
    p = '91' + p;
  }
  return p;
}

/**
 * Send OTP via MSG91 OTP API v5
 * We pass our own OTP so MSG91 delivers it (not generates its own).
 * MSG91 uses their pre-approved DLT OTP template — no custom template needed.
 */
async function sendViaMsg91OtpApi(phone: string, otp: string, authKey: string): Promise<SmsResult> {
  const mobile = cleanPhone(phone);

  console.log(`\n📱 MSG91 OTP API → phone: ${mobile}, otp: ${otp}`);

  const body: Record<string, any> = {
    mobile,
    otp,
    otp_length: otp.length,
  };

  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'authkey': authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  console.log(`📱 MSG91 response:`, JSON.stringify(data));

  if (data.type === 'success') {
    console.log(`✅ OTP ${otp} sent successfully to ${mobile} via MSG91`);
    return {
      success: true,
      delivered: true,
      messageId: data.request_id?.toString(),
    };
  }

  // Error handling
  const errorMsg = data.message || 'MSG91 API error';
  console.error(`❌ MSG91 failed for ${mobile}: ${errorMsg}`);
  return { success: false, delivered: false, error: errorMsg };
}

/**
 * Send OTP via MSG91 Flow API (custom DLT template with var1)
 * Only used when template_id is also configured.
 */
async function sendViaMsg91FlowApi(phone: string, otp: string, authKey: string, templateId: string): Promise<SmsResult> {
  const mobile = cleanPhone(phone);

  console.log(`\n📱 MSG91 Flow API → phone: ${mobile}, otp: ${otp}, template: ${templateId}`);

  const response = await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'authkey': authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      recipients: [{ mobiles: mobile, var1: otp }],
    }),
  });

  const data = await response.json();
  console.log(`📱 MSG91 Flow response:`, JSON.stringify(data));

  if (data.type === 'success') {
    console.log(`✅ OTP ${otp} sent via MSG91 Flow to ${mobile}`);
    return {
      success: true,
      delivered: true,
      messageId: data.message_id?.toString(),
    };
  }

  const errorMsg = data.message || 'MSG91 Flow error';
  console.error(`❌ MSG91 Flow failed for ${mobile}: ${errorMsg}`);
  return { success: false, delivered: false, error: errorMsg };
}

/**
 * Send phone OTP — the main entry point.
 *
 * - If MSG91 auth key + template_id → Flow API
 * - If MSG91 auth key only → OTP API (MSG91's pre-approved DLT template)
 * - If nothing → dev mode (console log + UI fallback)
 *
 * CRITICAL: We ALWAYS pass our own OTP to MSG91 so that:
 * 1. The same OTP is in the SMS and in our DB hash
 * 2. Verification always works against the DB
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  const authKey = await getMsg91AuthKey();
  const templateId = await getMsg91TemplateId();

  // No MSG91 credentials → dev mode
  if (!authKey) {
    console.log(`\n📱 DEV MODE — PHONE: ${phone}, OTP: ${otp}`);
    console.log(`⚠️  MSG91 auth key not configured. Add it in Admin Settings or .env (MSG91_AUTH_KEY)`);
    return { success: true, delivered: false };
  }

  // If template_id is configured → Flow API (custom template)
  if (templateId) {
    return await sendViaMsg91FlowApi(phone, otp, authKey, templateId);
  }

  // Default → OTP API (MSG91's pre-approved OTP template, best delivery rate)
  return await sendViaMsg91OtpApi(phone, otp, authKey);
}

/**
 * Check if SMS (MSG91) is configured.
 */
export async function isSmsConfigured(): Promise<boolean> {
  return !!(await getMsg91AuthKey());
}
