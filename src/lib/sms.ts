/**
 * SMS Service for SevaSaathi
 * 
 * Supports:
 * 1. Fast2SMS (Recommended for India - free tier available)
 * 2. MSG91 (Alternative)
 * 3. Dev mode: logs OTP to console (no API key needed)
 * 
 * Set FAST2SMS_API_KEY or MSG91_AUTH_KEY in .env for real SMS delivery
 */

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via Fast2SMS (India)
 * Free tier: 100 SMS/day
 * Signup: https://www.fast2sms.com/
 */
async function sendViaFast2SMS(phone: string, message: string): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error('FAST2SMS_API_KEY not set');

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: '',
      numbers: phone.replace(/[^0-9]/g, ''),
      flash: 0,
    }),
  });

  const data = await response.json();
  if (data.return === true) {
    return { success: true, messageId: data.message_id?.toString() };
  }
  throw new Error(data.message || 'Fast2SMS error');
}

/**
 * Send SMS via MSG91
 * Signup: https://msg91.com/
 */
async function sendViaMsg91(phone: string, otp: string): Promise<SmsResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey) throw new Error('MSG91_AUTH_KEY not set');

  const response = await fetch(`https://api.msg91.com/api/v5/otp?template_id=${templateId || ''}&mobile=${phone.replace(/[^0-9]/g, '')}&authkey=${authKey}&otp=${otp}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (data.type === 'success') {
    return { success: true, messageId: data.message };
  }
  throw new Error(data.message || 'MSG91 error');
}

/**
 * Send Phone OTP
 * Automatically picks available SMS provider or falls back to dev mode
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  // Try Fast2SMS first (recommended for India)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      // Fast2SMS OTP route needs DLT template, so we use transactional route with message
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: 'TXTIND', // Default sender ID for dev
          message: `Your SevaSaathi verification OTP is ${otp}. Valid for 5 minutes. Do not share.`,
          language: 'english',
          flash: 0,
          numbers: phone.replace(/[^0-9]/g, ''),
        }),
      });
      const data = await response.json();
      console.log(`📱 SMS sent via Fast2SMS to ${phone}: ${JSON.stringify(data)}`);
      if (data.return === true || data.status_code === 200) {
        return { success: true, messageId: data.message_id?.toString() };
      }
      console.error('Fast2SMS error:', data.message);
      return { success: false, error: data.message };
    } catch (err: any) {
      console.error('Fast2SMS failed:', err.message);
    }
  }

  // Try MSG91 as fallback
  if (process.env.MSG91_AUTH_KEY) {
    try {
      return await sendViaMsg91(phone, otp);
    } catch (err: any) {
      console.error('MSG91 failed:', err.message);
    }
  }

  // Dev mode: no SMS provider configured
  console.log(`\n📱 PHONE OTP for ${phone}: ${otp}`);
  console.log(`   ⚠️ Add FAST2SMS_API_KEY or MSG91_AUTH_KEY to .env for real SMS delivery\n`);
  return { success: true }; // Dev mode - OTP stored in DB, returned in response
}

/**
 * Check if real SMS delivery is configured
 */
export function isSmsConfigured(): boolean {
  return !!(process.env.FAST2SMS_API_KEY || process.env.MSG91_AUTH_KEY);
}
