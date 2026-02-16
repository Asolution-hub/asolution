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

**Key database fields:**
- `stripe_account_id`, `stripe_account_status`, `onboarding_completed`
- `business_name`, `business_address`, `business_vat`, `business_country`
- `currency` ('eur' | 'usd' based on country)

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

### Key Libraries

**Auth & Security:**
- `lib/auth.ts` - verifyUserAccess, verifyCronSecret, verifyInternalSecret, verifyOrigin
- `lib/validation.ts` - UUID/input validation, rate limiting, sanitization, timing protection
- `lib/encryption.ts` - AES-256-GCM token encryption

**Integrations:**
- `lib/googleAuth.ts` - OAuth2 client with encrypted token storage
- `lib/stripe.ts` - Stripe Connect helpers
- `lib/email.ts` - Resend email sender
- `lib/sms.ts` - Twilio SMS (planned)

**Business Logic:**
- `lib/noShowRules.ts` - Resolves global + per-appointment rule overrides
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

**✅ Running on cron-job.org (Free Tier)** - Configured Feb 15, 2026

All 6 cron jobs configured with optimal frequencies for real-time SaaS experience.

**Jobs:**
1. **send-draft-confirmation** (`/api/cron/send-draft-confirmation`)
   - **Schedule**: Every 30 minutes (`*/30 * * * *`)
   - Sends confirmations ONLY after 10-minute draft window expires
   - Manual "Send Now" button bypasses draft window
   - Respects Starter 30/month limit
   - 48 executions/day

2. **send-reminders** (`/api/cron/send-reminders`)
   - **Schedule**: Every hour (`0 * * * *`)
   - Sends reminders for appointments in next 24 hours
   - "Tomorrow's schedule" style (not "1 hour before")
   - Pro users only, skips if reminder already sent
   - 24 executions/day

3. **sync-calendar** (`/api/cron/sync-calendar`)
   - **Schedule**: Every hour (`0 * * * *`)
   - Syncs Google/Microsoft calendars for all connected users
   - Fetches events from last 24h and next 7 days
   - Also syncs on-demand when dashboard loads
   - 24 executions/day

4. **check-expiring-authorizations** (`/api/cron/check-expiring-authorizations`)
   - **Schedule**: Every 6 hours (`0 */6 * * *`)
   - Renews PaymentIntents expiring within 24 hours
   - PaymentIntents expire after 7 days
   - Critical for bookings >7 days away
   - 4 executions/day

5. **check-usage** (`/api/cron/check-usage`)
   - **Schedule**: Daily at 09:00 UTC (`0 9 * * *`)
   - Warns Starter users at 25/30 appointments
   - Once per month warning limit
   - Email notification sent via Resend
   - 1 execution/day

6. **auto-confirm** (`/api/cron/auto-confirm`)
   - **Schedule**: Daily at 17:00 UTC (`0 17 * * *`)
   - Currently disabled in code (replaced by draft flow)
   - 1 execution/day

**Total**: ~102 executions/day (vs 6/day with Vercel free tier = 17x improvement)

**Security:** All cron routes require `Authorization: Bearer <CRON_SECRET>` header.

**Monitoring:** Email notifications configured for:
- Execution failures (immediate alert)
- Recovery after failure (confirmation)
- Auto-disable warning (critical alert)

**Configuration Docs:**
- `CRON_SETUP_GUIDE.md` - Complete setup instructions
- `CRON_QUICK_REFERENCE.md` - Copy-paste values for cron-job.org
- `CRON_VERIFICATION_CHECKLIST.md` - Testing and monitoring guide

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

- **Starter**: Global protection rules only, cannot edit per booking
- **Pro**: Can override protection rules per booking
- **Important**: Overrides locked once confirmation is sent

### Confirmation Flow

Sent automatically (after draft window) or manually (dashboard button). Creates `booking_confirmation` record, generates unique token, sends email/SMS.

