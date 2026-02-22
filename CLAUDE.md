# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Development Rules

- Do NOT invent features not described in this document
- Do NOT remove safeguards
- Always explain why something exists
- Ask before making breaking changes
- When giving code: specify file path, give copy-paste-ready snippets
- If something is unclear, ask before guessing
- Do not simplify unless explicitly instructed

---

## 1. Product Overview

**Attenda** is a premium SaaS tool that helps service businesses reduce no-show appointments.

- **Domain**: attenda.app (live on Vercel)
- **GitHub**: github.com/Asolution-hub/attenda
- **This is a real, paid product** — assume real users, real money, legal implications, and long-term maintenance
- Landing page + Dashboard live in one Next.js project

**Design system**:
- Colors: Indigo primary (`#6366F1`), Teal accent (`#14B8A6`)
- Typography: Inter font (weights 400-800)
- Style: DataPulse-inspired SaaS analytics aesthetic
- UI/UX: Premium, minimal, calm. No clutter.

---

## 2. Payment Architecture (NON-NEGOTIABLE)

### Stripe Connect Flow

**Money Flow:**
1. Business registers with Stripe Connect (Standard connected account)
2. Client authorizes card → PaymentIntent created **on business's connected account**
3. No-show happens → Business clicks "Mark no-show" → Money goes **directly to business's bank account**
4. Attenda takes platform fee (2-5% or subscription)

**Why Stripe Connect is mandatory:**
- Attenda cannot hold business revenue (illegal, not scalable)
- Stripe handles: payouts, tax reporting, compliance, KYC
- Standard marketplace model (Airbnb, Uber, Shopify)

**Charging prerequisites — ALL must be true:**
1. Business completed Stripe Connect onboarding (`onboarding_completed = true`)
2. Confirmation was sent to customer
3. Customer completed Stripe authorization
4. Business manually clicked "Mark no-show"

**If any prerequisite is missing, charge MUST fail.**

- No automatic charging ever
- No hidden behavior
- "Mark attended" → no charge, authorization released
- "Confirmation expired" → no charge

### Business Registration Flow

**First-time user journey:**
1. User logs in (magic link / Google OAuth)
2. Redirected to `/onboarding/business` (BEFORE dashboard access)
3. Stripe Connect onboarding (business details, bank account, verification)
4. Status: `pending` → `enabled` (1-2 days)
5. Can create events but can't send confirmations until verified
6. Email notification when verified

---

## 3. Tech Stack & Commands

**Framework**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
**Database/Auth**: Supabase (PostgreSQL + RLS + magic links + Google/Microsoft OAuth)
**Payments**: Stripe Connect + Subscriptions
**Monitoring**: Sentry (error tracking, performance monitoring, Session Replay)
**External APIs**: Google Calendar (OAuth2), Microsoft Outlook Calendar (OAuth2), Resend (email), Twilio (SMS - planned)
**Path alias**: `@/*` maps to project root

