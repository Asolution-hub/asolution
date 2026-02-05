# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Important: Development Rules

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
- Both share the same design language, UI components, and UX quality

**Design principles**: Premium, Calm, Trustworthy, Modern

**Design system** (as of 2026-02-01):
- Colors: Indigo primary (`#6366F1`), Teal accent (`#14B8A6`)
- Typography: Inter font (weights 400-800)
- Style: DataPulse-inspired SaaS analytics aesthetic

---

## 2. Core Value Proposition

Businesses lose money because customers don't show up.

Attenda solves this by:
- Sending booking confirmations
- Clearly explaining no-show rules
- Requiring payment authorization via Stripe
- Charging **only** if the business manually confirms a no-show

**Critical rules:**
- No automatic charging ever
- No hidden behavior
- No money charged unless business explicitly marks no-show

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
- **Database/Auth**: Supabase (PostgreSQL + magic link auth)
- **Payments**: Stripe (subscriptions + card authorization)
- **External APIs**: Google Calendar (OAuth2), Resend (email)
- **Path alias**: `@/*` maps to project root

---

## 5. Architecture

### Directory Structure

```
App/attenda/
├── app/
│   ├── api/              # API route handlers
│   │   ├── stripe/       # Stripe endpoints (checkout, webhooks, portal)
│   │   ├── bookings/     # Booking management
│   │   └── auth/         # Authentication endpoints
│   ├── dashboard/        # Protected dashboard (main UI)
│   ├── login/            # Magic link authentication
│   ├── confirm/[token]/  # Public client confirmation page (Stripe Payment Element)
│   ├── welcome/          # Post-checkout welcome page for new Pro users
│   └── components/       # Shared React components
├── lib/                  # Utilities and helpers
├── migrations/           # SQL migrations for Supabase
```

### Key Libraries

- `lib/supabase.ts` / `lib/supabaseAdmin.ts` - Client vs admin Supabase instances
- `lib/auth.ts` - Authentication helpers (verifyUserAccess, verifyCronSecret, verifyInternalSecret, verifyOrigin)
- `lib/validation.ts` - Input validation, rate limiting, IP extraction
- `lib/encryption.ts` - AES-256-GCM token encryption for OAuth tokens
- `lib/googleAuth.ts` - OAuth2 client with encrypted token storage
- `lib/stripe.ts` - Stripe client with helpers (authorization, capture, void, subscriptions)
- `lib/noShowRules.ts` - Resolves global + per-appointment rule overrides
- `lib/contactParser.ts` - Extracts email/phone from event text
- `lib/email.ts` - Email sending via Resend
- `lib/useUser.ts` - React hook for auth state
- `lib/plans.ts` - Plan configuration (Starter/Pro/Business) with Stripe price IDs
- `lib/types.ts` - Shared TypeScript types

### Key API Routes (Stripe)

- `app/api/stripe/create-checkout/route.ts` - Pro checkout for logged-in users
- `app/api/stripe/create-checkout-guest/route.ts` - Pro checkout for new users (no auth)
- `app/api/stripe/create-authorization/route.ts` - Card authorization for booking confirmation
- `app/api/stripe/customer-portal/route.ts` - Stripe billing portal redirect
- `app/api/stripe/webhook/route.ts` - Handles all Stripe webhook events

### Database Tables (Supabase)

- `profiles` - User accounts and plan selection
- `google_connections` - OAuth tokens
- `calendar_bookings` - Synced appointments
- `booking_confirmations` - Confirmation tokens and status
- `no_show_settings` - Global rules per user
- `appointment_no_show_overrides` - Per-event rule overrides

---

## 6. Plans & Pricing

### Starter (Free)
- Max 30 protected appointments per month
- Email confirmations only
- Automatic confirmation after draft window
- No auto-resend
- Limited settings
- Upgrade CTA visible everywhere

### Pro (€39 / $39 per month)
- Unlimited appointments
- Email + SMS confirmations
- Auto-resend available
- Per-appointment protection rules
- Priority UX / visual polish

### Business
- Not available yet
- Code should anticipate it without exposing UI

### Pricing Rules
- EU countries → EUR
- Rest of world → USD
- Numeric price stays the same (39)

---

## 7. Stripe Rules (NON-NEGOTIABLE)

Stripe is used for:
- Pro subscriptions
- Card authorization during confirmation

**Critical flow:**
1. Client authorizes card when confirming booking
2. No money is charged at confirmation
3. Charge happens **only** if:
   - Event has started AND
   - Business clicks "Mark no-show"
