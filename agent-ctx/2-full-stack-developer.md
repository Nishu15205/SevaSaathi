# Task ID: 2 — Agent: full-stack-developer

## Task
Real SMS OTP delivery via MSG91 integration

## Changes Made

### 1. `.env` — Appended MSG91 variables (did NOT remove existing)
```
MSG91_AUTH_KEY=your-msg91-auth-key-here
MSG91_TEMPLATE_ID=your-template-id-here
MSG91_SENDER=SEVSSA
```

### 2. `src/lib/sms.ts` — New file
- `sendSmsOtp(phone, otp)` → `Promise<SmsResult>`
- Normalizes Indian phone numbers (strips non-digits, prepends 91 for 10-digit)
- Production: POST to `https://api.msg91.com/api/v5/flow/` with authkey header
- Dev mode: console log with `[DEV MODE]` prefix
- Returns `{ success, message, devOtp? }`

### 3. `src/app/api/auth/send-phone-otp/route.ts` — Updated
- Imported `sendSmsOtp` from `@/lib/sms`
- Replaced inline `console.log` OTP logic with `sendSmsOtp()` call
- Response uses `result.message` and `result.devOtp`

## Lint
- `bun run lint` — 0 errors, 0 warnings

## Notes
- Did NOT create `src/middleware.ts`
- Did NOT remove any existing `.env` content
