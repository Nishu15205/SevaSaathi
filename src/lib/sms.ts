/**
 * SMS Service for SevaSaathi
 * 
 * Fast2SMS OTP route: Uses their built-in OTP template
 * Fallback to dev mode if API key not set or delivery fails
 */

export interface SmsResult {
  success: boolean;
  actuallyDelivered: boolean; // true only if SMS was really sent
  messageId?: string;
  error?: string;
}

/**
 * Send Phone OTP via Fast2SMS
 * Uses the 'otp' route which has a built-in OTP template
 */
async function sendViaFast2SMS(phone: string, otp: string): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error('FAST2SMS_API_KEY not set');

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Fast2SMS OTP route - uses built-in OTP template
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

  // If OTP route fails (e.g. DLT issue), try transactional route
  if (process.env.FAST2SMS_TEMPLATE_ID) {
    console.log('OTP route failed, trying DLT template route...');
    const dltResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'dlt',
        sender_id: process.env.FAST2SMS_SENDER_ID || 'SEVATH',
        template_id: process.env.FAST2SMS_TEMPLATE_ID,
        message: otp,
        language: 'english',
        numbers: cleanPhone,
      }),
    });
    const dltData = await dltResponse.json();
    console.log(`📱 Fast2SMS DLT response:`, JSON.stringify(dltData));
    if (dltData.return === true) {
      return { success: true, actuallyDelivered: true, messageId: dltData.message_id?.toString() };
    }
    throw new Error(dltData.message || 'Fast2SMS DLT route error');
  }
  
  throw new Error(data.message || 'Fast2SMS error');
}

/**
 * Send Phone OTP
 * Uses Fast2SMS if configured, otherwise dev mode
 * Returns `actuallyDelivered` to distinguish real SMS from fallback
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<SmsResult> {
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const result = await sendViaFast2SMS(phone, otp);
      return result;
    } catch (err: any) {
      console.error('⚠️ Fast2SMS failed:', err.message);
      console.error('   OTP is stored in DB — user can still verify once SMS provider is fixed.');
      // Return success: true but actuallyDelivered: false so the caller knows
      return { 
        success: true, 
        actuallyDelivered: false, 
        error: `SMS delivery failed: ${err.message}` 
      };
    }
  }

  // Dev mode: no SMS provider configured
  console.log(`\n📱 PHONE OTP for ${phone}: ${otp}`);
  console.log(`   ⚠️ Add FAST2SMS_API_KEY to .env for real SMS delivery\n`);
  return { success: true, actuallyDelivered: false };
}

/**
 * Check if real SMS delivery is configured
 */
export function isSmsConfigured(): boolean {
  return !!process.env.FAST2SMS_API_KEY;
}