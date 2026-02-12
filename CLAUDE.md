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

**Design principles**: Premium, Calm, Trustworthy, Modern

**Design system**:
- Colors: Indigo primary (`#6366F1`), Teal accent (`#14B8A6`)
- Typography: Inter font (weights 400-800)
- Style: DataPulse-inspired SaaS analytics aesthetic

**UI/UX rules**: Premium, minimal, calm. No clutter. Starter feels complete but limited. Pro feels clearly more powerful. Visual affordances for Pro-only features.

---

## 2. Core Value Proposition & Payment Flow (NON-NEGOTIABLE)

Businesses lose money because customers don't show up. Attenda solves this with booking confirmations, clear no-show rules, **Stripe Connect**, card authorization, and charging **only** if the business manually confirms a no-show.

### Critical Payment Architecture (Stripe Connect)

**Money Flow:**
1. Business registers with Stripe Connect (Standard connected account)
2. Client authorizes card → PaymentIntent created **on business's connected account**
3. No-show happens → Business clicks "Mark no-show" → Money goes **directly to business's bank account**
4. Attenda takes platform fee (2-5% or subscription)

**Why Stripe Connect is mandatory:**
- Attenda cannot hold business revenue (illegal, not scalable)
- Stripe handles: payouts, tax reporting, compliance, KYC
- Businesses must complete onboarding before creating events
- Standard marketplace model (like Airbnb, Uber, Shopify)

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

**Database fields:**
- `stripe_account_id` - Connected account ID
- `stripe_account_status` - 'pending' | 'enabled' | 'restricted' | 'disabled'
- `onboarding_completed` - Must be true to send confirmations
- `business_name`, `business_address`, `business_vat`, `business_country`
- `currency` - 'eur' | 'usd' (based on country)

---

## 3. Commands

All commands run from `/App/attenda/`:

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

---

## 4. Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database/Auth**: Supabase (PostgreSQL + magic link auth + Google OAuth login)
- **Payments**: Stripe Connect (Standard accounts) + Subscriptions + Card authorization
- **External APIs**: Google Calendar (OAuth2), Resend (email), Twilio (SMS - to be implemented)
- **Path alias**: `@/*` maps to project root

---

## 5. Architecture

### Directory Structure

```
App/attenda/
├── app/
│   ├── api/              # API route handlers
│   │   ├── stripe/       # Stripe endpoints (checkout, webhooks, portal, connect)
│   │   ├── bookings/     # Booking management, refunds
│   │   └── auth/         # Authentication endpoints
│   ├── dashboard/        # Protected dashboard (main UI)
│   ├── onboarding/       # Business registration flow (Stripe Connect)
│   ├── login/            # Magic link authentication
│   ├── confirm/[token]/  # Public client confirmation page (Stripe Payment Element)
│   ├── welcome/          # Post-checkout welcome page for new Pro users
│   ├── admin/            # Internal admin tools (webhook reconciliation, monitoring)
│   ├── (landing)/components/  # Landing page components
│   └── components/       # Shared React components
├── lib/                  # Utilities and helpers
├── emails/               # React Email templates
├── migrations/           # SQL migrations for Supabase
└── docs/                 # Implementation plans, PRD
```

### Key Libraries

- `lib/supabase.ts` / `lib/supabaseAdmin.ts` - Client vs admin Supabase instances
- `lib/auth.ts` - Authentication helpers (verifyUserAccess, verifyCronSecret, verifyInternalSecret, verifyOrigin)
- `lib/validation.ts` - Input validation (UUID, calendarEventId), rate limiting, sanitization, timing protection
- `lib/encryption.ts` - AES-256-GCM token encryption for OAuth tokens
- `lib/googleAuth.ts` - OAuth2 client with encrypted token storage
- `lib/stripe.ts` - Stripe Connect helpers (onboarding, payouts, connected accounts)
- `lib/noShowRules.ts` - Resolves global + per-appointment rule overrides
- `lib/contactParser.ts` - Extracts email/phone from event text
- `lib/email.ts` - Email sending via Resend
- `lib/sms.ts` - SMS sending via Twilio (to be implemented)
- `lib/useUser.ts` - React hook for auth state
- `lib/plans.ts` - Plan configuration (Starter/Pro/Business) with Stripe price IDs
- `lib/currency.ts` - Multi-currency support (EUR/USD)
- `lib/types.ts` - Shared TypeScript types