4. "Mark attended" → no charge
5. "Confirmation expired" → no charge

**This must never be violated.**

---

## 8. Event & Booking Lifecycle

### Statuses

**Confirmation**: `draft` → `pending` → `confirmed` | `expired`
**Attendance**: `pending` → `attended` | `no_show`

### Calendar Event Ingestion

For each connected calendar:
- Fetch upcoming and recent events
- Each calendar event maps to one internal booking

**Contact Extraction:**
- Scan both event title AND description
- Priority: First valid email → use `email` channel; else first valid phone → use `sms` channel
- Strip contact info from displayed event title
- Store contact separately as `client_contact`
- Store channel as `email` | `sms`

**If no contact found:**
- Event is still shown in dashboard
- Confirmation actions are disabled
- UI warning: "No contact found — add email or phone to event"

### Booking States

**Draft:**
- Booking created from calendar event
- Confirmation NOT sent yet
- Draft window = configurable minutes
- During draft:
  - Business can edit protection rules (Pro only)
  - Business can manually send confirmation
- After draft expires:
  - Starter → auto-send once
  - Pro → auto-send + optional auto-resend

**Pending:**
- Confirmation has been sent
- Waiting for customer confirmation
- Payment authorization may or may not be completed yet

**Confirmed:**
- Customer confirmed booking
- Stripe authorization completed
- Booking is protected

### Protection Rules

Each booking has protection rules:
- No-show fee (currency minor units)
- Grace period (minutes)
- Late cancellation window (hours)

**Starter:** Uses global protection rules only, cannot edit per booking
**Pro:** Can override protection rules per booking
**Important:** Overrides are locked once confirmation is sent

### Confirmation Flow

Confirmation may be sent:
- Automatically (after draft window expires)
- Manually (via dashboard button)

Sending confirmation:
- Creates a `booking_confirmation` record
- Generates a unique token
- Sends email or SMS based on detected channel

### Confirmation Message Must Include:
- Event details
- No-show fee
- Cancellation window
- Clear statement: "Your card will be authorized, not charged"
- Stripe authorization link (Card / Apple Pay / Google Pay)

### Stripe Authorization (Customer Side)

When customer clicks confirmation link:
- Stripe Checkout / Payment Intent is created
- Authorization only — no funds captured
- Supported methods: Card, Apple Pay, Google Pay

**If authorization fails:** Booking remains unconfirmed

### Event Day Logic

**Before event start:**
- No attendance actions allowed

**After event start:**

| Action | Result |
|--------|--------|
| Mark attended | Booking finalized as attended, authorization released, no charge |
| Mark no-show | No-show fee captured via Stripe, booking finalized as no-show, receipt sent |

**Only manual action can trigger a charge.**

### Past Events

For past events:
- No action buttons shown
- Only final state displayed: Attended | No-Show applied | Confirmation expired

---

## 9. Dashboard Logic

### Event Cards

**Future events** (Draft / Pending / Confirmed):
- Show relevant buttons only
- "Mark attended" / "Mark no-show" buttons: DISABLED until event start time

**Past events** (event has ended):
- No action buttons shown
- Only final state displayed: Attended | No-Show applied | Confirmation expired

### Buttons (Strict Rules)

| Button | When Enabled |
|--------|--------------|
| Send confirmation | Draft state, contact exists, within limits |
| Send reminder | Pending/Confirmed, Pro plan, before event start |
| Mark attended | After event start, confirmed booking |
| Mark no-show | After event start, confirmed booking with authorization |

Buttons must enable/disable based on time, plan, and status. Never allow illegal actions.

### Protection Visibility

Always show: Fee, Grace period, Late cancellation window

- **Starter**: Global only
- **Pro**: Per-event editable

---

## 10. Monthly Limit (Starter)

- Starter limited to 30 protected appointments per calendar month
- When limit reached:
  - No confirmations are sent
  - UI shows: "Protection not applied — monthly limit reached"
- Dashboard counter: "Protection used this month: X / 30"
- At 25/30: Send upgrade encouragement email
- Starter dashboard includes Upgrade to Pro CTA

---

## 11. Calendar Integrations

### Required (now)
- Google Calendar (already implemented)

### Designed for future
- Apple Calendar
- Microsoft Outlook Calendar

Architecture must be provider-agnostic — allow new calendars without refactoring core booking logic.

---

## 12. Authentication & Security

