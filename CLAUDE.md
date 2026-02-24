# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Rules

- Do NOT invent features not described in this document
- Do NOT remove safeguards
- Always explain why something exists
- Ask before making breaking changes
- When giving code: specify file path, give copy-paste-ready snippets
- If something is unclear, ask before guessing
- Do not simplify unless explicitly instructed

---

## 1. Product

**Attenda** is a premium SaaS tool that helps service businesses reduce no-show appointments.
- **Domain**: attenda.app (live on Vercel) | **GitHub**: github.com/Asolution-hub/attenda
- Real, paid product — assume real users, real money, legal implications, long-term maintenance
- Landing page + Dashboard in one Next.js project

**Design system**: Indigo primary (`#6366F1`), Teal accent (`#14B8A6`), Inter font (400–800), DataPulse-inspired SaaS aesthetic. Premium, minimal, calm.

---

## 2. Payment Architecture (NON-NEGOTIABLE)

**Money flow:** Business registers Stripe Connect → Client authorizes card (PaymentIntent on connected account) → No-show → Business marks no-show → fee captured directly to business bank. Attenda takes platform fee. Attenda CANNOT hold business revenue.

**Charging prerequisites — ALL must be true:**
1. `onboarding_completed = true` (Stripe Connect verified)
2. Confirmation was sent to customer
3. Customer completed Stripe authorization
4. Business manually clicked "Mark no-show"

**If any prerequisite is missing, charge MUST fail.** No automatic charging. "Mark attended" → authorization released, no charge. "Confirmation expired" → no charge.

**Business registration flow:** Login → `/onboarding/business` (BEFORE dashboard) → Stripe Connect onboarding → status `pending` → `enabled` (1–2 days) → email notification → can now send confirmations.

---

## 3. Codebase

**Tech Stack:** Next.js 16.1.6, React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + RLS), Stripe Connect + Subscriptions, Sentry, Resend, Upstash Redis
**Path alias:** `@/*` → project root | **Commands** (from `/App/attenda/`): `npm run dev` · `npm run build` · `npm run lint`

### Directory Structure