### Key API Routes

**Stripe Connect:**
- `app/api/stripe/connect/onboard` - Create connected account + onboarding link
- `app/api/stripe/connect/return` - Handle onboarding completion
- `app/api/stripe/connect/status` - Check account status
- `app/api/stripe/connect/dashboard` - Generate Express Dashboard link
- `app/api/stripe/connect/webhook` - Handle Connect-specific webhooks

**Payments:**
- `app/api/stripe/create-checkout` - Pro checkout for logged-in users
- `app/api/stripe/create-checkout-guest` - Pro checkout for new users (no auth)
- `app/api/stripe/create-authorization` - Card authorization (on connected account)
- `app/api/stripe/customer-portal` - Stripe billing portal redirect
- `app/api/stripe/webhook` - Handles all Stripe webhook events (idempotent)

**Bookings:**
- `app/api/bookings/[id]/refund` - Issue full/partial refund
- `app/api/no-show/settings` - GET (auto-creates defaults if missing)
- `app/api/no-show/override` - Per-event protection overrides
- `app/api/events/list` - Google + manual events

**Admin:**
- `app/api/admin/reconcile` - Compare Stripe vs DB for mismatches
- `app/api/admin/webhooks` - View/retry failed webhooks
- `app/api/health` - Health check endpoint for monitoring

**User:**
- `app/api/profile/settings` - PATCH for calendar preferences, business settings
- `app/api/profile/export` - GDPR data export (JSON)
- `app/api/profile/delete` - Account deletion (anonymize data, cancel subscriptions)

---

## 6. Plans, Pricing & Limits

### Starter (Free)
- Max 30 protected appointments per month
- Email confirmations only
- Automatic confirmation after draft window
- No auto-resend
- Limited settings
- Upgrade CTA visible everywhere
- When limit reached: no confirmations sent, UI shows "Protection not applied — monthly limit reached"
- Dashboard counter: "Protection used this month: X / 30"
- At 25/30: upgrade encouragement email sent
- Email branding: "via Attenda" footer

### Pro (€39 / $39 per month)
- Unlimited appointments
- Email + SMS confirmations (SMS to be implemented)
- Auto-resend available
- Per-appointment protection rules
- White-label email option (remove Attenda branding, use business logo)
- Priority UX / visual polish
- Access to Stripe Express Dashboard

### Business
- Not available yet — code should anticipate it without exposing UI
- Planned: Multi-user accounts, API access, custom integrations

### Pricing Rules
- EU countries → EUR, rest of world → USD
- Numeric price stays the same (39)
- Currency stored per booking
- Display correct symbol in UI

### Pro Signup Flows

| From | Flow |
|------|------|
| Landing page (new user) | Get Pro → Stripe Checkout → `/welcome` page → Magic link email → Business onboarding → Dashboard |
| Dashboard (existing user) | Upgrade to Pro → Stripe Checkout → Settings page with success message |

---

## 7. Event & Booking Lifecycle

### Statuses

**Confirmation**: `draft` → `pending` → `confirmed` | `expired`
**Attendance**: `pending` → `attended` | `no_show`

### Calendar Event Ingestion

For each connected calendar:
- Fetch upcoming and recent events
- Each calendar event maps to one internal booking

**Contact Extraction:**
- Scan both event title AND description
- Priority: First valid email → `email` channel; else first valid phone → `sms` channel
- Strip contact info from displayed event title
- Store contact separately as `client_contact`, channel as `email` | `sms`

**If no contact found:** Event shown but confirmation actions disabled. UI warning: "No contact found — add email or phone to event"

### Booking States

**Draft:** Booking created from calendar event. Confirmation NOT sent yet. Draft window = configurable minutes. During draft: business can edit protection rules (Pro only) and manually send confirmation. After draft expires: Starter auto-sends once, Pro auto-sends + optional auto-resend.

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

When customer clicks confirmation link: PaymentIntent created **on business's connected account**, authorization only — no funds captured. Supported: Card, Apple Pay, Google Pay. If authorization fails, booking remains unconfirmed. Failed attempts tracked, business notified after 3 failures.

**PaymentIntent expiration handling:**
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
- Reasons: customer dispute, showed up (marked wrong), business decision