**Confirmation message must include:** Event details, no-show fee, cancellation window, "Your card will be authorized, not charged", Stripe authorization link (Card/Apple Pay/Google Pay).

### Stripe Authorization (Customer Side)

PaymentIntent created **on business's connected account**, authorization only — no funds captured. Supported: Card, Apple Pay, Google Pay. Failed attempts tracked, business notified after 3 failures.

**PaymentIntent expiration:**
- PIs expire after 7 days
- Cron job monitors expiring authorizations
- Auto-renew if appointment still upcoming
- Notify client to re-authorize if needed

### Event Day Logic

**Before event start:** No attendance actions allowed.

**After event start:**

| Action | Result |
|--------|--------|
| Mark attended | Authorization released, no charge |
| Mark no-show | No-show fee captured via Stripe, money goes to business bank, receipt sent |

**Past events:** No action buttons, only final state displayed.

### Refunds & Disputes

**Refunds:**
- Business can issue full/partial refund via "Issue Refund" button
- Tracked in `stripe_refunds` table
- Client notified via email

**Disputes/Chargebacks:**
- Tracked in `stripe_disputes` table
- Business notified immediately
- Evidence due date tracked
- Dashboard shows active disputes with links to Stripe Dashboard

---

## 7. Dashboard

### Navigation

- **Sidebar** (desktop >=900px): Redesigned with premium aesthetic
  - Expanded: 260px, collapsed: 72px (state in localStorage)
  - Logo: Gradient icon matching landing page
  - Account card: Avatar, display name, Pro badge, email
  - Create Event button, Usage counter (Starter), Navigation, Upgrade button (Starter)
  - Theme toggle, Log out, Help center, Collapse toggle

- **Mobile (<900px)**: Sidebar hidden, `DashboardHeader` conditionally rendered only after client-side mount check
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
- **Login Providers:**
  - Magic link (email)
  - Google OAuth (Supabase Google provider) ✅
  - Microsoft OAuth (Supabase Azure provider) ✅
- **Calendar OAuth:** Google Calendar and Microsoft Outlook Calendar OAuth for calendar integration (separate from login OAuth apps, token refresh and expiry tracking implemented) ✅
- Session management via Supabase cookies
- Admin routes protected by email whitelist

### Security Architecture

**✅ Production Hardened (Feb 13, 2026)** - Comprehensive security audit completed and all critical/high-priority vulnerabilities fixed.

**Row Level Security (RLS):** All 17 tables protected with user-scoped RLS policies using `auth.uid()`. Users can only access their own data. Migration: `migrations/005-enable-rls-policies-SAFE-RERUN.sql` (deployed Feb 13, 2026). Core tables: profiles, calendar_bookings, booking_confirmations, google_connections, no_show_settings, appointment_no_show_overrides, appointment_attendance, clients. New tables: stripe_refunds, stripe_disputes, user_data_exports, account_deletions, plus 5 service-role-only tables.

**API Route Protection:**
- **Admin Routes**: Email whitelist authentication required (`/api/admin/reconcile`, `/api/admin/webhooks`)
- **User Routes**: `verifyUserAccess()` validates authentication + user ownership
- **OAuth Connect Routes**: No session verification - HMAC-signed OAuth state provides CSRF protection (`/api/google/connect`, `/api/microsoft/connect`)
- **OAuth Status Routes**: No session verification - protected by UUID validation + rate limiting + database RLS (`/api/google/status`, `/api/microsoft/status`)
- **Debug Endpoints**: Return 404 in production (`/api/debug-auth`, `/api/sentry-test-error`)
- **Health Endpoint**: Detailed metrics restricted to admin users only
- **CSRF Protection**: `verifyOrigin()` on ALL state-changing POST endpoints
- **UUID Validation**: All route parameters validated with `isValidUUID()`
- **Confirmation Page**: Server-side UUID validation on token parameter

