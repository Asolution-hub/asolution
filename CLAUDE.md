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

**Money flow:** Business registers Stripe Connect → Client authorizes card (PaymentIntent **directly on connected account**) → No-show → Business marks no-show → fee captured directly to business bank. Attenda takes **zero platform fee** on no-show transactions. Attenda revenue = Pro subscription only.

**Stripe charge type:** No-show PaymentIntents use **direct charges** (`{ stripeAccount: connectedAccountId }` on all Stripe API calls). They are invisible to Attenda's Stripe dashboard. Disputes are handled entirely between the business and their customer. Do NOT add `on_behalf_of`, `transfer_data`, or `application_fee_amount` to no-show PaymentIntents.

**Legacy transition:** PIs created before the direct charge switch (2026-02-26) are destination charges on the platform account. `capturePayment`, `voidAuthorization`, `getPaymentIntent`, `retrievePaymentIntentExpanded`, and `createRefund` in `lib/stripe.ts` all try the connected account first, then fall back to the platform account if Stripe returns 404 (`isStripeResourceMissing` helper). Do not remove this fallback.

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

All 6 live. POST only, `Authorization: Bearer <CRON_SECRET>` required.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `send-draft-confirmation` | Every 30 min | Auto-send after 10-min draft window; Starter 30/month limit |
| `send-reminders` | Every hour | Reminders for next-24h appointments; Pro only |
| `sync-calendar` | Every hour | Sync Google/Microsoft; also on dashboard load |
| `check-expiring-authorizations` | Every 6 hours | Renew PaymentIntents expiring within 24h |
| `check-usage` | Daily 09:00 UTC | Warn Starter at 25/30 appointments; once/month |
| `check-unresolved-attendance` | Every hour | Reminder to business at event_end+2h; auto-resolve as attended at event_end+24h |

**`/api/cron/auto-confirm`** — intentionally disabled (returns `{ ok: true, disabled: true }`). The route is kept as a reserved slot in case auto-confirmation logic is needed in the future (e.g. Business plan, bulk flows). Do NOT delete it.

---

## 4. Plans & Pricing

| Feature | Starter (Free) | Pro (€39/$39/mo) |
|---------|---------------|-----------------|
| Protected appointments | 30/month | Unlimited |
| Confirmations | Email only | Email + SMS (planned) |
| Auto-resend | No | Yes (max 3/booking) |
| Per-appointment rules | No | Yes |
| White-label email | No | Yes (opt-in) |
| Stripe Express Dashboard | Yes (verified only) | Yes (verified only) |

**Pricing rules:** EU → EUR, rest → USD. Numeric price stays 39. Currency stored per booking and on `profiles.currency`. Derive symbol: `currency.toUpperCase() === "USD" ? "$" : "€"` — never hardcode `"eur"` or `"€"`.

**Currency flow:** `profiles.currency` → written to `calendar_bookings.currency` at sync/creation time (google/events, microsoft/events, events/create) → written to `booking_confirmations.currency` at send time → used for Stripe PaymentIntent currency. Editable in Settings → Account & Business. Changing it affects new bookings only; existing confirmed bookings keep their locked currency.

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
- **Pending:** Confirmation sent (or advance notice sent), awaiting customer authorization.
- **Confirmed:** Card authorized, booking protected.

### Protection Rules
Use `lib/noShowRules.ts` constants, never hardcode. Starter: global rules only. Pro: per-booking overrides. Overrides locked once confirmation is sent.

### Advance Notice Flow (events >7 days out)

**Problem:** Stripe card authorizations expire after 7 days. Sending a real `BookingConfirmation` for a far-future event results in an expired auth before the appointment.

**Solution:** Two-phase email flow:
1. **Advance notice** (`emails/AdvanceNotice.tsx`) — sent when the event is >7 days out. Informs client that card details will be requested closer to the date. Sets `calendar_bookings.notice_sent_at`. No `booking_confirmations` row created. Does NOT count toward Starter monthly limit.
2. **Real confirmation** (`emails/BookingConfirmation.tsx`) — sent when event enters the 7-day window. Normal Stripe auth flow from this point on.

**Sending rules:**
- Manual click on "Send confirmation": if >7 days → sends advance notice (one-shot, second click returns 400); if ≤7 days → sends real confirmation
- Cron (`send-draft-confirmation`): same branch logic. Query B picks up advance-noticed bookings now within 7 days for the real confirmation.
- Advance notice is one per booking — `notice_sent_at` is the guard.

**Dashboard UI after advance notice sent:**
- Badge: "Notice sent" (blue)
- Button: disabled, countdown "Resend available in X days" / "X hours" (last day) until `event_start - 7 days`
- `advanceNoticeSent` field on `DashboardEvent` (from `events/list`, mapped from `notice_sent_at`)
- `awaitingRealConfirmation = advanceNoticeSent && !confirmation` blocks `canSendConfirmation`