**Disputes/Chargebacks:**
- Tracked in `stripe_disputes` table
- Business notified immediately
- Evidence due date tracked
- Webhook handlers for `dispute.created`, `dispute.updated`, `dispute.closed`
- Dashboard shows active disputes with links to Stripe Dashboard

---

## 8. Dashboard

### Navigation

- **Collapsible sidebar** (desktop >=900px): Logo + Pro badge, Events/Settings nav, Upgrade to Pro (Starter only), account email, theme toggle (icon-only), logout, collapse chevron
- Sidebar expanded: 240px, collapsed: 64px (state in localStorage)
- **Upgrade to Pro button**: Right below nav links (Events/Settings), visible when collapsed too
- `menu_position` in `profiles` table (`'sidebar'` default or `'header'`)
- Toggle between sidebar/header in Settings → Calendar Preferences → "Navigation style"
- **Mobile (<900px)**: Sidebar hidden, `DashboardHeader` shown via `.dashboard-mobile-header-fallback`
- Key files: `DashboardContext.tsx`, `Sidebar.tsx`

### Layout

- **Stacked layout**: FullCalendar month grid on top, flat date-grouped event list below
- **Filter + Create Event row**: Below calendar, shows on all screen sizes (Upcoming/Past + Create Event button)
- Clicking a calendar date smooth-scrolls to that date's event section
- Clicking a calendar date/time slot opens CreateEventModal pre-filled (week view includes time via `select` handler)
- **Past days locked**: Cannot create events on past dates, past days dimmed
- **Calendar day highlight resets** when CreateEventModal closes
- **Scroll-to-top button** (chevron-up) after 600px scroll
- Week view: `allDaySlot: false`, respects `timeFormat` (24h/12h) via `slotLabelFormat`
- **Month title centered** via flex toolbar chunks, fade-in animation on month change
- **Timezone fix**: Use `toLocalDateStr()` helper, NOT `toISOString().split("T")[0]`
- Calendar preferences in `profiles`: `week_start_day` (0=Sun, 1=Mon default), `time_format` ('24h' default or '12h'), `timezone` (business timezone)
- WelcomeEmpty shown when 0 events AND no calendar connected

### Onboarding Banners

**Pending Verification (Stripe Connect):**
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

- **Account card**: Name (editable), Email, subscription status (Pro Active / Starter), usage, Manage/Upgrade button
- **Business Account card** (new): Business name, account status, last payout, links to Stripe Dashboard
- **No-Show Policy card**: "Edit" button opens `NoShowSettingsModal`
- **Notifications section**: Email confirmations (always on), SMS confirmations (Pro, to be implemented), Auto-Resend (Pro)
- **Calendar Preferences**: Stacked layout, full-width toggles (week start, time format, nav style, timezone)
- **Data & Privacy card** (new): Export My Data, Delete My Account
- **Disputes section** (new): Active disputes, past disputes, links to evidence submission
- All cards use `--color-bg-card` background, `--color-text` / `--color-text-secondary` font colors
- Theme toggle: icon-only (no border)

### Event Card Buttons (Strict Rules)

| Button | When Enabled |
|--------|--------------|
| Send confirmation | Draft state, contact exists, within limits, **onboarding complete** |
| Send reminder | Pending/Confirmed, Pro plan, before event start |
| Mark attended | After event start, confirmed booking |
| Mark no-show | After event start, confirmed booking with authorization |
| Issue Refund | After no-show marked |
| Edit/Delete | Draft manual events only (Edit button + Delete button together) |

Buttons must enable/disable based on time, plan, status, and onboarding. Never allow illegal actions.

---

## 9. Authentication & Security

### Authentication
- Supabase authentication (magic links + Google OAuth login)
- Google OAuth for calendar integration (separate from login)
- Session management via Supabase cookies
- Admin routes protected by email whitelist

**Note:** Google OAuth is used in two places:
1. **Login** - Via Supabase Auth (configured in Supabase dashboard)
2. **Calendar** - Direct OAuth2 for Google Calendar API access (token refresh implemented)

### Security Architecture

**Row Level Security (RLS):** ✅ **IMPLEMENTED (2026-02-11)** - All 8 core tables protected with user-scoped RLS policies using `auth.uid()`. Users can only access their own data. Migration: `migrations/005-enable-rls-EXISTING-TABLES-ONLY.sql`. Tables secured: profiles, calendar_bookings, booking_confirmations, google_connections, no_show_settings, appointment_no_show_overrides, appointment_attendance, clients.

