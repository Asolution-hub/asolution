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
│   ├── dashboard/        # Protected dashboard (main UI)
│   ├── login/            # Magic link authentication
│   ├── confirm/[token]/  # Public client confirmation page
│   └── components/       # Shared React components
├── lib/                  # Utilities and helpers
```

### Key Libraries

- `lib/supabase.ts` / `lib/supabaseAdmin.ts` - Client vs admin Supabase instances
- `lib/auth.ts` - Authentication helpers (verifyUserAccess, verifyCronSecret, verifyInternalSecret, verifyOrigin)
- `lib/validation.ts` - Input validation, rate limiting, IP extraction
- `lib/encryption.ts` - AES-256-GCM token encryption for OAuth tokens
- `lib/googleAuth.ts` - OAuth2 client with encrypted token storage
- `lib/noShowRules.ts` - Resolves global + per-appointment rule overrides
- `lib/contactParser.ts` - Extracts email/phone from event text
- `lib/email.ts` - Email sending via Resend
- `lib/useUser.ts` - React hook for auth state
- `lib/plans.ts` - Plan configuration (Starter/Pro/Business)
- `lib/types.ts` - Shared TypeScript types

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

### Event Ingestion
- Events pulled from connected calendar
- Email/phone may appear in event title or description
- System must:
  - Detect email/phone (improve contact parsing)
  - Strip contact from displayed title
  - Store contact separately
  - Show contact clearly in dashboard

### Draft Phase
- New event → Draft
- Draft window = configurable minutes
- During draft:
  - User can edit protection rules
  - Confirmation is NOT sent yet

### Confirmation
- After draft expires:
  - Starter → auto-send once
  - Pro → auto-send + optional auto-resend
- Manual "Send confirmation" allowed when applicable

### Confirmation Message Must Include:
- Event info
- No-show fee
- Cancellation window
- Clear statement: "Card is authorized, not charged"
- Stripe authorization link (card / Apple Pay / etc.)

---

## 9. Dashboard Logic

### Event Cards

**Future events** (Draft / Pending / Confirmed):
- Show relevant buttons only

**Past events**:
- No buttons
- Show final status only: Attended | No-Show applied | Confirmation expired

### Buttons (Strict Rules)
- "Send confirmation"
- "Send reminder"
- "Mark attended"
- "Mark no-show"

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

**⚠️ IMPORTANT: Vercel Environment Variable Gotcha**
When pasting values into Vercel environment variables, invisible newline characters often get included at the end. This causes cryptic errors like `invalid_client` or validation failures. Always:
1. After pasting, press **End** then **Backspace** to remove trailing newlines
2. Or delete and re-type the value manually
3. Check the debug endpoint `/api/debug/google-config` to verify no newlines

**Needed for Stripe (NOT YET CONFIGURED):**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## 19. Implementation Status (Updated 2026-02-04)

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
| **Settings Page** | 100% | Plan display, Pro features, no-show rules link |
| **Optimistic UI** | 100% | No page reloads, instant feedback on actions |
| Booking Management | 95% | Draft → Pending → Confirmed flow |
| No-Show Rules (Global) | 95% | Settings page working |
| Monthly Limits (Starter) | 90% | Counter, limits enforced |
| Plan System | 90% | Starter/Pro tiers working, manual assignment |
| Email Confirmations | 85% | Via Resend, basic templates |
| Social Proof Counters | 100% | Animated counters with company logos |
| **Mobile Touch Targets** | 100% | WCAG 2.5.5 compliant (44px minimum) |
| **Dark Mode** | 100% | Full support including mobile safe areas |
| **Accessibility** | 95% | ARIA attributes, status icons, loading states |

### 🔒 Security Features (Implemented 2026-02-03)

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

### ⚠️ Partial (Needs Work)

| Feature | Status | Notes |
|---------|--------|-------|
| No-Show Rules (Per-Event) | 60% | API exists, modal UI incomplete |
| SMS Capability | 30% | Mock provider only |
| Distributed Rate Limiting | 0% | Needs Redis/Upstash for production scale |
| Social Proof Values | 0% | Currently showing 0 - needs real data or placeholders |

### ❌ Not Started (Critical Gaps)

| Feature | Priority | Notes |
|---------|----------|-------|
| **Stripe Subscriptions** | 🔴 CRITICAL | Cannot process payments |
| **Stripe Card Authorization** | 🔴 CRITICAL | Confirmation page missing Stripe UI |
| **Stripe Charging** | 🔴 CRITICAL | Cannot charge for no-shows |
| Premium Email Templates | 🟡 HIGH | Welcome, warning, reminder emails |
| SMS Provider Connection | 🟠 MEDIUM | Twilio/Telnyx integration |
| Multi-Calendar Support | 🟠 MEDIUM | Flags exist, no implementation |
| Apple/Outlook Calendar | 🟠 MEDIUM | OAuth designed, not built |
| Currency Handling (EUR/USD) | 🔵 LOW | Only EUR currently |

---

## 20. Prioritized Next Steps

### Phase 1: Payment System (BLOCKING - Must Complete First)

Without Stripe, the product cannot generate revenue or fulfill its core promise.

1. **Add Stripe SDK** - `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
2. **Environment variables** - Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
3. **Stripe customer creation** - Create Stripe customer when user signs up
4. **Subscription checkout** - Implement Pro plan subscription flow
5. **Confirmation page Stripe UI** - Add card authorization during confirmation
6. **Charge on no-show** - Implement payment capture when business marks no-show
7. **Webhook handlers** - Handle subscription events, payment failures

