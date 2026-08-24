import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getRazorpayKeyId, getRazorpayKeySecret } from './config';

/**
 * Returns a configured Razorpay instance, or null if credentials are not set.
 * Reads from DB config first, falls back to env.
 */
export async function getRazorpayInstance(): Promise<Razorpay | null> {
  const keyId = await getRazorpayKeyId();
  const keySecret = await getRazorpayKeySecret();

  if (!keyId || !keySecret || keyId === 'your_razorpay_key_id_here') {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Get Razorpay key ID (for frontend display).
 */
export async function getRazorpayPublicKey(): Promise<string | null> {
  const keyId = await getRazorpayKeyId();
  if (!keyId || keyId === 'your_razorpay_key_id_here') return null;
  return keyId;
}

/**
 * Verifies the payment signature returned by the Razorpay checkout.
 */
export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const keySecret = await getRazorpayKeySecret();
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
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string,
): Promise<boolean> {
  const secret = await getRazorpayKeySecret();
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