**Rate Limiting (Redis-based via Upstash):**
- **✅ Migration Complete**: All 37 API routes migrated from ineffective in-memory to Redis-based rate limiting (Feb 13, 2026)
- **Confirmation endpoints**: 10 req/min (`confirmation` limiter)
- **Stripe operations**: 20 req/min (`stripe` limiter)
- **Refund operations**: 5 req/min (`refund` limiter)
- **General API**: 60 req/min (`api` limiter)
- **Auth endpoints**: 5 req/min (`auth` limiter)
- **Webhooks**: 100 req/min (`webhook` limiter)
- **Critical**: In-memory rate limiting is ineffective in serverless environments (each function instance has separate memory)

**Default Values (Centralized):**
- **No-show fee**: `DEFAULT_NO_SHOW_FEE_CENTS = 2000` (€20.00 / $20.00) in `lib/noShowRules.ts`
- **Grace period**: `DEFAULT_GRACE_PERIOD_MINUTES = 10`
- **Late cancel**: `DEFAULT_LATE_CANCEL_HOURS = 24`
- All routes use these constants (no hardcoded values)

**Token Security:** OAuth tokens encrypted with AES-256-GCM (MANDATORY). Cron jobs via `verifyCronSecret()`. Internal calls via `verifyInternalSecret()`. Token enumeration prevented via `constantTimeDelay()`. Server-side 24h confirmation token expiration.

**Payment Security:** PaymentIntent IDs NEVER accepted from client — always read from database. All payments go through connected accounts. Stripe error details not exposed. Auto-resend capped at 3 attempts per booking. Failed authorization attempts tracked.

**Input Sanitization:** `sanitizeString()` for all user-controlled text (business names, display names, settings). `sanitizeForSMS()` for SMS (removes Unicode direction overrides, zero-width chars).

**Production Hardening:** Test endpoints return 404 in production. `devLog()` suppresses sensitive logging. SMS mock returns failure in production. Cron routes POST-only with secret auth. Webhook idempotency via `stripe_webhook_events` table using atomic INSERT operations.

**Headers & CSP:** Security headers in `middleware.ts`. Strict CSP (no unsafe-eval). HSTS enabled. X-Frame-Options: DENY. TODO: Replace 'unsafe-inline' with nonces.

### Security Rules
- Never trust client input - all inputs sanitized
- All critical logic server-side
- All secrets via environment variables (never NEXT_PUBLIC_)
- Calendar data isolated per user via RLS policies
- Webhook signature verification mandatory
- Rate limiting on all public endpoints (Redis-based)
- GDPR compliance: data export and account deletion with 7-year financial record retention

### Key Security Files
- `lib/auth.ts` - Authentication, authorization, CSRF, OAuth state
- `lib/validation.ts` - Input validation, rate limiting, sanitization, timing protection
- `lib/encryption.ts` - Token encryption utilities
- `lib/rateLimit.ts` - Redis-based rate limiting (Upstash)
- `middleware.ts` - Security headers, CSP, admin auth

---

## 9. External Integrations

### Email System (Resend)

**Email Branding:**
- **Starter**: "via Attenda" footer, Attenda branding
- **Pro**: Optional white-label (business name, business logo, remove Attenda branding)

**Implemented Templates:**
- Booking Confirmation, Booking Reminder (Pro only)
- No-Show Receipt, Refund Issued
- Welcome Starter, Welcome Pro, Usage Warning (25/30)

**Planned Templates:**
- Account Verified, Account Restricted, Dispute Created
- Calendar Disconnected, Reauthorization Required, Payment Failed

**Cron jobs** (`/api/cron/*`): Routes use POST with `CRON_SECRET` auth. Need external scheduler (Vercel Hobby plan limitation).

### Calendar Integrations

**✅ Fully Implemented:**
- **Google Calendar**: OAuth2 with token refresh, expiry tracking, full CRUD operations
  - Routes: `/api/google/connect`, `/callback`, `/status`, `/disconnect`, `/events`
  - Library: Native Google APIs client (`googleapis` package)
  - Settings UI: Connect/Disconnect with status indicator