### Confirmation Flow

**Verification gate — `onboarding_completed = true` required at ALL send paths:**
1. `/api/bookings/send-confirmation`
2. `/api/bookings/send-draft-confirmation`
3. `/api/bookings/resend-confirmation`
4. `/api/cron/send-draft-confirmation`
5. `/api/notifications/send` (final safety net)

Do NOT add a new send path without this check. UI disables send buttons for non-verified users, but API enforces regardless.

**`draft_expires_at` must always be set** when creating `calendar_bookings` with `status = 'draft'`. Without it, the `lte` filter in `send-draft-confirmation` cron silently skips the booking forever.

**Exception — first sync:** When a calendar is first connected, bookings are created with `draft_expires_at = NULL` intentionally. This prevents the cron from auto-firing confirmations to all existing clients the moment a business connects their calendar. The `first_sync_completed` flag on `google_connections` controls this:
- `false` (default) → first sync → `draft_expires_at = NULL`, no auto-send
- After the sync loop completes → flip to `true` → subsequent events use the normal 10-min window
- Disconnecting resets to `false` so reconnecting re-triggers the first-sync behavior

**First-sync modal:** After OAuth callback, `SettingsContent.tsx` triggers a sync and checks `firstSync: true` in the response. If true, it shows a one-time modal: "X events detected — review and send confirmations when ready." with an OK button. Business sends manually at their own pace. Implemented in `SettingsContent.tsx` (not `dashboard/page.tsx`) because both Google and Microsoft OAuth callbacks land on `/dashboard/settings?{provider}=connected`.

### Datetime Snapshot (`display_datetime`)

**Problem solved:** Server-side `new Date(event_start).toLocaleTimeString()` runs in UTC (Vercel servers). A 14:00 local event shows as 12:00 in emails for UTC+2 users.

**Solution:** Pre-formatted string `"Saturday, 1 March 2026 at 14:00"` stored at booking creation/sync time in `calendar_bookings.display_datetime`, then copied into `booking_confirmations.display_datetime` at confirmation send time.

