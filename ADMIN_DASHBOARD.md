# Admin Dashboard Documentation

**Status**: ✅ Fully Implemented and Production Ready

The admin dashboard provides comprehensive monitoring and management tools for the Attenda platform. Access it at: **https://attenda.app/admin**

---

## Access & Security

**Authentication**: Admin dashboard is protected by email whitelist authentication.

**How to access**:
1. Log in to Attenda with an admin email (configured in `ADMIN_EMAILS` environment variable)
2. Navigate to `/admin`
3. If your email is in the whitelist, you'll see the admin dashboard
4. If not, you'll be redirected back to the user dashboard

**Current admin emails**: Check `ADMIN_EMAILS` in Vercel environment variables

---

## Dashboard Sections

### 1. Overview (`/admin`)

**System Health Status**:
- 🟢 Operational / 🟡 Warning / 🔴 Critical
- Real-time system status based on failed webhooks and active disputes
- Auto-refreshes every 30 seconds

**Key Metrics**:
- **Total Users**: User count + new users this month
- **Pro Subscribers**: Pro vs Starter breakdown
- **Monthly Revenue**: MRR calculation (Pro users × €39)
- **Bookings This Month**: Total + confirmed count
- **No-Shows This Month**: Revenue recovered
- **Connected Calendars**: Active Google/Microsoft integrations
- **Avg Webhook Time**: Processing performance

**Quick Links**:
- Webhook Logs
- User Management
- Cron Jobs
- Sentry Errors (external link)

**Active Alerts**:
- Failed webhooks in last 24 hours
- Active disputes requiring attention

---

### 2. Webhook Logs (`/admin/webhooks`)

**Features**:
- View all Stripe webhook events
- Filter by status (All / Success / Failed)
- Filter by event type
- Pagination (50 events per page)
- Click any webhook to view full details

**Event Details Modal**:
- Event type and Stripe event ID
- Success/failure status
- Error messages (for failed events)
- Retry count
- Processing duration
- Created and processed timestamps

**Use Cases**:
- Debug failed webhook processing
- Monitor webhook performance
- Investigate payment issues
- Track subscription events

---

### 3. User Management (`/admin/users`)

**Features**:
- List all users with pagination (50 per page)
- Search by email or display name
- Filter by plan (All / Starter / Pro)
- View user details

**User Information Displayed**:
- Display name and email
- Plan (Starter or Pro badge)
- Stripe Connect status (Enabled / Pending / Restricted)
- Bookings this month (with limit for Starter users)
- Currency (EUR / USD)
- Join date
- View button (redirects to their dashboard)

**Use Cases**:
- Support ticket resolution
- Monitor user onboarding progress
- Track Starter users approaching limits
- Identify accounts needing verification

---

### 4. Cron Jobs (`/admin/cron`)

**Features**:
- View all 6 cron jobs with their schedules
- Test any cron job manually via "Test Now" button
- View test results (success/failure + response)
- Quick link to cron-job.org dashboard

**Cron Jobs Listed**:
1. **Send Draft Confirmations** - Every 30 minutes
2. **Send Reminders** - Every hour
3. **Sync Calendars** - Every hour
4. **Check Expiring Authorizations** - Every 6 hours
5. **Check Usage** - Daily at 09:00 UTC
6. **Auto Confirm** - Daily at 17:00 UTC (disabled)

**Use Cases**:
- Verify cron jobs are configured correctly
- Test cron endpoints before deployment
- Quick access to cron-job.org for execution history

**Note**: Actual execution history and logs are on cron-job.org dashboard (external link provided)

---

## API Routes

All admin API routes require authentication and admin email whitelist check.

### `/api/admin/metrics` (GET)
Returns aggregated system metrics:
- User counts (total, pro, starter, new this month)
- Booking statistics (this month, confirmed, no-shows)
- Revenue (MRR)
- System health (disputes, failed webhooks, webhook performance, connected calendars)

### `/api/admin/webhooks` (GET)
Returns paginated webhook events:
- Query params: `limit`, `offset`, `status`, `eventType`
- Returns: webhooks array, total count, pagination info

### `/api/admin/users` (GET)
Returns paginated user list:
- Query params: `limit`, `offset`, `plan`, `search`
- Returns: users array with email, plan, stripe status, booking count, etc.

### `/api/admin/cron-status` (GET)
Returns cron job configuration:
- Job name, endpoint, schedule, description
- Note: Actual execution data requires cron-job.org integration

### `/api/admin/reconcile` (GET) - *Already existed*
Compares Stripe data vs database for mismatches

