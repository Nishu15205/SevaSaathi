# Task ID: 1 — full-stack-developer

## Task
Replace Resend with Nodemailer + Gmail SMTP for real email delivery

## Changes Made
1. **Installed nodemailer** v9.0.5 (`bun add nodemailer`)
2. **Updated `.env`** — appended 4 SMTP vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM) without removing existing content
3. **Rewrote `src/lib/email.ts`**:
   - Removed `resend` import and Resend client
   - Added `nodemailer` import with lazy-initialized Transporter singleton via `getTransporter()`
   - `sendEmail()` now sends via nodemailer SMTP when configured, falls back to dev-mode console logging
   - DB status: `'sent'` (real), `'dev_mode'` (no SMTP), `'failed'` (error)
   - `sendBookingConfirmationEmail()` and `sendCareReportEmail()` preserved unchanged
4. **Lint** — 0 errors, 0 warnings

## Verification
- No `src/middleware.ts` created
- No existing `.env` lines removed
- All existing callers (send-otp, payment verify, report creation) automatically use new SMTP backend