**`lib/formatDatetime.ts`** — three helpers:
- `formatDisplayDatetime(localDatetimeStr, timeFormat)` — for Google events (has `+HH:MM` offset, treat local parts directly via `Date.UTC` trick to avoid TZ interference)
- `formatDisplayDatetimeFromUtc(utcStr, timeFormat, timezone)` — for Microsoft/manual events (UTC string, appends Z if missing, converts via user's IANA timezone)
- `computeDisplayDatetime(start, timeFormat, timezone)` — dispatcher: returns null for all-day; detects offset presence to pick the right formatter

**Consumption pattern** (all client-facing datetime displays):
```ts
const hasSnapshot = display_datetime?.includes(" at ");
const eventDate = hasSnapshot ? display_datetime!.split(" at ")[0] : new Date(event_start).toLocaleDateString(...);
const eventTime = hasSnapshot ? display_datetime!.split(" at ")[1] : `${new Date(event_start).toLocaleTimeString(...)} - ...`;
```

**All locations that consume `display_datetime`:**
- `confirm/[token]/page.tsx` — server component, reads from `booking_confirmations`
- `api/notifications/send` — BookingConfirmation email
- `api/cron/send-reminders` — BookingReminder email
- `api/cron/send-draft-confirmation` — advance notice email
- `api/cron/check-expiring-authorizations` — ReauthorizationRequired email
- `api/attendance/mark` — NoShowReceipt email
- `api/bookings/[id]/refund` — RefundIssued email

**Resend carry-forward:** `resend-confirmation` copies `display_datetime` (and other snapshot fields) from the previous confirmation row to the new one — never re-derives it.

**Pre-migration fallback:** All locations check `?.includes(" at ")` before using the snapshot. Null/missing → fall back to live `new Date()` formatting (still UTC-wrong for old bookings, but unavoidable).

### Stripe Authorization
PaymentIntent on business's connected account. Auth only, no capture. Card/Apple Pay/Google Pay. Business notified after 3 failed attempts. PIs expire after 7 days — cron auto-renews and notifies client to re-authorize.

### Event Day Logic
Before event start: no attendance actions. After start: "Mark attended" → release auth, no charge. "Mark no-show" → capture fee, send receipt. Past events: read-only.

### Refunds & Disputes
Refunds tracked in `stripe_refunds`, client notified. Disputes tracked in `stripe_disputes`, business notified immediately. Track `evidence_due_by` — limited response window.

**Active dispute statuses** (used in Settings badge, DisputesModal, admin metrics — must be consistent across all three): `needs_response`, `warning_needs_response`, `under_review`, `warning_under_review`. Do NOT omit `warning_under_review`.

### Attendance Reminder & Auto-Resolve

**Problem:** Businesses sometimes forget to mark attendance after an appointment ends, leaving PaymentIntent authorizations open indefinitely.

**Solution (cron: `check-unresolved-attendance`, every hour):** Two passes over confirmed+card_authorized bookings not yet in `appointment_attendance`:

1. **Reminder pass** (event_end + 2h): Sends one batch email (`AttendanceReminder`) per business listing all unresolved appointments. Sets `booking_confirmations.attendance_reminder_sent_at` to prevent re-send across cron runs.
2. **Auto-resolve pass** (event_end + 24h): Marks attendance as `attended` with `auto_resolved = true`, calls `voidAuthorization()` (graceful if PI already expired). No charge is ever made during auto-resolve.

**Scope:** Confirmed bookings only (pending/draft ignored). All plans.

**Settings toggle:** `profiles.attendance_reminder_enabled` (default `true`). Toggled in Settings → Notification Preferences → "Mark Attendance Reminders". When `false`, cron skips both passes for that user.

**Email:** `emails/AttendanceReminder.tsx` — business-facing batch digest, always Attenda branding (no white-label). Sent via `sendAttendanceReminderEmail()` in `lib/email.ts`.

**Dashboard display:** Auto-resolved events show an "Auto-resolved" badge (same green as "Attended"). `autoResolvedMap` in `dashboard/page.tsx` and `autoResolved` prop on `EventCard` carry this flag. `appointment_attendance.auto_resolved` is the DB source of truth.

**Important:** Auto-resolve only marks attended + voids auth. It never captures a fee. The 24h timer resets from `event_end`, not `event_start`.

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
- **RLS:** All 23 tables have RLS enabled (migrations 005 + 007 + 008). All policies use `(select auth.uid())` wrapper for performance (migration 009) — never write `auth.uid()` bare in a policy.

### Rate Limiting — ALWAYS use `@/lib/rateLimit` (Redis), NEVER in-memory
Confirmation: 10/min | Stripe: 20/min | Refund: 5/min | General: 60/min | Auth: 5/min | Webhooks: 100/min

**Fail-closed behavior (STRICT_LIMITERS: `confirmation`, `auth`, `stripe`, `refund`):**
- Redis env vars **absent** → fail **open** with `console.warn` — Redis hasn't been set up yet, not a crash
- Redis env vars **present** but connection fails → fail **closed** — Redis crashed mid-operation (security risk)

This distinction matters: if `UPSTASH_REDIS_REST_URL`/`TOKEN` are not set, ALL rate limiting is disabled but the app still works. If Redis goes down after being configured, strict endpoints block to prevent enumeration/spam during the outage.

**Redis is configured and active in Vercel.** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set — rate limiting is enabled in production. Strict limiters (`confirmation`, `auth`, `stripe`, `refund`) fail closed if Redis becomes unreachable.

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
| `/connect` | ✅ Yes (Bearer token) | POST + `Authorization: Bearer` + HMAC-signed state returned as `{ url }` |
| `/status` | ✅ Yes | Session check + UUID validation; call with `Authorization: Bearer` header |
| `/callback` | ❌ No | HMAC state only — **NEVER add session check here**, user has no session during OAuth redirect |
| `/disconnect` | ✅ Yes | `Authorization: Bearer <token>` required |

- **`/connect` is POST, not GET** — vanilla Supabase JS stores sessions in localStorage, not cookies, so GET-navigation cannot carry auth. Frontend fetches `POST /api/google/connect` with Bearer token, gets back `{ url }`, then navigates to it.
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
**Business-owner (always Attenda branding):** `WelcomeStarter`, `WelcomePro`, `UsageWarning`, `AccountVerified`, `AccountRestricted`, `DisputeCreated`, `DisputeResolved`, `PaymentFailed`, `CalendarDisconnected`

**Call sites** that must select `white_label_enabled, business_logo_url` and pass `whiteLabel`: `notifications/send`, `cron/send-reminders`, `attendance/mark`, `bookings/[id]/refund`, `cron/check-expiring-authorizations`

**Special wiring:**
- `RefundIssued`: retrieve card via `stripe.paymentIntents.retrieve` with `expand: ["payment_method"]`
- `AccountVerified/Restricted`: via `account.updated` webhook — NOT in `/connect/return` (stale TODO there is intentional)

**Design:** Indigo (#6366f1) info/CTA cards · Red: NoShowReceipt · Green: RefundIssued, DisputeResolved (won) · Amber: AccountRestricted, PaymentFailed · Red: DisputeCreated, DisputeResolved (lost)

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
| `google_tokens` | **Legacy/orphaned** — predecessor to `google_connections`, no code references it. RLS enabled, deny-all. Do not use. |
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

RLS on `appointment_attendance` and `appointment_no_show_overrides` must use `(select auth.uid()) = user_id`.

### Notable `profiles` Columns
`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `stripe_account_id`, `stripe_account_status`, `onboarding_completed`, `business_name`, `business_address`, `business_country`, `business_vat`, `white_label_enabled`, `business_logo_url`, `week_start_day`, `time_format`, `timezone`, `currency`, `deleted_at`

**No `email` column** — get from `user` object via `getAuthenticatedUser()`.

**`booking_confirmations.currency`** is source of truth for a confirmed booking's currency. Used throughout: `confirmation-status` → `EventCard` → `RefundModal`, `confirm/[token]`, `attendance/mark`, `bookings/[id]/refund`. Never hardcode `"eur"` or `"€"`.

**`calendar_bookings.currency`** is source of truth for draft bookings (set at sync/create time from `profiles.currency`). Flows into `dashboard/page.tsx` currencyMap as seed; confirmation-level currency overwrites it once a confirmation exists.

### Migrations (all deployed to Supabase)
- `001` — Stripe Connect fields, business onboarding
- `002` — Webhook idempotency, payment failure tracking
- `003` — Refund/dispute tables
- `004` — GDPR export/deletion, anonymization
- `005` — RLS on 17 tables
- `006` — `google_connections.status` column
- `007` — RLS on `booking_protections`
- `008` — Security: RLS on `google_tokens` (legacy orphaned table); `SET search_path = ''` on all 7 DB functions
- `009` — Performance: all RLS policies updated to `(select auth.uid())`; 5 missing FK indexes added; duplicate `idx_profiles_stripe_account` index dropped
- `010` — Policy snapshot fields on `booking_confirmations` (`no_show_fee_cents`, `grace_period_minutes`, `late_cancel_hours`) — locked at send time, null for pre-migration rows
- `011` — `display_datetime` column on `calendar_bookings` (computed at sync/creation)
- `012` — `display_datetime` column propagated to `booking_confirmations` (copied at confirmation send + resend)
- `013` — Attendance reminder: `booking_confirmations.attendance_reminder_sent_at` (dedup), `profiles.attendance_reminder_enabled` (toggle, default true), `appointment_attendance.auto_resolved` (flag)
- `014` — `calendar_bookings.currency` column (backfill from `profiles.currency` at sync time)
- `015` — `google_connections.first_sync_completed` column (BOOLEAN DEFAULT false; guards first-sync auto-send prevention)

### Environment Variables

**Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Google (Calendar):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
**Microsoft:** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` (`https://attenda.app/api/microsoft/callback`), `MICROSOFT_TENANT_ID` (`common`)
**Email:** `RESEND_API_KEY`, `EMAIL_FROM`
**SMS (planned):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER`
**Security:** `CRON_SECRET`, `OAUTH_STATE_SECRET`, `INTERNAL_API_SECRET`, `TOKEN_ENCRYPTION_KEY` (64 hex chars), `ADMIN_EMAILS`
- All security secrets must be **unique, high-entropy values** — never reuse the same value across variables (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- When rotating `CRON_SECRET`: also update the `Authorization: Bearer` header in all 6 jobs on cron-job.org
**App:** `NEXT_PUBLIC_APP_URL` (`https://attenda.app`)
**Stripe:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` (single price ID used by both `create-checkout` and `create-checkout-guest`)
**Redis:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (configured in Vercel — rate limiting active)
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
- **Checkout API calls:** always check `res.ok && data.url` before redirecting — a 429/500 returns JSON without a `url` field and must not silently fall through
- **Rate limiter + Redis:** if Redis env vars are absent, `checkRateLimit()` always returns `{ success: true }` — the app works but has no rate limiting. Do NOT add Redis env vars without testing first, as that activates fail-closed behavior for strict limiters.

### Calendar
- **`/callback`:** NEVER add session verification — HMAC state is the only protection; user has no session during OAuth redirect
- **Disconnect:** must include `Authorization: Bearer` + check `res.ok` before updating UI state
- **Reconnect:** callback MUST set `status = 'connected'`
- **Query params:** Settings page useEffects must preserve other params when clearing their own

### Database
- **`booking_confirmations.currency`** is source of truth — never hardcode `"eur"`/`"€"`
- **`display_datetime` is source of truth for client-facing datetime display** — never call `new Date(event_start).toLocaleTimeString()` in server routes/components (runs UTC). Use the snapshot; fall back to live formatting only for pre-migration rows. See "Datetime Snapshot" in §5.
- **`appointment_attendance` / `appointment_no_show_overrides`** use `user_id`, not `booking_id`
- **RLS policies:** always use `(select auth.uid())` not bare `auth.uid()` — the wrapper makes Postgres evaluate it once (initplan) instead of per-row
- **DB functions:** always add `SET search_path = ''` and schema-qualify all table refs (`public.tablename`) to prevent search_path injection

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