### Authentication
- Supabase authentication (magic links + Google OAuth login)
- Google OAuth for calendar integration (separate from login)
- Session management via Supabase cookies

**Note:** Google OAuth is used in two places:
1. **Login** - Via Supabase Auth (configured in Supabase dashboard)
2. **Calendar** - Direct OAuth2 for Google Calendar API access

### Security Architecture (Implemented 2026-02-03)

**API Route Protection:**
- All routes use `verifyUserAccess()` from `lib/auth.ts`
- UUID validation on all user/resource IDs
- Rate limiting on all endpoints via `checkRateLimit()`
- Ownership verification on all resource access

**Token Security:**
- OAuth tokens encrypted with AES-256-GCM (`lib/encryption.ts`)
- Cron jobs authenticated via `verifyCronSecret()`
- Internal API calls authenticated via `verifyInternalSecret()`
- CSRF protection via `verifyOrigin()`

**Headers & CSP:**
- Security headers applied in `middleware.ts`
- Strict CSP (no unsafe-eval)
- HSTS enabled in production
- X-Frame-Options: DENY

**Key Security Files:**
- `lib/auth.ts` - All authentication/authorization helpers
- `lib/validation.ts` - Input validation, rate limiting, IP extraction
- `lib/encryption.ts` - Token encryption utilities
- `middleware.ts` - Security headers, CSP

### Security Rules
- Never trust client input
- All critical logic server-side
- High security by default
- All secrets via environment variables (never NEXT_PUBLIC_)
- Calendar data must be isolated per user

### Charging Prerequisites (NON-NEGOTIABLE)

No booking may ever be charged without ALL of the following:
1. Confirmation was sent to customer
2. Customer completed Stripe authorization
3. Business manually clicked "Mark no-show"

If any prerequisite is missing, charge MUST fail.

---

## 13. Email System

### Required Emails
- Welcome email (different copy for Starter vs Pro)
- Usage warning email (at 25/30)
- Confirmation emails
- Reminder emails (if allowed by plan)

### Email Requirements
- Feel premium
- Be legally safe
- Be very clear

---

## 14. Landing Page (Redesigned 2026-02-01)

Premium DataPulse-inspired design with animated charts and extended content.

### Header (Glassmorphism Design)
- Floating glassmorphism style with backdrop blur and subtle indigo border
- Logo with "Attenda" text in brand indigo color on the left
- Centered navigation: Features, Blog, Pricing
- Right side: Theme toggle, Sign In link, "Start Free Trial" button
- Mobile: Hamburger menu with slide-in panel containing:
  - Logo + theme toggle + close button in header
  - Navigation links (Features, Pricing, Blog)
  - Sign In and Start Free Trial buttons at bottom

### Cookie Consent
- Minimal Vercel-style notification at bottom center
- Appears after 1.5s delay for better UX
- Glassmorphism card with "Accept" (indigo) and "Decline" buttons
- Links to Privacy Policy
- Saves preference to localStorage
- Responsive: horizontal on desktop, stacked on mobile
- Component: `app/(landing)/components/CookieConsent.tsx`

### Sections (in order)
1. **Header** - Floating glassmorphism nav with centered links
2. **Hero** - Split layout: text left (badge, gradient heading, CTAs, stats), animated revenue chart right with floating metrics
3. **How It Works** - 4-step numbered flow (Connect → Protection → Confirm → Protected)
4. **Features** - 6-card grid with icons (Calendar Sync, Auto Confirmations, Protection, Payments, Reminders, Rules)
5. **Dashboard Preview** - Analytics mockup with metrics and charts
6. **Use Cases** - 4 cards (Salons, Medical, Consultants, Restaurants)
7. **Social Proof** - Animated counters + company logos
8. **Pricing** - 3-tier cards (Starter/Pro/Business)
9. **FAQ** - 7-question accordion
10. **Testimonials** - 3 customer quotes with avatars
11. **Trust Badges** - Stripe, GDPR, Uptime, Setup
12. **Final CTA** - Dark section with gradient background
13. **Footer** - 5-column layout (Brand, Product, Company, Resources, Legal)