**API Route Protection:** All routes use `verifyUserAccess()`. UUID validation via `isValidUUID()`. Calendar event ID validation via `isValidCalendarEventId()`. Rate limiting via Redis (`@upstash/ratelimit`) for critical endpoints (5/36 files migrated). Ownership verification on all resource access. CSRF protection via `verifyOrigin()` on ALL state-changing POST endpoints.

**Token Security:** OAuth tokens encrypted with AES-256-GCM (MANDATORY). Cron jobs via `verifyCronSecret()`. Internal calls via `verifyInternalSecret()`. Token enumeration prevented via `constantTimeDelay()`. Server-side 24h confirmation token expiration. Google Calendar tokens auto-refresh with expiry tracking.

**Payment Security:** PaymentIntent IDs NEVER accepted from client — always read from database. All payments go through connected accounts. Stripe error details not exposed. Auto-resend capped at 3 attempts per booking. Failed authorization attempts tracked.

**Input Sanitization:** `sanitizeString()` for general input applied to all user-controlled text (business names, display names, settings). `sanitizeForSMS()` for SMS (removes Unicode direction overrides, zero-width chars).

**Production Hardening:** Test endpoints return 404 in production. `devLog()` suppresses sensitive logging. SMS mock returns failure in production. Cron routes POST-only with secret auth. Sentry error tracking configured. Webhook idempotency via `stripe_webhook_events` table using atomic INSERT operations.

**Headers & CSP:** Security headers in `middleware.ts`. Strict CSP (no unsafe-eval). HSTS enabled. X-Frame-Options: DENY. TODO: Replace 'unsafe-inline' with nonces for better security.