- **Microsoft Outlook Calendar**: OAuth2 with Microsoft Graph API, token refresh, full CRUD operations
  - Routes: `/api/microsoft/connect`, `/callback`, `/status`, `/disconnect`, `/events`
  - Library: `lib/microsoftAuth.ts` (Microsoft Graph API client)
  - Settings UI: Connect/Disconnect with status indicator
  - Setup guide: `docs/MICROSOFT_SETUP.md` (Azure Entra ID configuration)

**Security Architecture:**
- **OAuth Connect Routes** (`/api/google/connect`, `/api/microsoft/connect`):
  - ✅ **No session verification** - HMAC-signed OAuth state parameter provides CSRF protection
  - State parameter cryptographically signed with `OAUTH_STATE_SECRET`
  - Callback route verifies state signature to ensure legitimate user initiated the flow
  - **IMPORTANT**: Session verification was incorrectly added during security audit (Feb 13) and has been removed
- **OAuth Status Routes** (`/api/google/status`, `/api/microsoft/status`):
  - ✅ **No session verification OR rate limiting** - protected by UUID validation + database RLS policies only
  - Using `supabaseAdmin` with RLS policies ensures users can only see their own connections
  - **IMPORTANT**: Redis rate limiting removed (Feb 16) - not needed for read-only status checks, causes warnings if Redis not configured
  - **IMPORTANT**: Session verification breaks status checks and was removed (Feb 13)
- **OAuth Callback Routes** (`/api/google/callback`, `/api/microsoft/callback`):
  - Verify OAuth state signature (prevents CSRF attacks)
  - Extract userId from verified state parameter
  - Set `status: "connected"` when creating/updating connection (critical for disconnect/reconnect flow)
  - Encrypt tokens with AES-256-GCM before storing in database
- **OAuth Disconnect Routes** (`/api/google/disconnect`, `/api/microsoft/disconnect`):
  - ✅ **Requires authentication** - MUST include `Authorization: Bearer <token>` header
  - Soft delete: Sets `status: "disconnected"` (does NOT delete row)
  - Frontend MUST get Supabase session and include auth headers (see Settings page pattern)
  - Frontend MUST check response status before updating UI state

**Data Architecture:**
- Provider-agnostic design using unified `google_connections` table with `provider` column
- Both Google and Microsoft can be connected simultaneously
- Events synced in parallel from both providers, merged in dashboard calendar view
- **Status column**: `'connected'` (active) or `'disconnected'` (soft deleted) - added in migration 006
- Auto-disconnect on `invalid_grant` errors
- Token encryption with AES-256-GCM before database storage (MANDATORY)

**Disconnect/Reconnect Flow (CRITICAL):**
1. **Disconnect**: User clicks "Disconnect" → API sets `status = 'disconnected'` → UI updates to "Connect"
2. **Status Check**: `/api/google/status` fetches row, checks if `status === 'disconnected'`, returns `{ connected: false }`
3. **Reconnect**: User clicks "Connect" → OAuth flow → callback sets `status = 'connected'` → UI shows "Connected"
4. **Common Bug**: If disconnect API doesn't include auth headers, returns 401 Unauthorized but UI still updates (silent error)
5. **Fix**: Always include auth headers from Supabase session in disconnect calls (see SettingsContent.tsx pattern)

**Event Deletion Sync:**
- Google/Microsoft events route fetches current calendar events
- Compares with existing Attenda bookings in same time range
- Deletes orphaned bookings that no longer exist in calendar
- Handles cascade deletes for confirmations, attendance, protections
- Sync runs on dashboard load + hourly cron job

**Planned:** Apple Calendar integration

### Sentry Monitoring

**✅ Fully Implemented and Production-Ready**

**Configuration Files:**
- `sentry.client.config.ts` - Client-side error tracking with Session Replay
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking
- `instrumentation.ts` - Loads server/edge configs automatically
- `next.config.ts` - Wrapped with `withSentryConfig`, tunnel route at `/monitoring`

