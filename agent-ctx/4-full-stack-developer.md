# Task 4 — full-stack-developer

## Task
Real email OTP delivery via Resend integration

## Changes Made

### 1. Installed `resend` package
- `resend@6.21.0` added to dependencies

### 2. `src/lib/email.ts` — Resend integration
- Added `import Resend from 'resend'` at top
- Resend client initialized conditionally: `const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null`
- `sendEmail()` now checks if `resend` is available:
  - **Yes** → sends via `resend.emails.send()` with from: `SevaSaathi <noreply@sevasaathi.in>`
  - **No** → falls back to console logging + DB logging (original dev behavior)
- Added comprehensive JSDoc documenting setup steps for production
- All existing email helpers (`sendBookingConfirmationEmail`, `sendCareReportEmail`) automatically benefit

### 3. `src/app/api/auth/send-otp/route.ts` — Real OTP email sending
- Imported `sendEmail` from `@/lib/email`
- Added `buildOtpHtml(otp, purpose)` function generating professional HTML email:
  - SevaSaathi green (#14532d) header with lime (#a3e635) logo text
  - OTP digits rendered as individual styled blocks (monospace, green background)
  - Yellow expiry warning banner (5 minutes)
  - Purpose-specific subject and body copy (REGISTER vs RESET_PASSWORD)
  - Green footer bar with copyright
- After generating & storing OTP, now calls `await sendEmail(...)` to actually deliver it
- Response: dev mode includes `otp` field; production mode hides it

### What was NOT modified
- `.env` — not touched (as instructed)
- `src/middleware.ts` — not created (as instructed)
- `src/app/api/auth/verify-otp/route.ts` — no changes needed
- Any frontend files — no changes needed

## Verification
- `bun run lint` — 0 errors, 0 warnings
- Dev server running normally, all routes responding

## How to Enable Real Email Delivery
1. Sign up at https://resend.com
2. Verify the domain `sevasaathi.in` in the Resend dashboard
3. Add `RESEND_API_KEY=re_xxxxxxxx` to `.env`
4. Restart the server
