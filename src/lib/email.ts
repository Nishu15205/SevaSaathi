import { db } from './db';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  type?: string;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Email service for SevaSaathi
 * - With RESEND_API_KEY: Sends real emails via Resend
 * - Without RESEND_API_KEY: Logs to console + database (dev mode)
 */
export async function sendEmail({ to, subject, html, userId, type }: EmailOptions) {
  try {
    // Production: Use Resend API
    if (resend) {
      const result = await resend.emails.send({
        from: 'SevaSaathi <onboarding@resend.dev>', // Update with your verified domain after setup
        to,
        subject,
        html,
      });

      console.log(`\n📧 EMAIL SENT via Resend -> ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Resend ID: ${result.data?.id}`);
      console.log(`   Type: ${type || 'general'}\n`);

      await db.emailLog.create({
        data: { to, subject, body: html, status: 'sent', userId, type, externalId: result.data?.id },
      });

      return { success: true, messageId: result.data?.id };
    }

    // Development: Log to console and database
    console.log(`\n📧 EMAIL (DEV MODE) -> ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Type: ${type || 'general'}`);
    console.log(`   ⚠️ Add RESEND_API_KEY to .env for real delivery\n`);

    await db.emailLog.create({
      data: { to, subject, body: html, status: 'sent', userId, type },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Email send error:', err?.message || err);
    await db.emailLog.create({
      data: { to, subject, body: html, status: 'failed', userId, type },
    }).catch(() => {});
    return { success: false, error: err?.message || 'Failed to send email' };
  }
}

/**
 * Send OTP via email (used for registration & password reset)
 */
export async function sendOtpEmail(to: string, otp: string, purpose: string) {
  const purposeText = purpose === 'REGISTER' ? 'Verify your email to complete registration' : 'Use this OTP to reset your password';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #14532d; padding: 20px; text-align: center;">
        <h1 style="color: #a3e635; margin: 0;">SevaSaathi</h1>
        <p style="color: white; margin: 5px 0 0;">${purpose === 'REGISTER' ? 'Email Verification' : 'Password Reset'}</p>
      </div>
      <div style="padding: 24px; background: #f9fafb;">
        <p style="color: #374151;">${purposeText}:</p>
        <div style="background: white; border-radius: 12px; padding: 24px; margin: 16px 0; text-align: center; border: 2px dashed #a3e635;">
          <p style="font-size: 32px; font-weight: bold; color: #14532d; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This OTP expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: purpose === 'REGISTER' ? `SevaSaathi - Verify Your Email (${otp})` : `SevaSaathi - Password Reset OTP (${otp})`,
    html,
    type: purpose === 'REGISTER' ? 'email_verification' : 'password_reset',
  });
}

export async function sendBookingConfirmationEmail(booking: any) {
  const family = await db.user.findUnique({ where: { id: booking.familyId } });
  const caregiver = await db.caregiver.findUnique({
    where: { id: booking.caregiverId },
    include: { user: true },
  });
  const patient = await db.patient.findUnique({ where: { id: booking.patientId } });

  if (!family || !caregiver || !patient) return;

  const dateStr = new Date(booking.startDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #14532d; padding: 20px; text-align: center;">
        <h1 style="color: #a3e635; margin: 0;">SevaSaathi</h1>
        <p style="color: white; margin: 5px 0 0;">Booking Confirmed!</p>
      </div>
      <div style="padding: 24px; background: #f9fafb;">
        <p style="color: #374151;">Dear ${family.name},</p>
        <p style="color: #374151;">Your care booking has been <strong>confirmed</strong>. Here are the details:</p>
        <div style="background: white; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
          <p><strong>Patient:</strong> ${patient.name}</p>
          <p><strong>Caregiver:</strong> ${caregiver.user.name}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Shift:</strong> ${booking.shiftType?.replace(/_/g, ' ')}</p>
          <p><strong>Amount:</strong> ₹${(booking.totalAmount || 0) / 100}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Thank you for choosing SevaSaathi!</p>
      </div>
    </div>
  `;

  await sendEmail({ to: family.email, subject: `Booking Confirmed - ${patient.name} - ${dateStr}`, html, userId: family.id, type: 'booking_confirmation' });
}

export async function sendCareReportEmail(report: any, booking: any) {
  const family = await db.user.findUnique({ where: { id: booking.familyId } });
  const caregiver = await db.caregiver.findUnique({
    where: { id: report.caregiverId },
    include: { user: true },
  });
  const patient = await db.patient.findUnique({ where: { id: booking.patientId } });

  if (!family || !caregiver || !patient) return;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #14532d; padding: 20px; text-align: center;">
        <h1 style="color: #a3e635; margin: 0;">SevaSaathi</h1>
        <p style="color: white; margin: 5px 0 0;">New Care Report</p>
      </div>
      <div style="padding: 24px; background: #f9fafb;">
        <p style="color: #374151;">Dear ${family.name},</p>
        <p style="color: #374151;">A new care report has been submitted for <strong>${patient.name}</strong> by <strong>${caregiver.user.name}</strong>.</p>
        <div style="background: white; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
          <p><strong>Date:</strong> ${report.reportDate}</p>
          <p><strong>Mood:</strong> ${report.mood || 'Normal'}</p>
          <p><strong>Food Intake:</strong> ${report.foodIntake || 'Normal'}</p>
          ${report.summary ? `<p><strong>Summary:</strong> ${report.summary}</p>` : ''}
          ${report.concerns ? `<p style="color: #dc2626;"><strong>Concerns:</strong> ${report.concerns}</p>` : ''}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Log in to your dashboard to view the full report.</p>
      </div>
    </div>
  `;

  await sendEmail({ to: family.email, subject: `Care Report - ${patient.name} - ${report.reportDate}`, html, userId: family.id, type: 'care_report' });
}