**Key Components:**
- `app/components/SentryMonitoring.tsx` - Ensures client SDK loads on every page, exposes `window.Sentry` globally
- `app/error.tsx` - Global error boundary that captures React errors
- `proxy.ts` - Middleware excludes `/monitoring` route to allow Sentry tunnel

**Features:**
- ✅ Automatic error capture (client, server, edge)
- ✅ Session Replay (100% on errors, 10% on normal sessions)
- ✅ Tunnel route (`/monitoring`) bypasses ad-blockers
- ✅ Source maps uploaded automatically in CI
- ✅ Performance monitoring (tracesSampleRate: 1.0)
- ✅ Tree-shaking removes debug logging in production

**Testing:**
```javascript
// From browser console on attenda.app
window.Sentry.captureMessage('Test message', 'error');
throw new Error('Test error - ' + Date.now());
```

**Dashboard:** https://attenda.sentry.io/issues/?project=4510878977884240

**Important Notes:**
- Client config wrapped in `typeof window !== "undefined"` guard to prevent server-side execution
- `replayIntegration` only available on client (not server/edge)
- Middleware must exclude `/monitoring` or tunnel will fail
- All errors appear in dashboard within 5 seconds

---

## 10. Frontend

### Landing Page

Premium DataPulse-inspired design with Framer Motion animations and `prefers-reduced-motion` support.

**Sections:** Header (floating nav), Hero (split layout with animated chart), How It Works (4-step), Features (6-card grid), Dashboard Preview, Use Cases (4 cards), Pricing (3-tier), FAQ (7 questions), Testimonials (3 quotes), Trust Badges, Final CTA, Footer (social links)

**Components** in `app/(landing)/components/`: Header, MobileMenu, ThemeToggle, CookieConsent, Hero, HowItWorks, Features, DashboardPreview, UseCases, FAQ, Testimonials, TrustBadges, FinalCTA

### Blog & SEO

- 9 SEO-optimized articles at `/blog/*` with BlogPosting JSON-LD schema
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

### Notable `profiles` columns
- `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
- `stripe_account_id`, `stripe_account_status`, `onboarding_completed`
- `business_name`, `business_address`, `business_country`, `business_vat`
- `white_label_enabled`, `business_logo_url` (Pro features)
- `week_start_day`, `time_format`, `timezone`
- `currency` (derived from business_country)
- `deleted_at` (soft delete for GDPR)
- **No `email` column** — get email from `user` object

### Migrations (run in Supabase SQL Editor)

**✅ Deployed (Feb 13, 2026):**
- `001-stripe-connect.sql` - Stripe Connect fields, business onboarding tables
- `002-webhook-system.sql` - Webhook idempotency, payment failure tracking
- `003-refunds-disputes.sql` - Refund/dispute management tables
- `004-gdpr-compliance.sql` - Data export/deletion, anonymization functions
- `005-enable-rls-policies-SAFE-RERUN.sql` - RLS on all 17 tables (8 core + 9 new)

**Database Status:**
- ✅ 17 tables with Row Level Security enabled
- ✅ Stripe Connect columns in `profiles` table
- ✅ Multi-currency support (EUR/USD)
- ✅ GDPR compliance (export/delete/anonymize)
- ✅ Webhook idempotency system
- ✅ Dispute/refund tracking

### Environment Variables

Required in `.env.local` (all configured in Vercel):

**Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Google OAuth (Calendar):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Microsoft OAuth (Login + Calendar):**
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` - Also configured in Supabase Azure provider for login
- `MICROSOFT_REDIRECT_URI` - For calendar integration: `https://attenda.app/api/microsoft/callback`
- `MICROSOFT_TENANT_ID` - Set to `common` for multi-tenant support
- **Note:** Login via Supabase Azure provider works. Calendar connect API routes exist but auth check fails.

**Email:** `RESEND_API_KEY`, `EMAIL_FROM`