**Commands** (run from `/App/attenda/`):
```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

---

## 4. Architecture

### Directory Structure

```
App/attenda/
├── app/
│   ├── api/              # API route handlers
│   │   ├── stripe/       # Checkout, webhooks, portal, connect
│   │   ├── bookings/     # Booking management, refunds
│   │   ├── profile/      # Settings, GDPR export/delete
│   │   ├── admin/        # Webhook reconciliation, health checks
│   │   └── cron/         # Scheduled jobs (reminders, usage checks)
│   ├── dashboard/        # Protected dashboard UI
│   ├── onboarding/       # Business registration flow
│   ├── login/            # Authentication
│   ├── confirm/[token]/  # Public client confirmation page
│   ├── (landing)/        # Landing page components
│   └── components/       # Shared React components
├── lib/                  # Utilities and helpers
├── emails/               # React Email templates
└── migrations/           # SQL migrations
```

### Key Files

**Auth & Security:**
- `lib/auth.ts` - verifyUserAccess, verifyCronSecret, verifyInternalSecret, verifyOrigin
- `lib/validation.ts` - UUID/input validation, sanitization, timing protection (**NOT** for rate limiting — use `lib/rateLimit.ts`)
- `lib/encryption.ts` - AES-256-GCM token encryption
- `lib/rateLimit.ts` - Redis-based rate limiting (Upstash) — ALWAYS use this, never in-memory
- `proxy.ts` - Security headers, CSP, HSTS, X-Frame-Options (Next.js 16 uses `proxy.ts`, NOT `middleware.ts`)

**Integrations:**
- `lib/googleAuth.ts` - OAuth2 client with encrypted token storage
- `lib/microsoftAuth.ts` - Microsoft Graph API client
- `lib/stripe.ts` - Stripe Connect helpers
- `lib/email.ts` - Resend email sender
- `lib/sms.ts` - Twilio SMS (planned)

**Business Logic:**
- `lib/noShowRules.ts` - Resolves global + per-appointment rule overrides. Defines: `DEFAULT_NO_SHOW_FEE_CENTS = 2000`, `DEFAULT_GRACE_PERIOD_MINUTES = 10`, `DEFAULT_LATE_CANCEL_HOURS = 24`
- `lib/contactParser.ts` - Extracts email/phone from event text
- `lib/plans.ts` - Plan configuration (Starter/Pro/Business)
- `lib/currency.ts` - Multi-currency support (EUR/USD)

### Critical API Routes

**Stripe Connect:**
- `/api/stripe/connect/onboard` - Create connected account + onboarding link
- `/api/stripe/connect/return` - Handle onboarding completion
- `/api/stripe/connect/status` - Check account status
- `/api/stripe/connect/dashboard` - Generate Express Dashboard link

**Payments:**
- `/api/stripe/create-checkout` - Pro checkout (logged-in users)
- `/api/stripe/create-checkout-guest` - Pro checkout (new users)
- `/api/stripe/create-authorization` - Card authorization (on connected account)
- `/api/stripe/webhook` - All Stripe webhook events (idempotent)

**Bookings:**
- `/api/bookings/[id]/refund` - Issue full/partial refund
- `/api/no-show/settings` - GET (auto-creates defaults if missing)
- `/api/no-show/override` - Per-event protection overrides
- `/api/events/list` - Google + manual events

**Admin & User:**
- `/api/admin/reconcile` - Compare Stripe vs DB for mismatches
- `/api/health` - Health check endpoint
- `/api/profile/export` - GDPR data export (JSON)
- `/api/profile/delete` - Account deletion (7-year financial retention)

### Cron Jobs (cron-job.org)

All 5 jobs are live. All require `Authorization: Bearer <CRON_SECRET>` header (POST only).

| Job | Schedule | Purpose |
|-----|----------|---------|
| `send-draft-confirmation` | Every 30 min | Sends confirmations after 10-min draft window; respects Starter 30/month limit |
| `send-reminders` | Every hour | Reminders for next-24h appointments; Pro users only |
| `sync-calendar` | Every hour | Syncs Google/Microsoft for all users; also runs on dashboard load |
| `check-expiring-authorizations` | Every 6 hours | Renews PaymentIntents expiring within 24h (PIs expire after 7 days) |
| `check-usage` | Daily 09:00 UTC | Warns Starter users at 25/30 appointments; once/month limit |

Note: `auto-confirm` route exists but is disabled in code (replaced by draft flow).

---

## 5. Plans, Pricing & Limits

### Starter (Free)
- Max 30 protected appointments/month
- Email confirmations only
- Automatic confirmation after draft window
- No auto-resend, limited settings
- When limit reached: UI shows "Protection not applied — monthly limit reached"
- Email branding: "via Attenda" footer

### Pro (€39 / $39 per month)
- Unlimited appointments
- Email + SMS confirmations (SMS planned)
- Auto-resend available
- Per-appointment protection rules
- White-label email option
- Access to Stripe Express Dashboard

### Business (Planned)
- Not available yet — code should anticipate it without exposing UI
- Multi-user accounts, API access, custom integrations

### Pricing Rules
- EU countries → EUR, rest of world → USD
- Numeric price stays the same (39)
- Currency stored per booking
- Display correct symbol in UI

### Pro Signup Flows

| From | Flow |
|------|------|
| Landing page (new user) | Get Pro → Checkout → `/welcome` → Magic link → Business onboarding → Dashboard |
| Dashboard (existing user) | Upgrade to Pro → Checkout → Settings page with success message |

---

## 6. Event & Booking Lifecycle

### Statuses

**Confirmation**: `draft` → `pending` → `confirmed` | `expired`
**Attendance**: `pending` → `attended` | `no_show`

### Calendar Event Ingestion

- Fetch upcoming and recent events from connected calendars
- Each calendar event maps to one internal booking

**Contact Extraction:**
- Scan event title AND description
- Priority: First valid email → `email` channel; else first valid phone → `sms` channel
- Strip contact info from displayed event title
- Store contact separately as `client_contact`, channel as `email` | `sms`

**If no contact found:** Event shown but confirmation actions disabled. UI warning: "No contact found — add email or phone to event"

### Booking States

**Draft:** Confirmation NOT sent yet. Draft window = 10 minutes. During draft: business can edit protection rules (Pro only) and manually send confirmation. After draft expires: cron auto-sends (next run within 30 min). Manual send bypasses draft window.

**Pending:** Confirmation sent, waiting for customer confirmation. Payment authorization may or may not be completed.

**Confirmed:** Customer confirmed, Stripe authorization completed, booking is protected.

### Protection Rules

Each booking has: no-show fee (currency minor units), grace period (minutes), late cancellation window (hours).

**Default values** (defined in `lib/noShowRules.ts` — use these constants, never hardcode):
- `DEFAULT_NO_SHOW_FEE_CENTS = 2000` (€20 / $20)
- `DEFAULT_GRACE_PERIOD_MINUTES = 10`
- `DEFAULT_LATE_CANCEL_HOURS = 24`

- **Starter**: Global protection rules only, cannot edit per booking
- **Pro**: Can override protection rules per booking
- **Important**: Overrides locked once confirmation is sent

### Confirmation Flow

Sent automatically (after draft window) or manually (dashboard button). Creates `booking_confirmation` record, generates unique token, sends email/SMS.

**Verification gate (enforced at every send path):** `onboarding_completed = true` is required before any confirmation is sent. This is checked in:
1. `/api/bookings/send-confirmation` — dashboard "Send" button
2. `/api/bookings/send-draft-confirmation` — dashboard draft send
3. `/api/bookings/resend-confirmation` — dashboard "Resend" button
4. `/api/cron/send-draft-confirmation` — hourly cron auto-send
5. `/api/notifications/send` — final safety net at bottom of call chain

Non-verified users (Starter or Pro who haven't completed Stripe Connect) can create events but cannot send any notifications. The UI must also disable send buttons for non-verified users, but the API enforces this regardless.

**Confirmation message must include:** Event details, no-show fee, cancellation window, "Your card will be authorized, not charged", Stripe authorization link (Card/Apple Pay/Google Pay).

### Stripe Authorization (Customer Side)

PaymentIntent created **on business's connected account**, authorization only — no funds captured. Supported: Card, Apple Pay, Google Pay. Failed attempts tracked, business notified after 3 failures.

PaymentIntents expire after 7 days. Cron job monitors and auto-renews for upcoming appointments; notifies client to re-authorize if needed.

### Event Day Logic

**Before event start:** No attendance actions allowed.

**After event start:**

| Action | Result |
|--------|--------|
| Mark attended | Authorization released, no charge |
| Mark no-show | No-show fee captured via Stripe, money goes to business bank, receipt sent |

**Past events:** No action buttons, only final state displayed.

### Refunds & Disputes

**Refunds:** Business issues full/partial refund via "Issue Refund" button. Tracked in `stripe_refunds`. Client notified via email.

**Disputes/Chargebacks:** Tracked in `stripe_disputes`. Business notified immediately. Track `evidence_due_by` dates — business has limited time to respond with evidence.

---

## 7. Dashboard

### Navigation

- **Sidebar** (desktop >=900px): Expanded 260px / collapsed 72px (state in localStorage)
  - Logo, account card (avatar, display name, Pro badge, email), Create Event button, Usage counter (Starter), navigation, Upgrade button (Starter), theme toggle, log out, collapse toggle
- **Mobile (<900px)**: Sidebar hidden, `DashboardHeader` conditionally rendered only after client-side mount check (prevents flash bug)
- **Key files**: `DashboardContext.tsx`, `Sidebar.tsx`, `DashboardHeader.tsx`

### Layout

- **Stacked layout**: FullCalendar month grid on top, flat date-grouped event list below
- Clicking calendar date smooth-scrolls to that date's event section
- Clicking date/time slot opens CreateEventModal pre-filled
- **Past days locked**: Cannot create events on past dates
- Week view: `allDaySlot: false`, respects `timeFormat` (24h/12h)
- **Timezone fix**: Use `toLocalDateStr()` helper, NOT `toISOString().split("T")[0]`
- WelcomeEmpty shown when 0 events AND no calendar connected

### Onboarding Banners

**Pending Verification:**
```
⏳ Business Verification Pending
Stripe is verifying your account (1-2 days).
You can create events but can't send confirmations yet.
[ Check Status ] [ View Requirements ]
```

**Restricted Account:**
```
⚠️ Action Required - Account Restricted
Stripe needs additional information to enable payouts.
[ Resolve Issues in Stripe Dashboard ]
```

### Settings Page

- **Account card**: Name (editable), email, subscription status, usage, Manage/Upgrade button
- **Business Account card**: Business name, account status, last payout, Stripe Dashboard link
- **No-Show Policy card**: "Edit" button opens `NoShowSettingsModal`
- **Notifications**: Email confirmations (always on), SMS confirmations (Pro, planned), Auto-Resend (Pro)
- **Calendar Preferences**: Week start day, time format, timezone
- **Data & Privacy**: Export My Data, Delete My Account
- **Disputes section**: Active/past disputes, evidence submission links
- All cards use `--color-bg-card` background, `--color-text` / `--color-text-secondary` font colors

### Event Card Buttons (Strict Rules)

| Button | When Enabled |
|--------|--------------|
| Send confirmation | Draft state, contact exists, within limits, **onboarding complete** |
| Send reminder | Pending/Confirmed, Pro plan, before event start |
| Mark attended | After event start, confirmed booking |
| Mark no-show | After event start, confirmed booking with authorization |
| Issue Refund | After no-show marked |
| Edit/Delete | Draft manual events only |

Buttons must enable/disable based on time, plan, status, and onboarding. Never allow illegal actions.

---

## 8. Authentication & Security

### Authentication
- Supabase authentication (magic links + Google OAuth + Microsoft Azure OAuth login)
- **Login providers**: Magic link, Google OAuth (Supabase Google provider), Microsoft OAuth (Supabase Azure provider)
- **Calendar OAuth**: Separate from login — Google Calendar and Microsoft Outlook OAuth for calendar sync (token refresh + expiry tracked)
- Session management via Supabase cookies
- Admin routes protected by `ADMIN_EMAILS` whitelist

### Security Architecture

**Row Level Security (RLS):** All tables protected with user-scoped RLS policies using `auth.uid()`. Migration `005-enable-rls-policies-SAFE-RERUN.sql` covers 17 tables; migration `007-booking-protections-rls.sql` covers `booking_protections` (added 2026-02-21). **All 18 tables now have RLS.**

**API Route Protection:**
- **Admin Routes**: Email whitelist authentication required (`/api/admin/reconcile`, `/api/admin/webhooks`)
- **User Routes**: `verifyUserAccess()` validates authentication + user ownership
- **OAuth Connect Routes** (`/api/google/connect`, `/api/microsoft/connect`): Session verification via cookie-based auth — verifies session matches `userId` param (prevents OAuth session fixation)
- **OAuth Status Routes** (`/api/google/status`, `/api/microsoft/status`): Session verification required — `SettingsContent.tsx` must include `Authorization: Bearer` header when calling these
- **OAuth Disconnect Routes**: **Requires authentication** — MUST include `Authorization: Bearer <token>` header
- **Debug Endpoints**: Return 404 in production (`/api/debug-auth`, `/api/sentry-test-error`)
- **Health Endpoint**: Detailed metrics restricted to admin users only
- **CSRF Protection**: `verifyOrigin()` on ALL state-changing POST endpoints (including `/api/bookings/confirm` and `/api/stripe/create-authorization`)
- **UUID Validation**: All route parameters validated with `isValidUUID()`
- **Confirmation Page**: Server-side UUID validation + 24h expiry check before rendering Stripe form

**Rate Limiting (Redis via Upstash):**
- Confirmation: 10 req/min | Stripe: 20 req/min | Refund: 5 req/min | General API: 60 req/min | Auth: 5 req/min | Webhooks: 100 req/min
- **Critical**: In-memory rate limiting is ineffective in serverless — ALWAYS use `@/lib/rateLimit`, NEVER `checkRateLimitInMemory_NOT_FOR_PRODUCTION` from `@/lib/validation`

**Token & Payment Security:**
- OAuth tokens encrypted with AES-256-GCM (MANDATORY)
- PaymentIntent IDs NEVER accepted from client — always read from database
- Cron auth: `verifyCronSecret()`. Internal calls: `verifyInternalSecret()`
- Token enumeration prevented via `constantTimeDelay()`
- Server-side 24h confirmation token expiration
- Auto-resend capped at 3 attempts per booking

**Input Sanitization:** `sanitizeString()` for all user-controlled text (business names, display names, settings). `sanitizeForSMS()` for SMS (removes Unicode direction overrides, zero-width chars).

**Headers & CSP:** Strict CSP (no unsafe-eval). HSTS enabled. X-Frame-Options: DENY. Applied via `proxy.ts` (Next.js 16 middleware file — do NOT create `middleware.ts`). `'unsafe-inline'` is present for script-src and style-src — replacing with nonces is a known future improvement (complex due to Next.js hydration + Stripe inline scripts).

### Security Rules
- Never trust client input — all inputs sanitized
- All critical logic server-side
- All secrets via environment variables (never `NEXT_PUBLIC_`)
- Webhook signature verification mandatory
- Rate limiting on all public endpoints (Redis-based)
- GDPR compliance: data export and account deletion with 7-year financial record retention

---

## 9. External Integrations

### Email System (Resend)

**Email Branding:**
- **Starter**: "via Attenda" footer, Attenda branding
- **Pro**: Optional white-label (business name, business logo, remove Attenda branding)

**All templates implemented and wired (complete as of 2026-02-22):**
- Booking Confirmation, Booking Reminder (Pro only), No-Show Receipt, Refund Issued
- Welcome Starter, Welcome Pro, Usage Warning (25/30)
- Account Verified (sent via Stripe `account.updated` webhook)
- Account Restricted (sent via Stripe `account.updated` webhook)
- Reauthorization Required (sent to client when PaymentIntent expires after 7 days)
- Calendar Disconnected (sent on `invalid_grant` / token revocation)
- Payment Failed (sent to business after 3 failed card auth attempts)
- Dispute Created (sent to business via `charge.dispute.created` webhook)

**Refund Issued wiring:** Called in `/api/bookings/[id]/refund` after Stripe refund succeeds. Retrieves card details via `stripe.paymentIntents.retrieve` with `expand: ["payment_method"]`.

**Account Verified/Restricted wiring:** Handled via Stripe `account.updated` webhook (async verification path), NOT in `/api/stripe/connect/return` — the stale TODO comment there is intentional, the webhook is the correct path.

**Email design system:** Indigo brand (#6366f1) for all info/CTA cards. Semantic red for NoShowReceipt, semantic green for RefundIssued, amber for AccountRestricted reason card and PaymentFailed warning card.

### Calendar Integrations

**Google Calendar:** OAuth2 via `googleapis` package. Routes: `/api/google/{connect,callback,status,disconnect,events}`. Library: `lib/googleAuth.ts`.

**Microsoft Outlook Calendar:** OAuth2 via Microsoft Graph API. Routes: `/api/microsoft/{connect,callback,status,disconnect,events}`. Library: `lib/microsoftAuth.ts`. Setup: `docs/MICROSOFT_SETUP.md`.

Both providers use the unified `google_connections` table (with `provider` column) and can be connected simultaneously. Events synced in parallel, merged in dashboard. Google login OAuth and Google Calendar OAuth are **separate apps** — both must be configured.

**CRITICAL — OAuth Route Security:**

| Route type | Session required | Rate limited | Protection |
|-----------|-----------------|--------------|-----------|
| `/connect` | ✅ Yes | ❌ No | Session check (cookie-based) + HMAC-signed state |
| `/status` | ✅ Yes | ❌ No | Session check + UUID validation |
| `/callback` | ❌ No | ❌ No | Verifies OAuth state HMAC signature |
| `/disconnect` | ✅ Yes | Yes | `Authorization: Bearer <token>` header |

**`/connect` and `/status` require session verification** (added 2026-02-21 security audit — second audit fixes also applied same date). `/callback` does NOT — it uses HMAC state and has no session available. Browsers send auth cookies on GET navigation, so `/connect` session check works without Authorization header. **Never add session verification to `/callback`** — the user has no session at that point.

**Disconnect/Reconnect Flow:**
1. Disconnect: API sets `status = 'disconnected'` in `google_connections`
2. Status check: Returns `{ connected: false }` when `status === 'disconnected'` (code comparison, not query filter)
3. Reconnect: OAuth callback MUST set `status = 'connected'` — without this, reconnect silently keeps `'disconnected'` status

**Frontend disconnect pattern (`SettingsContent.tsx`):** Must include `Authorization: Bearer <token>` header AND `credentials: 'include'`, AND check `res.ok` before updating UI state — do not silently ignore 401 errors.

**Event Deletion Sync:** Calendar sync compares current Google/Microsoft events with DB bookings in same time range. Orphaned bookings (deleted from source calendar) are deleted with cascade. Runs on dashboard load + hourly cron.

**`google_connections` table:** Has `status` column (`'connected'` | `'disconnected'`). Migration `006-add-status-column.sql`. Auto-disconnects on `invalid_grant` errors.

### Sentry Monitoring

**Config files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `next.config.ts` (wrapped with `withSentryConfig`, tunnel route at `/monitoring`)

**Key components:** `app/components/SentryMonitoring.tsx` (loads SDK on every page), `app/error.tsx` (global error boundary), `proxy.ts` (excludes `/monitoring` from middleware)

**Dashboard:** https://attenda.sentry.io/issues/?project=4510878977884240

**Notes:**
- Client config uses `typeof window !== "undefined"` guard — `replayIntegration` only runs client-side
- Middleware must exclude `/monitoring` route or Sentry tunnel will fail

---

## 10. Frontend

### Landing Page

Premium DataPulse-inspired design with Framer Motion animations and `prefers-reduced-motion` support.

**Sections:** Header (floating nav), Hero (split layout with animated chart), How It Works (4-step), Features (6-card grid), Dashboard Preview, Use Cases (4 cards), Pricing (3-tier), FAQ (7 questions), Testimonials (3 quotes), Trust Badges, Final CTA, Footer (social links)

**Components** in `app/(landing)/components/`: Header, MobileMenu, ThemeToggle, CookieConsent, Hero, HowItWorks, Features, DashboardPreview, UseCases, FAQ, Testimonials, TrustBadges, FinalCTA

### Blog & SEO

- SEO-optimized articles at `/blog/*` with BlogPosting JSON-LD schema
- Blog index at `/blog` with article cards
- SEO: Google Search Console, Bing, sitemap, robots.txt, llms.txt, dynamic OG images, JSON-LD schemas
- Blog link in: Header nav, hamburger menu, Footer

---

## 11. Database & Configuration

### Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts, plan, Stripe IDs, business info, calendar prefs |
| `google_connections` | Encrypted OAuth tokens, expiry tracking, status |
| `calendar_bookings` | Synced events from calendar, currency |
| `booking_confirmations` | Confirmation tokens, status, PaymentIntent, card auth, currency |
| `no_show_settings` | Global protection rules per user |
| `appointment_no_show_overrides` | Per-event rule overrides |
| `appointment_attendance` | Attendance records (attended/no_show) |
| `stripe_charges` | Audit log for all Stripe operations |
| `stripe_refunds` | All refunds (full/partial), reason tracking |
| `stripe_disputes` | Chargebacks, evidence due dates, status |
| `stripe_webhook_events` | Idempotency log, retry tracking, error logging |
| `payment_authorization_failures` | Failed auth attempts, error codes |

### Notable `profiles` Columns
- `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
- `stripe_account_id`, `stripe_account_status`, `onboarding_completed`
- `business_name`, `business_address`, `business_country`, `business_vat`
- `white_label_enabled`, `business_logo_url` (Pro features)
- `week_start_day`, `time_format`, `timezone`
- `currency` (derived from business_country)
- `deleted_at` (soft delete for GDPR)
- **No `email` column** — get email from `user` object (via `getAuthenticatedUser()`)

### Migrations

All deployed to Supabase (run in SQL Editor):
- `001-stripe-connect.sql` — Stripe Connect fields, business onboarding tables
- `002-webhook-system.sql` — Webhook idempotency, payment failure tracking
- `003-refunds-disputes.sql` — Refund/dispute management tables
- `004-gdpr-compliance.sql` — Data export/deletion, anonymization functions
- `005-enable-rls-policies-SAFE-RERUN.sql` — RLS on all 17 tables
- `006-add-status-column.sql` — `google_connections.status` column
- `007-booking-protections-rls.sql` — RLS on `booking_protections` table (missing from 005; deployed 2026-02-21)

### Environment Variables

Required in `.env.local` (all configured in Vercel):

**Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Google OAuth (Calendar):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Microsoft OAuth (Login + Calendar):** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` (`https://attenda.app/api/microsoft/callback`), `MICROSOFT_TENANT_ID` (`common` for multi-tenant)

**Email:** `RESEND_API_KEY`, `EMAIL_FROM`

**SMS (planned):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER`

**Security:** `CRON_SECRET`, `OAUTH_STATE_SECRET`, `INTERNAL_API_SECRET`, `TOKEN_ENCRYPTION_KEY` (64 hex chars), `ADMIN_EMAILS`

**App:** `NEXT_PUBLIC_APP_URL` (https://attenda.app)

**Stripe:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID_EUR`, `STRIPE_PRO_PRICE_ID_USD`

**Redis:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Sentry:** `SENTRY_AUTH_TOKEN` (for source map uploads)

**Stripe webhook events required:**
- Subscriptions: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Payments: `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed`, `charge.captured`
- Disputes: `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`
- Connect: `account.updated`, `account.external_account.*`, `capability.updated`

---

## 12. Critical Gotchas

### Payment & Security
- **Default no-show fee is €20** (2000 cents) — not €30. Use `DEFAULT_NO_SHOW_FEE_CENTS` constant from `lib/noShowRules.ts`
- **Payment authorization**: Only works after `onboarding_completed = true` (enforced in `/api/stripe/create-authorization`)
- **Confirmation sending**: Only works after `onboarding_completed = true` — enforced at every send path (see Confirmation Flow section). Do NOT add a new send path without this check.
- **Rate limiting**: ALWAYS use `@/lib/rateLimit` (Redis), NEVER `checkRateLimitInMemory_NOT_FOR_PRODUCTION` from `@/lib/validation`
- **Admin routes**: MUST use email whitelist authentication (`ADMIN_EMAILS` env var) — compare with `.toLowerCase()` on both sides
- **Debug/test routes**: MUST return 404 in production to prevent information disclosure
- **PaymentIntent IDs**: NEVER accept from client — always read from database
- **`verifyOrigin()`**: Fails closed in production if `NEXT_PUBLIC_APP_URL` is unset — ensure this env var is always set in Vercel

### Calendar
- **`/connect` and `/status` routes require session auth** — uses cookie-based auth (browsers send cookies on GET navigation). Added 2026-02-21 to prevent OAuth session fixation and IDOR. SettingsContent.tsx MUST include `Authorization: Bearer` header when calling status routes.
- **NEVER add session verification to `/callback`** — the user's browser is in the OAuth redirect, no session is available. HMAC state is the protection there.
- **ALWAYS include auth headers on disconnect calls** — without `Authorization: Bearer <token>`, disconnect returns 401 but UI may still update, leaving DB out of sync
- **Callback MUST set `status: 'connected'`** — otherwise reconnect silently keeps `'disconnected'` status
- **Google OAuth is used twice**: Login (via Supabase Auth) AND Calendar integration (direct OAuth2) — separate apps, both must be configured
- **Query Param Handling**: Settings page useEffects must preserve other query params when clearing their own (e.g., subscription success, upgrade, OAuth callback)
- **`draft_expires_at` must always be set** — all routes that create `calendar_bookings` with `status = 'draft'` must set `draft_expires_at = now + 10 min`. Without it, `lte` filter in `send-draft-confirmation` cron silently skips the booking forever.

### Database
- **`booking_confirmations.currency`** is the source of truth for the currency used in a booking — used in: `confirmation-status` API → `currencyMap` → `EventCard` → `RefundModal`; `confirm/[token]` page + `ConfirmationFlow`; `attendance/mark` no-show receipt email; `bookings/[id]/refund` refund email. Do NOT hardcode `"eur"` or `"€"` anywhere — always derive symbol with `currency.toUpperCase() === "USD" ? "$" : "€"`.
- **`profiles` table has NO `email` column** — get email from `user` object (via `getAuthenticatedUser()`)
- **`appointment_attendance` and `appointment_no_show_overrides`** use `user_id` directly, NOT `booking_id`. RLS policies must use `auth.uid() = user_id`
- **`google_connections` status column**: Check `data.status === 'disconnected'` in code, not as a query filter (more reliable with NULL values from pre-migration rows)

### Development
- **Timezone dates**: Always use `toLocalDateStr()`, never `toISOString().split("T")[0]`
- **FullCalendar**: Use `selectable={true}` + `select` handler, NOT `dateClick` (unreliable in week timegrid)
- **Build testing**: Always run `npm run build` locally before pushing
- **Vercel env vars**: Invisible newline characters when pasting cause cryptic errors. Press End then Backspace after pasting.
- **Next.js 16 `useSearchParams()`**: Must wrap in `<Suspense>` boundary or page will fail static generation
- **Nested directory structure**: NEVER create directories like `app/attenda/app/` — causes duplicate Next.js installations
- **node_modules in Git**: NEVER commit `app/attenda/node_modules/` — check `git status` and selectively stage files

### Styling
- **CSS variables**: `--color-bg` (#0F172A dark) differs from `--color-bg-card` (#1E293B dark) — always use `--color-bg-card` for card backgrounds
- **Dark mode**: via `[data-theme="dark"]` selector. Always check dark mode contrast for colored badges.
- **`<button>` elements**: Must explicitly set `background` and `border` when using as card
- **Sidebar dark mode nav links**: Need explicit `[data-theme="dark"] .sidebar-nav-link` color (#cbd5e1)
- **Settings card spacing**: Consistent padding (18px card, 10px row, 14px gap), font sizes (0.875rem labels, 1rem titles)

### UI/UX
- **DashboardHeader**: Only renders on mobile (<900px) using client-side mount check (prevents flash bug)
- **Skeleton loading states** used in dashboard (not spinner)
- **Calendar day highlight resets** when CreateEventModal closes
- **Scroll-to-top button** appears after 600px scroll
- **Create Event query param**: Dashboard handles `?create=true` to open modal
- **SocialProof section removed** from landing page — Hero floating metrics are separate

### Integrations
- **Google token refresh**: Tokens expire every hour; refresh tokens expire after 6 months inactive. Must handle both.
- **Disputes**: Track `evidence_due_by` dates — business has limited time to submit evidence.