### Key Components
- `app/(landing)/components/Header.tsx` - Glassmorphism floating header with centered nav
- `app/(landing)/components/MobileMenu.tsx` - Slide-in mobile menu with CTAs
- `app/(landing)/components/ThemeToggle.tsx` - Light/dark mode toggle
- `app/(landing)/components/CookieConsent.tsx` - Minimal cookie notification
- `app/(landing)/components/Hero.tsx` - Animated canvas chart showing revenue impact
- `app/(landing)/components/HowItWorks.tsx` - Step-by-step flow
- `app/(landing)/components/Features.tsx` - Feature grid with SVG icons
- `app/(landing)/components/DashboardPreview.tsx` - Analytics mockup with mini charts
- `app/(landing)/components/UseCases.tsx` - Business type cards
- `app/(landing)/components/FAQ.tsx` - Collapsible accordion
- `app/(landing)/components/Testimonials.tsx` - Customer quotes
- `app/(landing)/components/TrustBadges.tsx` - Security/trust indicators
- `app/(landing)/components/FinalCTA.tsx` - Dark CTA section

---

## 15. Social Proof & Marketing

Located after Use Cases section on landing page:
- Animated counters with intersection observer (animate on scroll into view)
- Current metrics displayed:
  - "2,954+ Protections Applied"
  - "€88,462 Revenue Recovered"
  - "94% Show-up Rate"
- Company logos section ("Trusted by service professionals at...")
- Placeholder company names: Salon Pro, MediBook, CoachHub, BookSmart, WellnessApp

---

## 16. Blog & SEO (Complete 2026-02-01)

### Blog Articles (5 SEO-optimized articles)
1. **The True Cost of No-Shows** (`/blog/true-cost-of-no-shows`)
   - Financial impact analysis with cost breakdown chart
   - Industry statistics on no-show rates

2. **Why Clients Don't Show Up** (`/blog/why-clients-dont-show-up`)
   - Psychology of no-shows with commitment spectrum visualization
   - Understanding client behavior patterns

3. **5 Strategies to Reduce No-Shows** (`/blog/5-strategies-reduce-no-shows`)
   - Actionable strategies with impact comparison chart
   - Best practices for appointment management

4. **The Card Authorization Solution** (`/blog/card-authorization-solution`)
   - Hotel model explanation with step-by-step flow diagram
   - How card authorization works without charging

5. **No-Show Policy Best Practices** (`/blog/no-show-policy-best-practices`)
   - Policy templates with effectiveness metrics
   - Legal and communication guidelines

### Blog Features
- SEO metadata on each article (title, description, keywords, OpenGraph)
- Professional SVG illustrations and charts
- Responsive design matching landing page aesthetic
- "Back to Blog" navigation
- CTA sections linking to sign-up
- Blog index page at `/blog` with article cards

### Structure
- Blog link: Header nav (desktop), Hamburger menu (mobile), Footer
- Clean URLs with descriptive slugs
- Meta tags and accessibility best practices

---

## 17. UI/UX Rules

- Premium, minimal, calm
- No clutter
- Starter feels complete but limited
- Pro feels clearly more powerful
- Visual affordances for Pro-only features

---

## 18. Environment Variables

Required in `.env.local` (all configured in Vercel):

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Google OAuth:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (https://attenda.app/api/google/callback)

**Email/SMS:**
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `SMS_PROVIDER` (currently "mock")
- `SMS_FROM`

**Security:**
- `CRON_SECRET` - For cron job authentication
- `OAUTH_STATE_SECRET` - For OAuth CSRF protection
- `INTERNAL_API_SECRET` - For server-to-server API calls
- `TOKEN_ENCRYPTION_KEY` - 64 hex chars for AES-256-GCM OAuth token encryption

**App:**
- `NEXT_PUBLIC_APP_URL` (https://attenda.app)

**Stripe (Implemented 2026-02-05):**
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_live_xxx or sk_test_xxx)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_live_xxx or pk_test_xxx)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (whsec_xxx)
- `STRIPE_PRO_PRICE_ID` - Price ID for Pro subscription (price_xxx)

**⚠️ IMPORTANT: Vercel Environment Variable Gotcha**
When pasting values into Vercel environment variables, invisible newline characters often get included at the end. This causes cryptic errors like `invalid_client` or validation failures. Always:
1. After pasting, press **End** then **Backspace** to remove trailing newlines
2. Or delete and re-type the value manually
3. Check the debug endpoint `/api/debug/google-config` to verify no newlines

---

## 19. Implementation Status (Updated 2026-02-05)

### ✅ Complete (Working in Production)