**SMS (planned):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER`

**Security:** `CRON_SECRET`, `OAUTH_STATE_SECRET`, `INTERNAL_API_SECRET`, `TOKEN_ENCRYPTION_KEY` (64 hex chars), `ADMIN_EMAILS`

**App:** `NEXT_PUBLIC_APP_URL` (https://attenda.app)

**Stripe:**
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID_EUR`, `STRIPE_PRO_PRICE_ID_USD`

**Redis:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Sentry:** `SENTRY_AUTH_TOKEN` (for source map uploads)

**Stripe webhook events required:**
- Subscriptions: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Payments: `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed`, `charge.captured`
- Disputes: `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`
- Connect: `account.updated`, `account.external_account.*`, `capability.updated`

---

## 12. Production Status & Roadmap

### ✅ Implemented
- Dashboard UI (calendar, events, settings)
- **Calendar integrations:** Google Calendar + Microsoft Outlook Calendar (OAuth2, token refresh, parallel sync)
- **Stripe Connect:** Full implementation (onboarding, verification, connected accounts, webhook handlers)
- **Business registration:** Complete flow with OnboardingBanner UI (pending/restricted/verified states)
- **Payment flow:** PaymentIntents use `on_behalf_of` and `transfer_data` (money goes to business, not platform)
- **Database migrations:** All 4 production migrations deployed + RLS policies on 17 tables
- **Backend systems:** 6 cron routes (running daily on Vercel free tier), dispute/refund handlers, GDPR endpoints, admin reconciliation
- **Cron jobs:** ✅ LIVE - 5 jobs running daily at 17:00 UTC (send-draft-confirmation, send-reminders, sync-calendar, check-usage, check-expiring-authorizations)
- Email confirmations via Resend
- Stripe subscriptions (Starter/Pro)
- Multi-currency support (EUR/USD)
- Dark/light mode
- Landing page + blog
- **Security hardening:** RLS on all tables, Redis rate limiting, webhook idempotency, input sanitization, CSRF protection, admin auth
- **Sentry monitoring:** ✅ PRODUCTION-READY - Full error tracking (client, server, edge), tunnel route configured, global error boundary, Session Replay enabled

### 🔴 CRITICAL - Blocking Launch

| Feature | Status |
|---------|--------|
| **Cron scheduler** | ✅ DONE (Feb 15, 2026) - 6 jobs running on cron-job.org with optimal frequencies |
| **Dispute/refund UI** | ✅ DONE (Feb 13, 2026) - Modal with active disputes, evidence deadlines, past disputes summary |

### 🟡 High Priority (Post-Launch Week 1)

| Feature | Status |
|---------|--------|
| **Test end-to-end payment flow** | Need real Stripe Connect account test |
| **Email deliverability tracking** | Resend webhooks for bounces/complaints |
| **Admin dashboard** | Webhook logs, system health, user management |
| **Stripe Connect edge cases** | Account restricted, payout failures, re-verification |

### 🟢 Medium Priority

| Feature | Status |
|---------|--------|
| SMS implementation (Twilio) | 40% complete - backend ready, need Twilio setup |
| Timezone support | Planned |
| White-label emails (Pro) | Planned |
| Business plan tier | Schema ready, UI not exposed |

### Launch Readiness: ~98% Complete

**Recent Updates (Feb 15, 2026):**
- ✅ Cron jobs migrated to cron-job.org with optimal frequencies (17x improvement)
- ✅ Draft window logic fixed (10-minute grace period before auto-send)
- ✅ All 6 cron jobs tested and operational
- ✅ Email notifications configured for cron failures
- ✅ Database migrations completed (reminder_sent_at, usage_warning_sent_at, booking_confirmations columns)

**Previous Updates (Feb 13, 2026):**
- ✅ Sentry monitoring fully implemented and tested (client + server + edge)
- ✅ Dispute/refund UI completed in dashboard
- ✅ Opengraph images fixed (display flex errors resolved)