```
App/attenda/
├── app/
│   ├── api/              # stripe/, bookings/, profile/, admin/, cron/
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

**Auth & Security:** `lib/auth.ts` (verifyUserAccess, verifyCronSecret, verifyInternalSecret, verifyOrigin) · `lib/validation.ts` (UUID/input validation, sanitization — NOT for rate limiting) · `lib/encryption.ts` (AES-256-GCM) · `lib/rateLimit.ts` (Redis/Upstash — ALWAYS use this, never in-memory) · `proxy.ts` (CSP, HSTS, X-Frame-Options — Next.js 16 middleware file, do NOT create `middleware.ts`)

**Integrations:** `lib/googleAuth.ts` · `lib/microsoftAuth.ts` · `lib/stripe.ts` · `lib/email.ts` · `lib/sms.ts` (planned)

**Business Logic:** `lib/noShowRules.ts` (defines `DEFAULT_NO_SHOW_FEE_CENTS = 2000`, `DEFAULT_GRACE_PERIOD_MINUTES = 10`, `DEFAULT_LATE_CANCEL_HOURS = 24`) · `lib/contactParser.ts` · `lib/plans.ts` · `lib/currency.ts`

### Critical API Routes

**Stripe Connect:** `connect/onboard`, `connect/return`, `connect/status`, `connect/dashboard`
**Payments:** `create-checkout`, `create-checkout-guest`, `create-authorization`, `webhook`
**Bookings:** `bookings/[id]/refund`, `no-show/settings`, `no-show/override`, `events/list`
**Admin/User:** `admin/reconcile`, `health`, `profile/export`, `profile/delete`

### Cron Jobs (cron-job.org)

All 5 live. POST only, `Authorization: Bearer <CRON_SECRET>` required.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `send-draft-confirmation` | Every 30 min | Auto-send after 10-min draft window; Starter 30/month limit |
| `send-reminders` | Every hour | Reminders for next-24h appointments; Pro only |
| `sync-calendar` | Every hour | Sync Google/Microsoft; also on dashboard load |
| `check-expiring-authorizations` | Every 6 hours | Renew PaymentIntents expiring within 24h |
| `check-usage` | Daily 09:00 UTC | Warn Starter at 25/30 appointments; once/month |

---

## 4. Plans & Pricing

| Feature | Starter (Free) | Pro (€39/$39/mo) |
|---------|---------------|-----------------|
| Protected appointments | 30/month | Unlimited |
| Confirmations | Email only | Email + SMS (planned) |
| Auto-resend | No | Yes (max 3/booking) |
| Per-appointment rules | No | Yes |
| White-label email | No | Yes (opt-in) |
| Stripe Express Dashboard | No | Yes |

**Pricing rules:** EU → EUR, rest → USD. Numeric price stays 39. Currency stored per booking. Derive symbol: `currency.toUpperCase() === "USD" ? "$" : "€"` — never hardcode `"eur"` or `"€"`.

**Starter limit UI:** "Protection not applied — monthly limit reached"

**Business plan:** Planned, not available. Anticipate in code, do not expose in UI.

---

## 5. Booking Lifecycle

**Statuses:** Confirmation: `draft` → `pending` → `confirmed` | `expired`. Attendance: `pending` → `attended` | `no_show`

### Calendar Event Ingestion
- Each calendar event maps to one internal booking
- **Contact extraction:** Scan title + description. First valid email → `email` channel; else first valid phone → `sms` channel. Strip contact from displayed title, store as `client_contact`.
- **No contact found:** Show event, disable confirmation actions. Warning: "No contact found — add email or phone to event"

### Booking States
- **Draft:** 10-min window. Pro can edit protection rules. Manual send bypasses window. After expiry, cron auto-sends.
- **Pending:** Confirmation sent, awaiting customer authorization.
- **Confirmed:** Card authorized, booking protected.

### Protection Rules
Use `lib/noShowRules.ts` constants, never hardcode. Starter: global rules only. Pro: per-booking overrides. Overrides locked once confirmation is sent.

### Confirmation Flow

**Verification gate — `onboarding_completed = true` required at ALL send paths:**
1. `/api/bookings/send-confirmation`
2. `/api/bookings/send-draft-confirmation`
3. `/api/bookings/resend-confirmation`
4. `/api/cron/send-draft-confirmation`
5. `/api/notifications/send` (final safety net)

Do NOT add a new send path without this check. UI disables send buttons for non-verified users, but API enforces regardless.

**`draft_expires_at` must always be set** when creating `calendar_bookings` with `status = 'draft'`. Without it, the `lte` filter in `send-draft-confirmation` cron silently skips the booking forever.

### Stripe Authorization
PaymentIntent on business's connected account. Auth only, no capture. Card/Apple Pay/Google Pay. Business notified after 3 failed attempts. PIs expire after 7 days — cron auto-renews and notifies client to re-authorize.

### Event Day Logic
Before event start: no attendance actions. After start: "Mark attended" → release auth, no charge. "Mark no-show" → capture fee, send receipt. Past events: read-only.

### Refunds & Disputes
Refunds tracked in `stripe_refunds`, client notified. Disputes tracked in `stripe_disputes`, business notified immediately. Track `evidence_due_by` — limited response window.

---

## 6. Security

### Authentication
- Supabase: magic links + Google OAuth + Microsoft Azure OAuth
- Calendar OAuth is separate from login — separate apps, both must be configured
- Session via Supabase cookies. Admin routes protected by `ADMIN_EMAILS` whitelist.

### API Route Protection
- **Admin:** Email whitelist (`ADMIN_EMAILS`) — compare with `.toLowerCase()` on both sides
- **User routes:** `verifyUserAccess()` — validates auth + ownership
- **CSRF:** `verifyOrigin()` on ALL state-changing POSTs. Fails closed if `NEXT_PUBLIC_APP_URL` unset.
- **UUID validation:** `isValidUUID()` on all route params
- **Debug/test routes:** Return 404 in production (`/api/debug-auth`, `/api/sentry-test-error`)
- **Health endpoint:** Detailed metrics restricted to admin users only
- **RLS:** All 18 tables protected with `auth.uid()` policies (migrations 005 + 007)

### Rate Limiting — ALWAYS use `@/lib/rateLimit` (Redis), NEVER in-memory
Confirmation: 10/min | Stripe: 20/min | Refund: 5/min | General: 60/min | Auth: 5/min | Webhooks: 100/min

### Token & Payment Security
- OAuth tokens: AES-256-GCM mandatory (`lib/encryption.ts`)
- PaymentIntent IDs: NEVER accept from client — always read from DB
- Cron: `verifyCronSecret()` | Internal: `verifyInternalSecret()`
- Token enumeration: `constantTimeDelay()` on confirmation token lookups
- Server-side 24h confirmation token expiration

### Input Sanitization
`sanitizeString()` for all user-controlled text. `sanitizeForSMS()` for SMS content (removes Unicode direction overrides, zero-width chars).

### OAuth Calendar Route Security

| Route | Session required | Protection |
|-------|-----------------|-----------|
| `/connect` | ✅ Yes (cookie-based) | Session check + HMAC-signed state |
| `/status` | ✅ Yes | Session check + UUID validation; call with `Authorization: Bearer` header |
| `/callback` | ❌ No | HMAC state only — **NEVER add session check here**, user has no session during OAuth redirect |
| `/disconnect` | ✅ Yes | `Authorization: Bearer <token>` required |

- Callback MUST set `status = 'connected'` — otherwise reconnect silently keeps `'disconnected'` status
- Frontend disconnect: include `Authorization: Bearer`, `credentials: 'include'`, check `res.ok` before updating UI
- Status check: compare `data.status === 'disconnected'` in code, not as a query filter (handles NULL from pre-migration rows)

---

## 7. Integrations

### Email (Resend)

**White-label:** `emails/components/Layout.tsx` accepts `branding?: { name: string; logoUrl?: string | null }`. When set: business name/logo in header, "Powered by Attenda" footer. When unset: full Attenda branding.

Derive at call sites:
```ts
const whiteLabel = profile?.white_label_enabled && profile?.business_name
  ? { businessName: profile.business_name, logoUrl: profile.business_logo_url }
  : undefined;
