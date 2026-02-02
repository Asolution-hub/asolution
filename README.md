# Attenda — Smart No‑Show Protection for Appointments

Attenda connects to your calendar and helps businesses reduce no‑shows by **automatically confirming appointments** and **applying fair no‑show protection rules**.

This document describes **what Attenda does today**, how plans differ, and the core logic behind confirmations and no‑show handling.

---

## What Attenda Is

Attenda is a calendar‑connected assistant for service businesses (salons, clinics, coaches, freelancers).

It:
- Connects to your calendar (Google Calendar)
- Detects upcoming appointments
- Sends confirmation requests to clients
- Applies no‑show protection **only when the business decides**
- Keeps everything transparent and fair

Attenda **never charges customers automatically**.

---

## Core Flow (High‑Level)

1. Business creates an event in Google Calendar
2. Attenda detects the event
3. Attenda looks for **email or phone number** in:
   - Event title
   - Event description
4. A **draft booking** is created
5. After a short delay (default 10 minutes), a confirmation is sent
6. Client opens confirmation link
7. Client **pre‑authorizes** a no‑show fee via Stripe
8. Appointment happens
9. If client attends → nothing happens
10. If client does not show → business may **manually mark no‑show**

👉 **No money is ever taken unless the business explicitly clicks “Mark no‑show.”**

---

## Confirmation & Stripe Protection

### Confirmation Link

The confirmation email/SMS contains:
- Appointment details
- No‑show policy
- A secure Stripe checkout

The client:
- Confirms attendance
- Pre‑authorizes the no‑show fee (not charged yet)

This creates **trust and clarity**:
- Client knows the rules
- Business is protected
- No surprise charges

---

## No‑Show Protection Rules

No‑show rules define **what happens if the client does not attend**.

They include:
- No‑show fee (€)
- Grace period (minutes)
- Late cancellation window (hours)

### Important:
- Rules are **never enforced automatically**
- Rules apply **only after the appointment start time**
- Rules apply **only when the business clicks “Mark no‑show”**

Attenda is a tool — **the business stays in control**.

---

## Event Statuses

Each appointment can be in one of these states:

- **Draft** — event detected, confirmation not sent yet
- **Pending confirmation** — confirmation sent, awaiting client action
- **Confirmed** — client confirmed and authorized fee
- **Expired** — confirmation not completed
- **Attended** — business marked attended
- **No‑show applied** — business marked no‑show and fee charged

Past events are always read‑only.

---

## Plans

### Starter (Free / Entry)

Designed for solo businesses getting started.

Features:
- Google Calendar sync
- Automatic confirmation after delay
- Manual resend option
- Global no‑show rules
- Stripe pre‑authorization
- Manual no‑show enforcement
- **Monthly limit: 30 protected appointments**
- No auto‑resend

---

### Pro

For growing businesses.

Everything in Starter, plus:
- Unlimited protected appointments
- Auto‑resend confirmations
- Per‑appointment protection rules
- Better dashboard visibility
- Visual plan indicators

---

### Business

For teams and high‑volume operations.

Includes:
- Everything in Pro
- Multi‑calendar support (future)
- Team members (future)
- Advanced reporting (future)
- Priority support

---

## Dashboard Highlights

- Clear event cards (Today / Future / Past)
- Status badges (color‑coded)
- Visible contact detection
- Protection rules shown per event
- Disabled actions when not allowed
- Starter usage counter (monthly limit)
- Pro‑only affordances clearly marked

---

## Design Philosophy

Attenda is built around:

- **Transparency** — clients always know what they agree to
- **Control** — businesses decide when fees apply
- **Fairness** — no automatic penalties
- **Trust** — no dark patterns, no surprise charges

Attenda protects businesses **without punishing customers**.

---

## Current Integrations

- Google Calendar ✅


Planned:
- Stripe (pre‑authorization & charging) 
- Outlook Calendar
- Apple Calendar (ICS)
- Calendly
- Booking platforms

---

## Summary

Attenda helps businesses:
- Reduce no‑shows
- Set clear expectations
- Stay in control
- Protect revenue fairly

It is **not a billing bot** — it is a **decision‑support system**.

---

© Attenda