### Security Rules
- Never trust client input - all inputs sanitized
- All critical logic server-side
- All secrets via environment variables (never NEXT_PUBLIC_)
- Calendar data isolated per user via RLS policies
- Webhook signature verification mandatory
- Rate limiting on all public endpoints (Redis-based for production)
- Row Level Security enabled on all tables (users cannot access others' data)
- GDPR compliance: data export and account deletion with 7-year financial record retention

### Key Security Files
- `lib/auth.ts` - Authentication, authorization, CSRF, OAuth state
- `lib/validation.ts` - Input validation, rate limiting, sanitization, timing protection
- `lib/encryption.ts` - Token encryption utilities
- `lib/rateLimit.ts` - Redis-based rate limiting (Upstash)
- `middleware.ts` - Security headers, CSP, admin auth

### Security Audit & Hardening (2026-02-11)

**Trigger:** Supabase security alert reporting 9 critical errors.

**Root Cause:** Missing Row Level Security (RLS) policies allowed any authenticated user to read/modify all data across all users.

**Resolution:** Comprehensive security hardening addressing 17 vulnerabilities across all severity levels.

**Key Fixes:**
1. **RLS Implementation** - Migration `005-enable-rls-EXISTING-TABLES-ONLY.sql` enables user-scoped policies on 8 core tables
2. **Webhook Idempotency** - Atomic INSERT operations prevent race conditions in `app/api/stripe/webhook/route.ts`
3. **Input Sanitization** - `sanitizeString()` applied to business names, display names, all user-controlled text
4. **CSRF Hardening** - `verifyInternalSecret()` now required for internal API calls (`verifyOrigin()` alone was insufficient)
5. **Rate Limiting** - Redis migration started (5 critical endpoints completed, 31 remaining documented in `RATE_LIMITING_MIGRATION.md`)
6. **GDPR Endpoints** - `app/api/profile/export` and `app/api/profile/delete` with 7-year financial retention
7. **Stripe Connect Auth** - `/connect/onboard`, `/connect/return`, `/connect/refresh` now require `verifyUserAccess()`

**Deployment Status:** All CRITICAL and HIGH priority fixes deployed to production. MEDIUM/LOW priority improvements documented.

**Documentation:**
- `SECURITY_FIXES_SUMMARY.md` - Complete vulnerability list, fixes, deployment checklist
- `RATE_LIMITING_MIGRATION.md` - Guide for completing Redis migration on 31 remaining files
- `RLS_DEPLOYMENT_STEPS.md` - Step-by-step RLS deployment guide with verification queries

**Verification:**
```sql
-- Check RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- All should show rowsecurity = true

-- Check policies exist
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
-- Should see multiple policies per table
```

---

## 10. Email System

- **Provider:** Resend (via `RESEND_API_KEY`)
- **Templates:** React Email (`@react-email/components`) in `emails/` directory
- **Deliverability:** Webhook handlers for bounces, complaints, delivery status

| Template | File | Triggered By | Status |
|----------|------|--------------|--------|
| Booking Confirmation | `BookingConfirmation.tsx` | Dashboard "Send Confirmation" | ✅ Live |
| Booking Reminder | `BookingReminder.tsx` | Cron job (24h before, Pro only) | ✅ Live |
| No-Show Receipt | `NoShowReceipt.tsx` | "Mark no-show" action | ✅ Live |
| Refund Issued | `RefundIssued.tsx` | "Issue Refund" action | ✅ Live |
| Welcome Starter | `WelcomeStarter.tsx` | Free signup | ✅ Live |
| Welcome Pro | `WelcomePro.tsx` | Stripe checkout complete | ✅ Live |
| Usage Warning | `UsageWarning.tsx` | Cron job (at 25/30) | ✅ Live |
| Account Verified | - | Stripe Connect onboarding complete | ❌ Not implemented |
| Account Restricted | - | Stripe account restricted | ❌ Not implemented |
| Dispute Created | - | Chargeback filed | ❌ Not implemented |
| Calendar Disconnected | - | Google token expired | ❌ Not implemented |
| Reauthorization Required | - | PaymentIntent expired | ❌ Not implemented |
| Payment Failed | - | Multiple auth failures | ❌ Not implemented |

**Email Branding:**
- **Starter**: "via Attenda" footer, Attenda branding
- **Pro**: Optional white-label (business name, business logo, remove Attenda branding)

**Cron jobs** (`/api/cron/send-reminders`, `/api/cron/check-usage`, `/api/cron/check-expiring-authorizations`, `/api/cron/cleanup-old-data`): Routes work via POST with `CRON_SECRET` auth. Need external scheduler (Vercel Hobby plan limitation).

---

## 11. Landing Page

Premium DataPulse-inspired design with Framer Motion animations and `prefers-reduced-motion` support.

### Sections (in order)
1. **Header** - Floating glassmorphism nav with centered links (Features, Blog, Pricing)
2. **Hero** - Split layout: text left, animated revenue chart right with floating metrics (no arrows on buttons)
3. **How It Works** - 4-step numbered flow
4. **Features** - 6-card grid with icons
5. **Dashboard Preview** - Analytics mockup
6. **Use Cases** - 4 cards (Salons, Medical, Consultants, Restaurants)
7. **Pricing** - 3-tier cards (Starter/Pro/Business)
8. **FAQ** - 7-question accordion
9. **Testimonials** - 3 customer quotes
10. **Trust Badges** - Stripe, GDPR, Uptime, Setup
11. **Final CTA** - Dark section with gradient background
12. **Footer** - 5-column layout (X, Reddit, YouTube, Facebook social links)

### Cookie Consent
- Minimal Vercel-style notification, 1.5s delay, saves to localStorage
- Component: `app/(landing)/components/CookieConsent.tsx`

### Key Components
All in `app/(landing)/components/`: `Header.tsx`, `MobileMenu.tsx`, `ThemeToggle.tsx`, `CookieConsent.tsx`, `Hero.tsx`, `HowItWorks.tsx`, `Features.tsx`, `DashboardPreview.tsx`, `UseCases.tsx`, `FAQ.tsx`, `Testimonials.tsx`, `TrustBadges.tsx`, `FinalCTA.tsx`

---

## 12. Blog & SEO

- 9 SEO-optimized articles at `/blog/*` with BlogPosting JSON-LD schema
- Blog index at `/blog` with article cards
- SEO infrastructure: Google Search Console, Bing, sitemap (`app/sitemap.ts`), `robots.txt`, `llms.txt`, dynamic OG images, Organization/FAQPage/SoftwareApplication JSON-LD schemas, canonical URLs
- Blog link in: Header nav (desktop), hamburger menu (mobile), Footer

---

## 13. Calendar Integrations

- **Implemented**: Google Calendar (OAuth2 with token refresh)
- **Future**: Apple Calendar, Microsoft Outlook Calendar
- Architecture must be provider-agnostic
- Token refresh implemented with expiry tracking
- Auto-disconnect on `invalid_grant` errors
- Email notifications on disconnection

---

## 14. Database

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts, plan, Stripe IDs, business info, calendar prefs |
| `google_connections` | Encrypted OAuth tokens, expiry tracking, status |
| `calendar_bookings` | Synced events from calendar, currency |
| `booking_confirmations` | Confirmation tokens, status, Stripe PaymentIntent, card auth status, currency |
| `no_show_settings` | Global protection rules per user |
| `appointment_no_show_overrides` | Per-event rule overrides |
| `appointment_attendance` | Attendance records (attended/no_show) |
| `stripe_charges` | Audit log for all Stripe operations, currency |
| `stripe_refunds` | All refunds (full/partial), reason tracking |
| `stripe_disputes` | Chargebacks, evidence due dates, status |
| `stripe_webhook_events` | Idempotency log, retry tracking, error logging |
| `stripe_account_updates` | Stripe Connect account status changes |
| `business_onboarding_logs` | Onboarding flow tracking |
| `payment_authorization_failures` | Failed auth attempts, error codes |
| `sms_logs` | SMS delivery status, cost tracking (to be implemented) |

### Notable `profiles` columns
- `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
- `stripe_account_id`, `stripe_account_status`, `onboarding_completed`
- `business_name`, `business_address`, `business_country`, `business_vat`, `business_type`
- `white_label_enabled`, `business_logo_url` (Pro features)
- `week_start_day`, `time_format`, `timezone`
- `menu_position`, `display_name`
- `currency` (derived from business_country)
- `deleted_at` (soft delete for GDPR)
- **No `email` column** — get email from `user` object

### Notable `google_connections` columns
- `encrypted_access_token`, `encrypted_refresh_token`
- `token_expires_at`, `status` ('connected' | 'disconnected')
- `google_email`

### Notable `booking_confirmations` columns
- `stripe_payment_intent_id`, `card_authorized`, `card_authorized_at`
- `charge_captured`, `charge_captured_at`
- `currency`

### Migrations (run in Supabase SQL Editor)
All migrations in `migrations/` directory.

**✅ Deployed:**
- `005-enable-rls-EXISTING-TABLES-ONLY.sql` - Row Level Security on 8 core tables (2026-02-11)

**📋 Planned (not yet run):**
- `001-stripe-connect.sql` - Stripe Connect fields
- `002-multi-currency.sql` - Currency support
- `003-refunds-disputes.sql` - Refund/dispute tracking
- `004-webhook-idempotency.sql` - Webhook event logging (partial - table exists, not from migration)
- `token-refresh.sql` - Google token expiry tracking
- `data-retention.sql` - GDPR compliance fields

**⚠️ Important:** When running migrations 001-004, you'll need to update the RLS migration to include the new tables (stripe_refunds, stripe_disputes, stripe_webhook_events, etc.). Use `005-enable-rls-policies-SAFE-RERUN.sql` as template.

---

## 15. Environment Variables

Required in `.env.local` (all configured in Vercel):

**Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Google OAuth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Email:** `RESEND_API_KEY`, `EMAIL_FROM`

**SMS (to be implemented):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER` (twilio)

**Security:** `CRON_SECRET`, `OAUTH_STATE_SECRET`, `INTERNAL_API_SECRET`, `TOKEN_ENCRYPTION_KEY` (64 hex chars), `ADMIN_EMAILS` (comma-separated)

**App:** `NEXT_PUBLIC_APP_URL` (https://attenda.app)

**Stripe:**
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID_EUR`, `STRIPE_PRO_PRICE_ID_USD`

**Redis (Upstash):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Monitoring:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

**Stripe webhook events required:**
- Subscriptions: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Payments: `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed`, `charge.captured`
- Disputes: `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`
- Connect: `account.updated`, `account.external_account.*`, `capability.updated`

---

## 16. Production Readiness Status

### ✅ Implemented (MVP Complete)
- Dashboard UI (calendar, events, settings)
- Google Calendar integration with token refresh
- Email confirmations via Resend
- Stripe subscriptions (Starter/Pro)
- Basic card authorization (NOT on connected accounts yet)
- Multi-currency UI support
- Dark/light mode
- Landing page + blog

### ✅ Security Hardening DEPLOYED (2026-02-12)
**17 vulnerabilities fixed across all severity levels - NOW LIVE IN PRODUCTION:**

**CRITICAL (4)**:
- Row Level Security enabled on all 8 existing tables (`profiles`, `google_connections`, `calendar_bookings`, `booking_confirmations`, `no_show_settings`, `appointment_no_show_overrides`, `appointment_attendance`, `stripe_charges`)
- Stripe Connect endpoints authenticated with proper user access verification
- Webhook idempotency race condition fixed with atomic database operations
- Weak CSRF protection strengthened with origin verification on all state-changing endpoints

**HIGH (6)**:
- Redis rate limiting (Upstash) deployed on critical endpoints with fallback to in-memory for development
- Input sanitization for XSS prevention (`sanitizeString`, `sanitizeForSMS`)
- Timing leak protection on token validation with `constantTimeDelay()`
- GDPR data export API (`/api/profile/export`) with JSON download
- GDPR data deletion API (`/api/profile/delete`) with 7-year financial record retention
- Admin endpoints protected with email whitelist

**MEDIUM (5)**:
- `INTERNAL_API_SECRET` enforcement with value verification (not just presence check)
- Timing-safe secret comparison using `crypto.timingSafeEqual()`
- CSP improvements in middleware
- Health check endpoint (`/api/health`) deployed
- Webhook reconciliation tool (`/api/admin/reconcile`) deployed

**LOW (2)**:
- Environment variable documentation complete
- Deployment verification checklist created

**Infrastructure Added:**
- Database schema for disputes, refunds, webhook events, authorization failures
- Admin tools: reconciliation endpoint, webhook viewer
- Email templates for refunds (6 additional templates pending Connect implementation)

**See `SECURITY_FIXES_SUMMARY.md` for complete details and testing checklist.**

### 🔴 CRITICAL - Must Implement Before Launch

| Feature | Priority | Status | Timeline |
|---------|----------|--------|----------|
| **Stripe Connect** | CRITICAL | NOT STARTED | 2-3 weeks |
| Business registration flow | CRITICAL | ✅ FRONTEND READY (no backend) | 1 week |
| Connected account payouts | CRITICAL | NOT STARTED | 1 week |
| Webhook idempotency | CRITICAL | ✅ DEPLOYED | - |
| Refund handling | CRITICAL | ✅ API READY (needs Connect) | 1 week |
| Dispute/chargeback handling | CRITICAL | ✅ DB SCHEMA READY (no UI) | 1 week |
| Production monitoring (Sentry) | CRITICAL | ❌ REMOVED (needs setup) | 2 days |
| Redis rate limiting | CRITICAL | ✅ DEPLOYED (Upstash) | - |
| Health check endpoint | CRITICAL | ✅ DEPLOYED | - |
| **Row Level Security** | CRITICAL | ✅ DEPLOYED | - |
| **GDPR Compliance** | CRITICAL | ✅ DEPLOYED | - |

### 🟡 High Priority - Should Have

| Feature | Priority | Status | Timeline |
|---------|----------|--------|----------|
| PaymentIntent expiration handling | HIGH | ✅ API READY (no cron) | 3 days |
| Failed authorization retry | HIGH | ✅ DB SCHEMA READY | 2 days |
| Email deliverability tracking | HIGH | NOT STARTED | 2 days |
| GDPR auto-delete cron | HIGH | NOT STARTED | 2 days |
| Webhook reconciliation tool | HIGH | ✅ DEPLOYED | - |
| Admin dashboard | HIGH | NOT STARTED | 1 week |

### 🟢 Medium Priority - Nice to Have

| Feature | Priority | Status | Timeline |
|---------|----------|--------|----------|
| SMS implementation (Twilio) | MEDIUM | 40% | 1 week |
| Timezone support | MEDIUM | PLANNED | 3 days |
| White-label emails (Pro) | MEDIUM | PLANNED | 2 days |
| Load testing | MEDIUM | NOT STARTED | 3 days |
| Backup/recovery testing | MEDIUM | NOT STARTED | 2 days |

### Timeline Estimate
- **Minimum viable launch:** 5-6 weeks (Critical features only)
- **Production-ready launch:** 7-8 weeks (Critical + High priority)
- **Full feature set:** 9-10 weeks (All features)

**Recommendation:** Do NOT launch publicly until all CRITICAL features are implemented. Current system has major payment flow gap (no connected accounts = money has nowhere to go).

---

## 17. Important Gotchas

- **CRITICAL**: Stripe Connect is NOT implemented. Current payment flow is incomplete. Money has no destination account. Must implement before launch.
- **Default no-show fee is €20** (2000 cents) — not €30
- **`profiles` table has NO `email` column** — get email from `user` object (via `getAuthenticatedUser()`)
- **RLS Migration Errors**: Tables from unrun migrations (001-004) don't exist yet. Use `005-enable-rls-EXISTING-TABLES-ONLY.sql` which only applies RLS to 8 existing tables.
- **`appointment_attendance` and `appointment_no_show_overrides`** use `user_id` directly, NOT `booking_id`. RLS policies must use `auth.uid() = user_id`.
- **Vercel env vars**: invisible newline characters when pasting cause cryptic errors. Press End then Backspace after pasting, or re-type manually.
- **Timezone dates**: Always use `toLocalDateStr()`, never `toISOString().split("T")[0]`
- **FullCalendar `dateClick`** unreliable in week timegrid — use `selectable={true}` + `select` handler
- **CSS variables**: `--color-bg` (#0F172A dark) differs from `--color-bg-card` (#1E293B dark) — always use `--color-bg-card` for card backgrounds
- **Dark mode**: via `[data-theme="dark"]` selector. Always check dark mode contrast for colored badges.
- **`<button>` elements reset styles**: when using `<button>` as card, must explicitly set `background` and `border`
- **Sidebar dark mode nav links**: need explicit `[data-theme="dark"] .sidebar-nav-link` color (#cbd5e1)
- **Webhook idempotency**: ✅ FIXED - Atomic INSERT operations prevent race conditions. Use `DROP POLICY IF EXISTS` before `CREATE POLICY` for safe re-runs.
- **PaymentIntent expiry**: Auth expires after 7 days, must renew for bookings >7 days away
- **Rate limiting**: ✅ DEPLOYED - Redis via Upstash for production, in-memory fallback for development.
- **Connected accounts**: Never create PaymentIntents on platform account — always use `on_behalf_of` and `transfer_data`
- **Multi-currency**: Always store currency with amount. Display correct symbol based on user's country.
- **Google token refresh**: Tokens expire every hour, refresh tokens expire after 6 months inactive. Must handle both.
- **GDPR**: ✅ DEPLOYED - Data export (`/api/profile/export`) and deletion (`/api/profile/delete`) with 7-year financial retention.
- **Disputes**: Business has limited time to respond with evidence. Track `evidence_due_by` dates.
- **Skeleton loading states** used in dashboard (not spinner)
- **SocialProof section removed** from landing page — Hero floating metrics are separate and kept
- **Next.js 16 `useSearchParams()`**: Must wrap in `<Suspense>` boundary or page will fail static generation. Extract logic using searchParams into separate component, wrap in Suspense with loading fallback.
- **Nested directory structure**: NEVER create directories like `app/attenda/app/` - causes duplicate Next.js installations and TypeScript type conflicts. Always verify correct locations: routes go in `app/api/`, components in `app/components/`, etc.
- **node_modules in Git**: NEVER commit `app/attenda/node_modules/` - causes 100MB+ file errors on GitHub. Always check `git status` and selectively stage files, not `git add -A` blindly.
- **Unimplemented features**: Don't import email templates or create config files for features not yet implemented (like Sentry). Comment out imports and add TODO notes until ready.
- **Build testing**: Always run `npm run build` locally before pushing to catch TypeScript/build errors early. Vercel builds are slower and harder to debug.

---

## 18. Development Priorities

**DO NOT START NEW FEATURES.** Focus on production readiness:

1. **Week 1-3:** Stripe Connect implementation (business onboarding, connected accounts, payouts)
2. **Week 4:** Webhook hardening (idempotency, retry, logging)
3. **Week 5:** Refund & dispute handling
4. **Week 6:** Production infrastructure (Sentry, Redis, monitoring, health checks)
5. **Week 7-8:** Edge cases (payment failures, token refresh, GDPR compliance)

**After production launch:**
- SMS implementation
- White-label branding
- Advanced features (timezone, multi-calendar, API)

See `docs/implementation-plan.md` for detailed breakdown of all tasks.