---

## File Structure

```
app/admin/
├── layout.tsx              # Admin layout with auth + navigation
├── page.tsx                # Overview dashboard
├── webhooks/
│   └── page.tsx            # Webhook logs viewer
├── users/
│   └── page.tsx            # User management
└── cron/
    └── page.tsx            # Cron job status

app/api/admin/
├── metrics/
│   └── route.ts            # System metrics API
├── webhooks/
│   └── route.ts            # Webhook logs API (already existed)
├── users/
│   └── route.ts            # User list API
├── cron-status/
│   └── route.ts            # Cron job info API
└── reconcile/
    └── route.ts            # Stripe reconciliation (already existed)
```

---

## Tech Stack

**Frontend**:
- Next.js 16 App Router
- React client components
- Tailwind CSS (using existing design system)
- Auto-refresh for real-time data

**Backend**:
- Next.js API routes
- Supabase Admin client (bypasses RLS)
- Direct database queries for aggregated metrics

**Authentication**:
- Email whitelist (`ADMIN_EMAILS` env var)
- Supabase Auth for user session
- Admin check via API route (403 if not admin)

---

## Security Considerations

**Access Control**:
- ✅ Admin routes protected by email whitelist
- ✅ All API routes verify authentication + admin status
- ✅ 401 if not authenticated, 403 if not admin
- ✅ Client-side auth check in layout (redirects non-admins)

**Data Access**:
- Uses `supabaseAdmin` to bypass RLS (intentional for admin dashboard)
- Admin can view ALL users and ALL data (expected for admin access)
- Sensitive data (emails, user IDs) visible only to admins

**Rate Limiting**:
- Admin API routes NOT rate-limited (admins need unrestricted access)
- Webhook logs and user lists use pagination to prevent overload

---

## Usage Examples

### Debugging a Failed Payment
1. Go to `/admin`
2. See "5 failed webhooks in last 24h" alert
3. Click "View Failed Webhooks"
4. Filter by event type: `payment_intent.payment_failed`
5. Click event to see error: "card_declined - insufficient_funds"
6. Copy error details to support ticket response

### Finding User for Support Ticket
1. Go to `/admin/users`
2. Search by email: "customer@example.com"
3. See: Starter plan, 28/30 bookings, Stripe status: Enabled
4. Click "View" to see their dashboard (impersonate)

### Verifying Cron Jobs Work
1. Go to `/admin/cron`
2. Click "Test Now" on "Send Reminders"
3. See success response: `{"ok": true, "processed": 12}`
4. Open cron-job.org dashboard to verify automated executions

---

## Next Steps (Optional Enhancements)

### Short-term:
- [ ] Add charts for metrics (Recharts library)
- [ ] Real-time webhook log updates (polling or WebSocket)
- [ ] User impersonation (view dashboard as user)
- [ ] Webhook retry functionality (re-process failed events)

### Medium-term:
- [ ] Email template preview
- [ ] Dispute evidence submission interface
- [ ] Manual refund issuance
- [ ] Cron job execution history (integrate with cron-job.org API)

### Long-term:
- [ ] Analytics dashboard (revenue trends, churn rate, cohort analysis)
- [ ] User activity timeline
- [ ] A/B testing management
- [ ] Feature flag controls

---

## Troubleshooting

### "Unauthorized" when accessing /admin
**Cause**: Your email is not in the `ADMIN_EMAILS` whitelist
**Fix**: Add your email to `ADMIN_EMAILS` in Vercel environment variables (comma-separated)

### Webhook logs not showing
**Cause**: No webhook events in database yet
**Check**: Have any Stripe events been processed? Check Stripe Dashboard → Developers → Webhooks

### User emails showing as "unknown"
**Cause**: User record exists but auth.users lookup failed
**Check**: Supabase Auth dashboard for user account status

### Metrics showing zeros
**Cause**: Fresh database with no data
**Check**: Have users signed up? Are bookings being created?

---

## Deployment

**Build**: ✅ Verified - `npm run build` succeeds
**Environment**: Requires `ADMIN_EMAILS` in production
**Routes**: All admin pages and API routes are static or dynamic (no special config needed)

**Post-deployment**:
1. Add your email to `ADMIN_EMAILS` in Vercel
2. Redeploy to apply environment variable
3. Visit `https://attenda.app/admin`
4. Verify all 4 dashboard sections load correctly

---

## Support

**Built**: February 15, 2026
**Status**: Production-ready MVP
**Time to implement**: ~2-3 hours

For questions or feature requests, check the code comments or extend functionality as needed.
