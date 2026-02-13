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
**Database/Auth**: Supabase (PostgreSQL + RLS + magic links + Google OAuth)
**Payments**: Stripe Connect + Subscriptions
**External APIs**: Google Calendar (OAuth2), Resend (email), Twilio (SMS - planned)
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

**Draft:** Confirmation NOT sent yet. Draft window = configurable minutes. During draft: business can edit protection rules (Pro only) and manually send confirmation. After draft expires: Starter auto-sends once, Pro auto-sends + optional auto-resend.

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
- Supabase authentication (magic links + Google OAuth login)
- Google OAuth for calendar integration (separate from login, token refresh implemented)
- Session management via Supabase cookies
- Admin routes protected by email whitelist

### Security Architecture

**Row Level Security (RLS):** All 8 core tables protected with user-scoped RLS policies using `auth.uid()`. Users can only access their own data. Migration: `migrations/005-enable-rls-EXISTING-TABLES-ONLY.sql`. Tables: profiles, calendar_bookings, booking_confirmations, google_connections, no_show_settings, appointment_no_show_overrides, appointment_attendance, clients.

**API Route Protection:** All routes use `verifyUserAccess()`. UUID validation, calendar event ID validation, rate limiting via Redis (Upstash) for critical endpoints, ownership verification on all resource access, CSRF protection via `verifyOrigin()` on ALL state-changing POST endpoints.

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

- **Implemented**:
  - Google Calendar (OAuth2 with token refresh, expiry tracking)
  - Microsoft Outlook Calendar (Microsoft Graph API, OAuth2 with token refresh)
- **Planned**: Apple Calendar
- Architecture is provider-agnostic (uses unified `google_connections` table with `provider` column)
- Auto-disconnect on `invalid_grant` errors
- Email notifications on disconnection
- Both providers can be connected simultaneously
- Events synced in parallel, merged in dashboard
- Setup guide: `docs/MICROSOFT_SETUP.md`

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

**✅ Deployed:**
- `005-enable-rls-EXISTING-TABLES-ONLY.sql` - Row Level Security on 8 core tables

**📋 Planned:**
- `001-stripe-connect.sql` - Stripe Connect fields
- `002-multi-currency.sql` - Currency support
- `003-refunds-disputes.sql` - Refund/dispute tracking
- `004-webhook-idempotency.sql` - Webhook event logging
- `token-refresh.sql` - Google token expiry tracking
- `data-retention.sql` - GDPR compliance fields

**⚠️ Important:** When running migrations 001-004, update the RLS migration to include new tables. Use `005-enable-rls-policies-SAFE-RERUN.sql` as template.

### Environment Variables

Required in `.env.local` (all configured in Vercel):

**Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Google OAuth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Microsoft OAuth:** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`, `MICROSOFT_TENANT_ID`

**Email:** `RESEND_API_KEY`, `EMAIL_FROM`

**SMS (planned):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER`

**Security:** `CRON_SECRET`, `OAUTH_STATE_SECRET`, `INTERNAL_API_SECRET`, `TOKEN_ENCRYPTION_KEY` (64 hex chars), `ADMIN_EMAILS`

**App:** `NEXT_PUBLIC_APP_URL` (https://attenda.app)

**Stripe:**
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID_EUR`, `STRIPE_PRO_PRICE_ID_USD`

**Redis:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Stripe webhook events required:**
- Subscriptions: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Payments: `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed`, `charge.captured`
- Disputes: `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`
- Connect: `account.updated`, `account.external_account.*`, `capability.updated`

---

## 12. Production Status & Roadmap

### ✅ Implemented
- Dashboard UI (calendar, events, settings)
- Google Calendar integration with token refresh
- Email confirmations via Resend
- Stripe subscriptions (Starter/Pro)
- Multi-currency UI support
- Dark/light mode
- Landing page + blog
- **Security hardening deployed:** RLS on all tables, Redis rate limiting, GDPR endpoints, webhook idempotency, input sanitization, CSRF protection, admin auth

### 🔴 CRITICAL - Blocking Launch

| Feature | Status |
|---------|--------|
| **Stripe Connect** | NOT STARTED - Payment flow incomplete, no destination for money |
| Business registration backend | Frontend ready, no backend implementation |
| Connected account payouts | NOT STARTED |
| Dispute/chargeback UI | DB schema ready, no UI |
| Production monitoring (Sentry) | Needs setup |

### 🟡 High Priority

| Feature | Status |
|---------|--------|
| PaymentIntent expiration cron | API ready, no cron scheduler |
| Failed authorization retry | DB schema ready |
| Email deliverability tracking | NOT STARTED |
| GDPR auto-delete cron | NOT STARTED |
| Admin dashboard | NOT STARTED |

### 🟢 Medium Priority

| Feature | Status |
|---------|--------|
| SMS implementation (Twilio) | 40% complete |
| Timezone support | Planned |
| White-label emails (Pro) | Planned |

### Deployment Blockers

**DO NOT LAUNCH** until Stripe Connect is fully implemented. Current system cannot process payments correctly. Money has no destination account.

---

## 13. Critical Gotchas

### Payment & Security
- **CRITICAL**: Stripe Connect NOT implemented. Payment flow incomplete. Must implement before launch.
- **Default no-show fee is €20** (2000 cents) — not €30
- **Connected accounts**: Never create PaymentIntents on platform account — always use `on_behalf_of` and `transfer_data`
- **PaymentIntent expiry**: Auth expires after 7 days, must renew for bookings >7 days away
- **Multi-currency**: Always store currency with amount. Display correct symbol based on user's country.

### Database
- **`profiles` table has NO `email` column** — get email from `user` object (via `getAuthenticatedUser()`)
- **RLS Migration**: Use `005-enable-rls-EXISTING-TABLES-ONLY.sql` which only applies RLS to 8 existing tables
- **`appointment_attendance` and `appointment_no_show_overrides`** use `user_id` directly, NOT `booking_id`. RLS policies must use `auth.uid() = user_id`.

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