```

**Client-facing (white-label supported):** `BookingConfirmation`, `BookingReminder`, `NoShowReceipt`, `RefundIssued`, `ReauthorizationRequired`
**Business-owner (always Attenda branding):** `WelcomeStarter`, `WelcomePro`, `UsageWarning`, `AccountVerified`, `AccountRestricted`, `DisputeCreated`, `PaymentFailed`, `CalendarDisconnected`

**Call sites** that must select `white_label_enabled, business_logo_url` and pass `whiteLabel`: `notifications/send`, `cron/send-reminders`, `attendance/mark`, `bookings/[id]/refund`, `cron/check-expiring-authorizations`

**Special wiring:**
- `RefundIssued`: retrieve card via `stripe.paymentIntents.retrieve` with `expand: ["payment_method"]`
- `AccountVerified/Restricted`: via `account.updated` webhook — NOT in `/connect/return` (stale TODO there is intentional)

**Design:** Indigo (#6366f1) info/CTA cards · Red: NoShowReceipt · Green: RefundIssued · Amber: AccountRestricted, PaymentFailed

### Calendar

**Google:** OAuth2 via `googleapis`, `lib/googleAuth.ts`, routes `/api/google/*`
**Microsoft:** Microsoft Graph API, `lib/microsoftAuth.ts`, routes `/api/microsoft/*` (setup: `docs/MICROSOFT_SETUP.md`)

Both use `google_connections` table (with `provider` column). Can be connected simultaneously. Events synced in parallel. Calendar sync deletes orphaned bookings (events deleted in source calendar). Runs on dashboard load + hourly cron.

Google tokens expire hourly; refresh tokens expire after 6 months inactive. Handle both.

### Sentry

**Configs:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `next.config.ts` (withSentryConfig, tunnel at `/monitoring`)
- `replayIntegration` guarded by `typeof window !== "undefined"`
- `proxy.ts` must exclude `/monitoring` or Sentry tunnel fails
- **Dashboard:** https://attenda.sentry.io/issues/?project=4510878977884240

---

## 8. Database & Configuration

### Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts, plan, Stripe IDs, business info, calendar prefs |
| `google_connections` | Encrypted OAuth tokens, expiry, status (`connected`/`disconnected`) |
| `calendar_bookings` | Synced events, currency |
| `booking_confirmations` | Tokens, status, PaymentIntent, card auth, currency |
| `no_show_settings` | Global protection rules per user |
| `appointment_no_show_overrides` | Per-event rule overrides — uses `user_id`, NOT `booking_id` |
| `appointment_attendance` | Attendance records — uses `user_id`, NOT `booking_id` |
| `stripe_charges` | Audit log |
| `stripe_refunds` | Refunds tracking |
| `stripe_disputes` | Chargebacks, `evidence_due_by` dates |
| `stripe_webhook_events` | Idempotency log |
| `payment_authorization_failures` | Failed auth attempts |

RLS on `appointment_attendance` and `appointment_no_show_overrides` must use `auth.uid() = user_id`.

### Notable `profiles` Columns
`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `stripe_account_id`, `stripe_account_status`, `onboarding_completed`, `business_name`, `business_address`, `business_country`, `business_vat`, `white_label_enabled`, `business_logo_url`, `week_start_day`, `time_format`, `timezone`, `currency`, `deleted_at`

**No `email` column** — get from `user` object via `getAuthenticatedUser()`.

**`booking_confirmations.currency`** is source of truth for a booking's currency. Used throughout: `confirmation-status` → `EventCard` → `RefundModal`, `confirm/[token]`, `attendance/mark`, `bookings/[id]/refund`. Never hardcode `"eur"` or `"€"`.

### Migrations (all deployed to Supabase)
- `001` — Stripe Connect fields, business onboarding
- `002` — Webhook idempotency, payment failure tracking
- `003` — Refund/dispute tables
- `004` — GDPR export/deletion, anonymization
- `005` — RLS on 17 tables
- `006` — `google_connections.status` column
- `007` — RLS on `booking_protections`

### Environment Variables

**Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Google (Calendar):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
**Microsoft:** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` (`https://attenda.app/api/microsoft/callback`), `MICROSOFT_TENANT_ID` (`common`)
**Email:** `RESEND_API_KEY`, `EMAIL_FROM`
**SMS (planned):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER`
**Security:** `CRON_SECRET`, `OAUTH_STATE_SECRET`, `INTERNAL_API_SECRET`, `TOKEN_ENCRYPTION_KEY` (64 hex chars), `ADMIN_EMAILS`
**App:** `NEXT_PUBLIC_APP_URL` (`https://attenda.app`)
**Stripe:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID_EUR`, `STRIPE_PRO_PRICE_ID_USD`
**Redis:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
**Sentry:** `SENTRY_AUTH_TOKEN`

**Required Stripe webhook events:**
- `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed`, `charge.captured`
- `charge.dispute.created/updated/closed/funds_withdrawn`
- `account.updated`, `account.external_account.*`, `capability.updated`

---

## 9. Frontend

### Dashboard

**Navigation:** Sidebar (desktop ≥900px), collapsible 260px/72px, state in localStorage. Key files: `DashboardContext.tsx`, `Sidebar.tsx`, `DashboardHeader.tsx`. Sidebar CSS: use `sidebar-logo-refined`, `sidebar-nav-refined`, `sidebar-nav-item` — old base classes removed.

**Mobile (<900px):** Sidebar hidden, `DashboardHeader` renders only after client-side mount (prevents flash).

**Loading:** `app/auth/callback/page.tsx` uses `settings-loading` container — NOT `login-page > login-card` (causes loading flash).

**Layout:** Stacked — FullCalendar on top, date-grouped event list below. Always `toLocalDateStr()`, never `toISOString().split("T")[0]`. Week view: `allDaySlot: false`, `selectable={true}` + `select` handler (not `dateClick`). `WelcomeEmpty` when 0 events + no calendar.

**Onboarding banners:** Show "Verification Pending" or "Account Restricted" based on `stripe_account_status`.

**Settings page:** Account card (name, email, subscription, usage), Business Account card (Stripe Dashboard link), No-Show Policy (opens `NoShowSettingsModal`), Notifications, Calendar Preferences, Data & Privacy, Disputes. All cards: `--color-bg-card` background, `--color-text` / `--color-text-secondary` fonts.

**Event Card Buttons (strict):**

| Button | When Enabled |
|--------|--------------|
| Send confirmation | Draft, contact exists, within limits, onboarding complete |
| Send reminder | Pending/Confirmed, Pro, before event start |
| Mark attended | After event start, confirmed booking |
| Mark no-show | After event start, confirmed + authorized |
| Issue Refund | After no-show marked |
| Edit/Delete | Draft manual events only |

### Landing Page & Blog

**Components** in `app/(landing)/components/`: Header, MobileMenu, ThemeToggle, CookieConsent, Hero, HowItWorks, Features, DashboardPreview, UseCases, FAQ, Testimonials, TrustBadges, FinalCTA

**Blog:** SEO articles at `/blog/*` with BlogPosting JSON-LD. SEO: sitemap, robots.txt, llms.txt, dynamic OG images, JSON-LD schemas.

---

## 10. Critical Gotchas

### Payment & Security
- **No-show fee default:** €20 (2000 cents) — use `DEFAULT_NO_SHOW_FEE_CENTS`, never hardcode
- **PaymentIntent IDs:** never from client — always read from DB
- **`verifyOrigin()`** fails closed if `NEXT_PUBLIC_APP_URL` unset — always set in Vercel

### Calendar
- **`/callback`:** NEVER add session verification — HMAC state is the only protection; user has no session during OAuth redirect
- **Disconnect:** must include `Authorization: Bearer` + check `res.ok` before updating UI state
- **Reconnect:** callback MUST set `status = 'connected'`
- **Query params:** Settings page useEffects must preserve other params when clearing their own

### Database
- **`booking_confirmations.currency`** is source of truth — never hardcode `"eur"`/`"€"`
- **`appointment_attendance` / `appointment_no_show_overrides`** use `user_id`, not `booking_id`

### Development
- **Dates:** `toLocalDateStr()`, never `toISOString().split("T")[0]`
- **FullCalendar:** `selectable={true}` + `select` handler, not `dateClick`
- **Build:** run `npm run build` before pushing
- **Vercel env vars:** invisible newlines when pasting — press End then Backspace after pasting
- **`useSearchParams()`:** must wrap in `<Suspense>` or static generation fails
- **Directory structure:** never create `app/attenda/app/` — causes duplicate Next.js installations
- **git:** never commit `node_modules/`; selectively stage files

### Styling
- **`--color-bg-card`** for card backgrounds, not `--color-bg` (they differ in dark mode)
- **Dark mode:** `[data-theme="dark"]` selector throughout globals.css
- **`<button>` as card:** must explicitly set `background` + `border`
- **Settings cards:** padding 18px, row 10px, gap 14px; labels 0.875rem, titles 1rem