| Feature | Status | Notes |
|---------|--------|-------|
| **Deployed to Vercel** | 100% | Live at attenda.app |
| **Authentication** | 100% | Magic links + Google OAuth via Supabase |
| **Security Hardening** | 100% | Full audit completed, all issues fixed |
| **Landing Page** | 100% | Full redesign with animated charts, 13 sections |
| **Header** | 100% | Glassmorphism floating nav, centered links, mobile menu |
| **Blog Section** | 100% | 9 SEO articles with illustrations |
| **Cookie Consent** | 100% | Minimal Vercel-style notification |
| **Google Calendar Integration** | 100% | OAuth2, event sync, encrypted token storage |
| **Dashboard** | 100% | Event cards, filtering, Pro/Starter plan display |
| **Settings Page** | 100% | Plan display, Pro features, subscription management |
| **Optimistic UI** | 100% | No page reloads, instant feedback on actions |
| **Stripe Integration** | 100% | Subscriptions, card auth, no-show charging (2026-02-05) |
| Booking Management | 95% | Draft → Pending → Confirmed flow |
| No-Show Rules (Global) | 95% | Settings page working |
| Monthly Limits (Starter) | 90% | Counter, limits enforced |
| Plan System | 100% | Starter/Pro via Stripe subscriptions |
| Email Confirmations | 85% | Via Resend, basic templates |
| Social Proof Counters | 100% | Animated counters with company logos |
| **Mobile Touch Targets** | 100% | WCAG 2.5.5 compliant (44px minimum) |
| **Dark Mode** | 100% | Full support including mobile safe areas |
| **Accessibility** | 95% | ARIA attributes, status icons, loading states |

### 💳 Stripe Features (Implemented 2026-02-05)

| Feature | Status | Notes |
|---------|--------|-------|
| Pro Subscriptions | ✅ | Stripe Checkout for €39/month subscription |
| Guest Checkout | ✅ | New users can buy Pro directly from landing page (no login required) |
| Customer Portal | ✅ | Manage subscription via Stripe portal |
| Card Authorization | ✅ | PaymentIntent with manual capture on confirmation |
| No-Show Charging | ✅ | Captures authorized amount on "Mark no-show" |
| Authorization Release | ✅ | Voids authorization on "Mark attended" |
| Webhook Handlers | ✅ | Handles subscription, checkout, and payment events |
| Auto Account Creation | ✅ | Webhook creates user account after guest checkout via Supabase invite |
| Stripe Charges Audit | ✅ | All Stripe operations logged to stripe_charges table |

**Pro Signup Flows:**

| From | Flow |
|------|------|
| Landing page (new user) | Get Pro → Stripe Checkout → `/welcome` page → Magic link email → Dashboard |
| Dashboard (existing user) | Upgrade to Pro → Stripe Checkout → Settings page with success message |

### 🔒 Security Features (Updated 2026-02-05)

| Feature | Status | Notes |
|---------|--------|-------|
| API Authentication | ✅ | All routes use verifyUserAccess() |
| OAuth Token Encryption | ✅ | AES-256-GCM via lib/encryption.ts |
| Internal API Secret | ✅ | Server-to-server calls authenticated |
| CSRF Protection | ✅ | Origin verification in lib/auth.ts |
| Rate Limiting | ✅ | All endpoints protected (in-memory) |
| Input Validation | ✅ | UUID validation, sanitization |
| CSP Headers | ✅ | Strict policy in middleware.ts |
| Timing-Safe Comparisons | ✅ | All secret comparisons |
| Event Time Validation | ✅ | Cannot mark attendance before event starts |
| Rule Locking | ✅ | Protection rules locked after confirmation sent |
| Channel Detection | ✅ | Auto-detect email vs SMS from contact format |
| Stripe Webhook Verification | ✅ | Signature verification on all webhooks |

### ⚠️ Partial (Needs Work)

| Feature | Status | Notes |
|---------|--------|-------|
| No-Show Rules (Per-Event) | 70% | API complete with locking, modal UI incomplete |
| SMS Capability | 40% | Channel detection works, mock provider only |
| Distributed Rate Limiting | 0% | Needs Redis/Upstash for production scale |

### ❌ Not Started

| Feature | Priority | Notes |
|---------|----------|-------|
| Premium Email Templates | 🟡 HIGH | Welcome, warning, reminder emails |
| SMS Provider Connection | 🟠 MEDIUM | Twilio/Telnyx integration |
| Multi-Calendar Support | 🟠 MEDIUM | Flags exist, no implementation |
| Apple/Outlook Calendar | 🟠 MEDIUM | OAuth designed, not built |
| Currency Handling (EUR/USD) | 🔵 LOW | Only EUR currently |

