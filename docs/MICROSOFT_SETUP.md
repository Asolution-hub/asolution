# Microsoft Calendar Integration Setup Guide

This guide explains how to configure Microsoft Outlook calendar integration for Attenda.

## Prerequisites

- Access to Azure Portal (https://portal.azure.com)
- Microsoft account (personal or organizational)
- Attenda app deployed and running

## Overview

Attenda uses Microsoft Graph API to access Outlook calendar events. This requires:

1. **Azure Entra ID App Registration** - OAuth app configuration
2. **Supabase Configuration** - For Microsoft login support
3. **Vercel Environment Variables** - For calendar API credentials

---

## Part 1: Azure Entra ID App Registration

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**
2. Click **"New registration"**
3. Fill in the form:
   - **Name**: `Attenda` (or your app name)
   - **Supported account types**: Select **"Accounts in any organizational directory and personal Microsoft accounts"**
     - This allows both personal Outlook.com accounts and organizational Office 365 accounts
   - **Redirect URI**: Leave blank for now (we'll add it later)
4. Click **"Register"**

### Step 2: Note Your Credentials

After registration, you'll see the **Overview** page:

1. Copy **Application (client) ID** - This is your `MICROSOFT_CLIENT_ID`
2. Copy **Directory (tenant) ID** - This should be `common` for multi-tenant apps
3. Keep this page open - you'll need these values later

### Step 3: Create Client Secret

1. In the left sidebar, click **"Certificates & secrets"**
2. Click **"New client secret"**
3. Fill in:
   - **Description**: `Attenda Production`
   - **Expires**: `24 months` (set a calendar reminder to rotate before expiry)
4. Click **"Add"**
5. **IMMEDIATELY COPY THE SECRET VALUE** - it's only shown once!
   - This is your `MICROSOFT_CLIENT_SECRET`
   - Store it securely (password manager recommended)

### Step 4: Configure Redirect URIs

You need to add **TWO** redirect URIs - one for login, one for calendar integration.

1. In the left sidebar, click **"Authentication"**
2. Under **Platform configurations**, click **"Add a platform"**
3. Select **"Web"**
4. Add the following redirect URIs:

**For Local Development:**
```
http://localhost:3000/api/microsoft/callback
https://[your-project].supabase.co/auth/v1/callback
```

**For Production:**
```
https://attenda.app/api/microsoft/callback
https://[your-project].supabase.co/auth/v1/callback
```

5. **Front-channel logout URL**: Leave blank
6. Check **"Access tokens"** and **"ID tokens"** under **Implicit grant and hybrid flows**
7. Click **"Configure"**

### Step 5: Configure API Permissions

1. In the left sidebar, click **"API permissions"**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add the following permissions:
   - `User.Read` - Read user profile (for email)
   - `Calendars.Read` - Read calendar events
   - `offline_access` - Get refresh tokens for long-term access
6. Click **"Add permissions"**

**Optional: Grant Admin Consent**

If you're setting this up for an organization:
1. Click **"Grant admin consent for [your organization]"**
2. Confirm the prompt

This pre-approves the permissions for all users in your organization (otherwise each user needs to approve).

---

## Part 2: Supabase Configuration (Microsoft Login)

Microsoft login uses Supabase's built-in Azure AD provider.

### Step 1: Get Your Supabase Callback URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Authentication** → **Providers**
3. Scroll down to find **"Azure"**
4. Copy the **Callback URL** (format: `https://[project].supabase.co/auth/v1/callback`)

### Step 2: Enable Azure Provider in Supabase

1. In Supabase → **Authentication** → **Providers**
2. Find **"Azure"** and toggle it **ON**
3. Fill in:
   - **Azure Client ID**: Paste your Application (client) ID from Azure
   - **Azure Client Secret**: Paste your client secret from Azure
4. Click **"Save"**

### Step 3: Test Microsoft Login

1. Visit your login page: `https://attenda.app/login`
2. Click **"Continue with Microsoft"**
3. You should be redirected to Microsoft login
4. After logging in, you should be redirected back to your dashboard

---

## Part 3: Vercel Environment Variables (Calendar Integration)

Add these environment variables to Vercel for calendar API access.

### Step 1: Add Variables in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `MICROSOFT_CLIENT_ID` | `your-azure-app-client-id` | From Azure Overview page |
| `MICROSOFT_CLIENT_SECRET` | `your-azure-app-client-secret` | From Azure Certificates & secrets |
| `MICROSOFT_REDIRECT_URI` | `https://attenda.app/api/microsoft/callback` | Production callback URL |
| `MICROSOFT_TENANT_ID` | `common` | Use `common` for multi-tenant apps |

**Important:**
- Make sure to select **"Production"**, **"Preview"**, and **"Development"** for all variables
- For development, use `http://localhost:3000/api/microsoft/callback` as redirect URI

### Step 2: Redeploy Application

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

Or trigger a new deployment by pushing to your git repository.

---

## Part 4: Local Development Setup

### Step 1: Update .env.local

Add the following to your `.env.local` file:

```bash
# Microsoft OAuth (Outlook Calendar Integration)
MICROSOFT_CLIENT_ID=your-azure-app-client-id
MICROSOFT_CLIENT_SECRET=your-azure-app-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/microsoft/callback
MICROSOFT_TENANT_ID=common
```

### Step 2: Restart Development Server

```bash
cd App/attenda
npm run dev
```

---

## Testing the Integration

### Test Login

1. Visit `http://localhost:3000/login` (or production URL)
2. Click **"Continue with Microsoft"**
3. Expected: Redirect to Microsoft login → Login → Redirect back to dashboard

### Test Calendar Connection

1. Log in to your dashboard
2. Go to **Settings** → **Calendar Integrations**
3. Find **"Microsoft Outlook"** section
4. Click **"Connect"**
5. Expected:
   - Redirect to Microsoft OAuth consent screen
   - Grant permissions prompt (if not admin-consented)
   - Redirect back to Settings with success message
   - Status should show **"Connected"** with your email
6. Visit **Dashboard** → calendar should show Microsoft calendar events

### Verify Database

```sql
-- Check Microsoft connection in Supabase SQL Editor
SELECT
  provider,
  google_email as email,
  status,
  created_at
FROM google_connections
WHERE provider = 'microsoft'
ORDER BY created_at DESC;
```

Should show:
- `provider`: `microsoft`
- `email`: Your Microsoft account email
- `status`: `active`

---

## Troubleshooting

### Error: "AADSTS50011: The redirect URI does not match"

**Solution:** Make sure the redirect URI in Azure exactly matches the one in your code:
- Local: `http://localhost:3000/api/microsoft/callback`
- Production: `https://attenda.app/api/microsoft/callback`

### Error: "invalid_grant" or "token refresh failed"

**Solution:** Refresh token may have expired or been revoked:
1. Go to Settings → Disconnect Microsoft calendar
2. Reconnect to get a new refresh token

### Error: "Missing permissions" or "Insufficient privileges"

**Solution:**
1. Check Azure → API permissions → Ensure `User.Read`, `Calendars.Read`, `offline_access` are added
2. If using organizational account, admin consent may be required

### No events showing in calendar

**Checklist:**
1. Verify Microsoft connection status: Settings → Calendar Integrations
2. Check browser console for errors
3. Verify events exist in Outlook calendar within ±7-30 days range
4. Check Supabase logs for API errors

---

## Security Best Practices

### Credential Storage
- ✅ **NEVER** commit `.env.local` to version control
- ✅ Use Vercel environment variables for production secrets
- ✅ Rotate client secrets every 24 months (set reminder)
- ✅ Store secrets in password manager (1Password, LastPass, etc.)

### Token Encryption
- All tokens are encrypted with AES-256-GCM before database storage
- Encryption key is stored in `TOKEN_ENCRYPTION_KEY` environment variable
- Tokens are automatically refreshed when expired

### Permissions
- Request **minimum necessary permissions** (User.Read, Calendars.Read, offline_access)
- Do NOT request write permissions unless needed
- Use **delegated permissions**, not application permissions

### Rate Limiting
- Calendar API endpoints are rate-limited (30 requests/minute)
- Token refresh failures trigger automatic disconnection

---

## Multi-Tenant vs Single-Tenant

### Multi-Tenant (Recommended)
- **Tenant ID**: `common`
- Allows personal Microsoft accounts + any organization
- Best for SaaS products with diverse users

### Single-Tenant
- **Tenant ID**: Your organization's tenant ID
- Only allows users from your organization
- Use for internal tools

---

## Production Checklist

Before launching:

- [ ] Azure app registration created
- [ ] Client secret stored securely
- [ ] Redirect URIs configured for production domain
- [ ] API permissions granted (User.Read, Calendars.Read, offline_access)
- [ ] Supabase Azure provider enabled with correct credentials
- [ ] Vercel environment variables configured
- [ ] Application redeployed after adding env vars
- [ ] Microsoft login tested in production
- [ ] Calendar connection tested in production
- [ ] Events syncing correctly
- [ ] Disconnect functionality tested
- [ ] Calendar reminder set for client secret expiry (24 months)

---

## Support

**Microsoft Documentation:**
- [Microsoft Graph Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [OAuth 2.0 Authorization Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

**Attenda Documentation:**
- See `CLAUDE.md` for architecture details
- See `lib/microsoftAuth.ts` for implementation details

**Common Issues:**
- Check Vercel deployment logs for runtime errors
- Check Supabase logs for database/auth errors
- Use browser DevTools → Network tab to debug OAuth flow
