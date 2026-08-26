# Task ID: 7 — Agent: full-stack-developer

## Task
Google Auth callback for new users, Aadhaar visibility, Phone OTP for Google users

## Work Done

### 1. Google Auth Callback — Full-Page Verification Flow (`src/app/page.tsx`)
- **Problem**: New Google users were redirected with `?auth=success&new=true&email=xxx` but the frontend just showed a generic toast and redirected to dashboard
- **Solution**: Created `GoogleSignupVerification` component — a full-page, 3-step verification flow on a dark forest-green background:
  1. **Step 1 — Verify Email**: Auto-sends OTP to the Google email, shows 6-digit InputOTP with countdown timer (120s), resend option, dev OTP display
  2. **Step 2 — Add Phone Number**: Optional step with +91 prefix, 10-digit input, send OTP → verify OTP flow (60s timer), skip option
  3. **Step 3 — Done**: Success screen showing verification status, "Go to Dashboard" button
- **AuthCallbackHandler** updated: now accepts `onNewGoogleUser` callback. When `new=true&email=xxx` is detected, it calls the callback instead of showing a toast
- **Home** component: manages `pendingVerificationEmail` state. When set, shows the verification flow instead of the dashboard or landing page
- URL is cleaned up (`router.replace("/"`)` on mount of the verification flow
- Uses `api.auth.sendOtp()`, `api.auth.verifyOtp()`, `api.auth.sendPhoneOtp()`, `api.auth.verifyPhoneOtp()`

### 2. Aadhaar Verification — More Prominent (`src/components/dashboard/CaregiverDashboard.tsx`)
- Created `AadhaarVerificationPromptBanner` component:
  - Large card with forest-green gradient (`from-forest-50 via-green-50 to-lime-50`)
  - Border `border-forest-300`, icon in `forest-100` bg, text in `forest-900`
  - Big "Verify Aadhaar Now" button in `bg-forest-900`
  - Opens the existing `AadhaarQuickVerifyDialog` on click
- **ProfileTab**: Added banner ABOVE the profile card when `!profile.isVerified`
- **OverviewTab (with profile)**: Replaced small blue banner with the same prominent green gradient banner (bigger, `size="lg"` button)
- **OverviewTab (no profile, new caregiver)**: Changed from blue/indigo to forest-green theme
- All banners now use SevaSaathi green theme (#14532d forest, #a3e635 lime) — no more blue/indigo

### 3. Phone Number Prompt for Google Users (`src/components/dashboard/CaregiverDashboard.tsx`)
- Created `AddPhoneCard` component:
  - Amber-themed card with gradient `from-amber-50 to-orange-50`
  - Shows when `!user.phone` (Google users have empty phone)
  - Step 1: Phone input with +91 prefix, 10-digit validation, "Send OTP" button
   - Step 2: OTP verification with InputOTP, dev OTP display, resend timer, "Change number" link
   - On success: updates authStore with phone + phoneVerified
- Placed in 3 locations:
  1. **OverviewTab (no profile)**: Above Aadhaar card
  2. **OverviewTab (with profile)**: Above Aadhaar banner (first thing user sees)
  3. **ProfileTab**: Above the Aadhaar banner

### Files Modified
- `src/app/page.tsx` — Rewrote with GoogleSignupVerification flow, updated AuthCallbackHandler
- `src/components/dashboard/CaregiverDashboard.tsx` — Added AadhaarVerificationPromptBanner, AddPhoneCard, updated banner themes

### Lint
- `bun run lint` — 0 errors, 0 warnings
- Dev server compiling successfully, all routes returning 200
