import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Returns a configured Razorpay instance, or null if credentials are not set.
 */
export function getRazorpayInstance(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === 'your_razorpay_key_id_here') {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Verifies the payment signature returned by the Razorpay checkout.
 * Uses HMAC-SHA256 on `orderId|paymentId` with the key secret.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || keySecret === 'your_razorpay_key_secret_here') {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8'),
  );
}

/**
 * Verifies the webhook signature from the `X-Razorpay-Signature` header.
 * Uses HMAC-SHA256 on the raw request body with the webhook secret.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret === 'your_razorpay_key_secret_here') {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8'),
  );
}