### Phase 2: Core Experience Polish

1. **Complete AppointmentOverrideModal** - Per-event protection editing for Pro users
2. **Complete Settings page** - Plan upgrade, account settings
3. **Premium email templates** - Styled confirmation, welcome, warning emails
4. **SMS provider integration** - Connect Twilio or Telnyx

### Phase 3: Marketing & Growth

1. ~~**Blog section**~~ ✅ Complete - 5 SEO articles with illustrations
2. ~~**Social proof counters**~~ ✅ Complete - Animated counters implemented
3. ~~**Landing page redesign**~~ ✅ Complete - Full DataPulse-style redesign
4. ~~**Header redesign**~~ ✅ Complete - Glassmorphism floating nav
5. ~~**Cookie consent**~~ ✅ Complete - Minimal Vercel-style notification
6. ~~**Delete deprecated files**~~ ✅ Complete - No deprecated files remain

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
| `profiles` | User accounts, plan, auto-resend setting |
| `google_connections` | OAuth tokens per user |
| `calendar_bookings` | Synced events from calendar |
| `booking_confirmations` | Confirmation tokens, status, channel |
| `no_show_settings` | Global rules per user |
| `appointment_no_show_overrides` | Per-event rule overrides |
| `appointment_attendance` | Attendance records (attended/no_show) |

**Needed for Stripe:**
| Table | Purpose |
|-------|---------|
| `stripe_customers` | Map user_id → Stripe customer_id |
| `subscriptions` | Track active subscriptions |
| `payment_intents` | Track card authorizations and charges |

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

- **Stripe is the #1 priority** — the product cannot function without it
- **Site is LIVE** at https://attenda.app — deployed on Vercel
- **Security audit completed** (2026-02-03) — all vulnerabilities fixed
- OAuth tokens are now encrypted with AES-256-GCM
- **Google Calendar OAuth working** (2026-02-04) — login + calendar connection both functional
- Landing page complete (2026-02-01) — glassmorphism header, 13 sections, indigo/teal color scheme
- Blog complete (2026-02-01) — 9 SEO-optimized articles with professional illustrations
- Cookie consent implemented — minimal Vercel-style notification with localStorage persistence
- **Database note:** `profiles` table does NOT have an `email` column — get email from `user` object instead
- Database has some inconsistent table naming (`appointment_attendance` vs `attendance_records`) — consolidate during cleanup
- Never bypass the "manual no-show confirmation" rule — it's legally and ethically critical
- For production scale: implement Redis-based rate limiting (currently in-memory)
- **Vercel env vars:** Always check for trailing newlines when pasting (see Section 18)