**Ready to launch** after:
1. ✅ Database migrations deployed (DONE - Feb 15, 2026)
2. ✅ Set up cron scheduler (DONE - Feb 15, 2026) - cron-job.org configured
3. ✅ Configure Sentry monitoring (DONE - Feb 13, 2026)
4. ⏳ Test complete payment flow with test connected account
5. ✅ Add basic dispute/refund UI (DONE - Feb 13, 2026)

**Cron Jobs (Running on cron-job.org):**
- ✅ send-draft-confirmation - Every 30 min (48x/day) - sends after 10-min draft window
- ✅ send-reminders - Every hour (24x/day) - Pro users only
- ✅ sync-calendar - Every hour (24x/day) - keeps events up-to-date
- ✅ check-expiring-authorizations - Every 6 hours (4x/day) - prevents PaymentIntent expiry
- ✅ check-usage - Daily at 09:00 UTC (1x/day) - warns Starter users at 25/30
- ✅ auto-confirm - Daily at 17:00 UTC (1x/day) - disabled in code (legacy)

---

## 13. Critical Gotchas

### Payment & Security
- **Default no-show fee is €20** (2000 cents) — not €30. Use `DEFAULT_NO_SHOW_FEE_CENTS` constant from `lib/noShowRules.ts`
- **Connected accounts**: PaymentIntents correctly use `on_behalf_of` and `transfer_data` (verified in `/api/stripe/create-authorization`)
- **Stripe Connect flow**: User → onboarding → pending → enabled (tracked in `OnboardingBanner` component)
- **Payment authorization**: Only works after `onboarding_completed = true` (enforced in create-authorization route)
- **Rate limiting**: ALWAYS use Redis-based rate limiting from `@/lib/rateLimit`, NEVER in-memory from `@/lib/validation` (ineffective in serverless)
- **Admin routes**: MUST use email whitelist authentication (`ADMIN_EMAILS` env var)
- **Debug/test routes**: MUST return 404 in production to prevent information disclosure

### Calendar Integration Implementation Notes
- **Microsoft Login**: ✅ WORKING - Users can log in via Supabase Azure provider
- **Microsoft Calendar**: ✅ WORKING - Full OAuth2 integration with Microsoft Graph API
- **Google Calendar**: ✅ WORKING - Full OAuth2 integration with Google APIs
- **✅ CRITICAL - Connect Routes**: NEVER add session verification to `/api/google/connect` or `/api/microsoft/connect`
  - OAuth state parameter (HMAC-signed) provides CSRF protection
  - Session verification breaks the OAuth flow (incorrectly added Feb 13, removed same day)
  - Callback route verifies state signature to ensure legitimate user initiated flow
- **✅ CRITICAL - Status Routes**: NEVER add session verification OR rate limiting to `/api/google/status` or `/api/microsoft/status`
  - Protected by: UUID validation + database RLS policies ONLY
  - **Redis rate limiting removed** (Feb 16) - causes "Redis not configured" warnings and is unnecessary for read-only status checks
  - Session verification breaks status checks and prevents "Connected" badge from showing
  - Using `supabaseAdmin` with RLS ensures users can only see their own connections
