/**
 * Brevo (formerly Sendinblue) Email Service
 * 
 * Uses Brevo REST API v3 for sending transactional emails.
 * Free tier: 300 emails/day.
 * 
 * Config: BREVO_API_KEY in system_configs DB or env var
 */

import { db } from './db';
import { getConfigWithFallback } from './config';

interface BrevoEmailOptions {
  to: string;
  subject: string;
  html: string;
  senderName?: string;
  senderEmail?: string;
}

async function getBrevoApiKey(): Promise<string | null> {
  return getConfigWithFallback('BREVO', 'API_KEY', 'BREVO_API_KEY');
}

export async function isBrevoConfigured(): Promise<boolean> {
  const key = await getBrevoApiKey();
  return !!key;
}

/**
 * Send an email via Brevo API.
 * Falls back gracefully if not configured.
 */
export async function sendBrevoEmail({
  to,
  subject,
  html,
  senderName = 'SevaSaathi',
  senderEmail,
}: BrevoEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = await getBrevoApiKey();

  if (!apiKey) {
    console.log(`\n📧 BREVO not configured — email to ${to} not sent`);
    console.log(`   Add BREVO_API_KEY in Admin > Settings or .env\n`);
    return { success: false, error: 'Brevo API key not configured' };
  }

  const defaultSender = await getConfigWithFallback('BREVO', 'SENDER_EMAIL', 'BREVO_SENDER_EMAIL');
  const fromEmail = senderEmail || defaultSender || 'nishuraj1520005@gmail.com';

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json() as any;

    if (response.ok) {
      console.log(`\n📧 EMAIL SENT via Brevo -> ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Message ID: ${data.messageId}\n`);
      return { success: true, messageId: data.messageId };
    }

    const errorMsg = data.message || data.code || 'Brevo API error';
    console.error(`📧 Brevo error for ${to}: ${errorMsg}`, JSON.stringify(data));
    return { success: false, error: String(errorMsg) };
  } catch (err: any) {
    console.error('📧 Brevo request error:', err?.message || err);
    return { success: false, error: err?.message || 'Brevo request failed' };
  }
}

/**
 * Log email to database.
 */
export async function logEmailToDb(params: {
  to: string;
  subject: string;
  html: string;
  status: 'sent' | 'failed';
  userId?: string;
  type?: string;
  externalId?: string;
  error?: string;
}) {
  try {
    await db.emailLog.create({
      data: {
        to: params.to,
        subject: params.subject,
        body: params.html,
        status: params.status,
        userId: params.userId,
        type: params.type,
        externalId: params.externalId,
      },
    });
  } catch {
    // Don't let email logging break the flow
  }
}