---

## 20. Prioritized Next Steps

### ~~Phase 1: Payment System~~ ✅ COMPLETE (2026-02-05)

Stripe integration is fully implemented:
- ✅ Stripe SDK installed
- ✅ Environment variables configured
- ✅ Stripe customer creation on checkout
- ✅ Pro subscription via Stripe Checkout
- ✅ Card authorization on confirmation page (Stripe Payment Element)
- ✅ No-show charging (captures authorized payment)
- ✅ Webhook handlers for all events
- ✅ Customer portal for subscription management

### Phase 2: Core Experience Polish (Current Priority)

1. **Complete AppointmentOverrideModal** - Per-event protection editing for Pro users
2. **Premium email templates** - Styled confirmation, welcome, warning emails
3. **SMS provider integration** - Connect Twilio or Telnyx

### Phase 3: Marketing & Growth

1. ~~**Blog section**~~ ✅ Complete - 9 SEO articles with illustrations
2. ~~**Social proof counters**~~ ✅ Complete - Animated counters implemented
3. ~~**Landing page redesign**~~ ✅ Complete - Full DataPulse-style redesign
4. ~~**Header redesign**~~ ✅ Complete - Glassmorphism floating nav
5. ~~**Cookie consent**~~ ✅ Complete - Minimal Vercel-style notification
6. ~~**Stripe integration**~~ ✅ Complete - Full payment system

### Phase 4: Future Features

1. **Multi-calendar support** - Multiple Google calendars per user
2. **Apple Calendar integration** - OAuth + CalDAV
3. **Outlook Calendar integration** - Microsoft Graph API
4. **Currency handling** - EUR for EU, USD for rest of world

---

## 21. Database Tables (Complete Reference)

Current tables in use:

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts, plan, auto-resend, Stripe customer/subscription IDs |
| `google_connections` | OAuth tokens per user |
| `calendar_bookings` | Synced events from calendar |
| `booking_confirmations` | Confirmation tokens, status, Stripe payment intent, card auth status |
| `no_show_settings` | Global rules per user |
| `appointment_no_show_overrides` | Per-event rule overrides |
| `appointment_attendance` | Attendance records (attended/no_show) |
| `stripe_charges` | Audit log for all Stripe authorization/capture/void operations |

**Stripe-related columns (added 2026-02-05):**

`profiles` table:
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Active subscription ID
- `subscription_status` - Status (active, canceled, past_due, etc.)

`booking_confirmations` table:
- `stripe_payment_intent_id` - PaymentIntent for card authorization
- `card_authorized` - Boolean, true when card auth completed
- `card_authorized_at` - Timestamp of authorization
- `charge_captured` - Boolean, true when no-show fee charged
- `charge_captured_at` - Timestamp of charge

**Migration file:** `migrations/stripe-integration.sql` (run in Supabase SQL Editor)

---

## 22. Goal

Building a real SaaS with real money and real customers.

**Optimize for:**
- Trust
- Correctness
- Security
- Long-term maintainability
- Premium perception

---

## 23. Critical Reminders

- **Stripe integration complete** (2026-02-05) — subscriptions, card auth, and no-show charging all working
- **Site is LIVE** at https://attenda.app — deployed on Vercel
- **Security audit completed** (2026-02-03) — all vulnerabilities fixed
- **Calendar protection logic hardened** (2026-02-05) — event time validation, rule locking, channel detection
- OAuth tokens are now encrypted with AES-256-GCM
- **Google Calendar OAuth working** (2026-02-04) — login + calendar connection both functional
- Landing page complete (2026-02-01) — glassmorphism header, 13 sections, indigo/teal color scheme
- Blog complete (2026-02-01) — 9 SEO-optimized articles with professional illustrations
- Cookie consent implemented — minimal Vercel-style notification with localStorage persistence
- **Database note:** `profiles` table does NOT have an `email` column — get email from `user` object instead
- **Run migrations:** Before using Stripe, run `migrations/stripe-integration.sql` in Supabase
- Never bypass the "manual no-show confirmation" rule — it's legally and ethically critical
- For production scale: implement Redis-based rate limiting (currently in-memory)
- **Vercel env vars:** Always check for trailing newlines when pasting (see Section 18)
- **Stripe env vars required:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`
- **Stripe webhook events required:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `payment_intent.succeeded`, `payment_intent.canceled`, `charge.captured`