- **✅ CRITICAL - Disconnect Routes**: `/api/google/disconnect` and `/api/microsoft/disconnect` REQUIRE authentication
  - MUST include `Authorization: Bearer <token>` header from Supabase session
  - MUST include `credentials: 'include'` in fetch options
  - Frontend MUST check `res.ok` before updating UI state (don't silently ignore errors)
  - Common bug: Calling disconnect without auth headers → 401 Unauthorized → UI shows disconnected but DB not updated
  - See `SettingsContent.tsx` disconnect handlers for correct pattern
- **✅ CRITICAL - Callback Routes**: MUST set `status: 'connected'` when creating/updating connection
  - Without this, reconnecting a disconnected calendar keeps `status: 'disconnected'` → status check fails
  - Migration 006 added `status` column with default `'connected'`
- **✅ CRITICAL - Status Column**: `google_connections` table has `status` column (`'connected'` or `'disconnected'`)
  - Run migration `006-add-status-column.sql` in Supabase if not already done
  - Status routes check `if (data.status === 'disconnected')` in code, not query filter (more reliable with NULL values)
- **✅ CRITICAL - Event Deletion Sync**: Calendar sync routes delete orphaned Attenda bookings
  - Fetches current Google/Microsoft events, compares with DB bookings in same time range
  - Deletes bookings for events no longer in calendar (handles cascade deletes)
  - Without this, deleting events in Google Calendar leaves them in Attenda dashboard
- **Query Param Handling**: Settings page useEffects must preserve other query params when clearing their own (e.g., subscription success, upgrade, OAuth callback)
- **PaymentIntent expiry**: Auth expires after 7 days, must renew for bookings >7 days away
- **Multi-currency**: Always store currency with amount. Display correct symbol based on user's country.

### Database
- **`profiles` table has NO `email` column** — get email from `user` object (via `getAuthenticatedUser()`)
- **RLS Migration**: `005-enable-rls-policies-SAFE-RERUN.sql` covers all 17 tables (deployed Feb 13, 2026)
- **`appointment_attendance` and `appointment_no_show_overrides`** use `user_id` directly, NOT `booking_id`. RLS policies must use `auth.uid() = user_id`
- **`google_connections` status column**: Added in migration 006 (Feb 16, 2026) - tracks `'connected'` or `'disconnected'` state for calendar connections
- **Migrations deployed:** 001-stripe-connect, 002-webhook-system, 003-refunds-disputes, 004-gdpr-compliance, 005-enable-rls-policies-SAFE-RERUN, 006-add-status-column

### Development
- **Timezone dates**: Always use `toLocalDateStr()`, never `toISOString().split("T")[0]`
- **FullCalendar**: Use `selectable={true}` + `select` handler, NOT `dateClick` (unreliable in week timegrid)
- **Build testing**: Always run `npm run build` locally before pushing
- **Vercel env vars**: Invisible newline characters when pasting cause cryptic errors. Press End then Backspace after pasting.
- **Next.js 16 `useSearchParams()`**: Must wrap in `<Suspense>` boundary or page will fail static generation
- **Nested directory structure**: NEVER create directories like `app/attenda/app/` - causes duplicate Next.js installations
- **node_modules in Git**: NEVER commit `app/attenda/node_modules/` - check `git status` and selectively stage files

### Styling
- **CSS variables**: `--color-bg` (#0F172A dark) differs from `--color-bg-card` (#1E293B dark) — always use `--color-bg-card` for card backgrounds
- **Dark mode**: via `[data-theme="dark"]` selector. Always check dark mode contrast for colored badges.
- **`<button>` elements**: Must explicitly set `background` and `border` when using as card
- **Sidebar dark mode nav links**: Need explicit `[data-theme="dark"] .sidebar-nav-link` color (#cbd5e1)
- **Sidebar logo**: Must have gradient background matching landing page header logo (32px × 32px)
- **Settings card spacing**: Consistent padding (18px card, 10px row, 14px gap), font sizes (0.875rem labels, 1rem titles)

### UI/UX
- **DashboardHeader**: Only renders on mobile (<900px) using client-side mount check (prevents flash bug)
- **Skeleton loading states** used in dashboard (not spinner)
- **Calendar day highlight resets** when CreateEventModal closes
- **Scroll-to-top button** appears after 600px scroll
- **Create Event query param**: Dashboard handles `?create=true` to open modal
- **SocialProof section removed** from landing page — Hero floating metrics are separate

### Integrations
- **Google token refresh**: Tokens expire every hour, refresh tokens expire after 6 months inactive. Must handle both.
- **Google OAuth used twice**: Login (via Supabase Auth) + Calendar (direct OAuth2)
- **Disputes**: Business has limited time to respond with evidence. Track `evidence_due_by` dates.
