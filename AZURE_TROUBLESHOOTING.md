# Azure Microsoft Login Troubleshooting Checklist

## Error: Unable to exchange external code

This checklist will help you fix the "Unable to exchange external code" error.

---

## ✅ Azure App Registration Checklist

### 1. Overview Page
Navigate to: **Azure Portal → Microsoft Entra ID → App registrations → Your app → Overview**

Verify:
- [ ] **Application (client) ID** is copied correctly
- [ ] **Directory (tenant) ID** is visible (but we'll use "common")

---

### 2. Authentication Page
Navigate to: **Your app → Authentication**

#### Redirect URIs (Web Platform)
Should have BOTH of these URIs:

```
https://vlxwzuanbcpzsdkwaani.supabase.co/auth/v1/callback
https://attenda.app/api/microsoft/callback
```

Verify:
- [ ] Both URIs are listed under **"Web"** platform (not SPA, not Mobile)
- [ ] URIs are EXACTLY as shown above (no trailing slashes, no extra spaces)
- [ ] Both use `https://` (not `http://`)

#### Implicit Grant Settings
Under **"Implicit grant and hybrid flows"**:

Verify:
- [ ] "Access tokens" is **checked**
- [ ] "ID tokens" is **checked**

#### Supported Account Types
Under **"Supported account types"** (top of page):

Verify:
- [ ] Selected: **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**
- [ ] This allows both Outlook.com and Office 365 accounts

---

### 3. Certificates & Secrets Page
Navigate to: **Your app → Certificates & secrets**

#### Client Secrets Section
Verify:
- [ ] At least one active client secret exists (not expired)
- [ ] The **VALUE** (not Secret ID) was copied to Supabase
- [ ] If unsure, create a NEW secret and update Supabase

**To create new secret:**
1. Click "New client secret"
2. Description: "Attenda Production - Feb 2026"
3. Expires: 24 months
4. Click "Add"
5. **Immediately copy the VALUE** (long string with special characters)
6. Update Supabase with this new value

---

### 4. API Permissions Page
Navigate to: **Your app → API permissions**

#### Required Permissions
Should have these **Microsoft Graph** delegated permissions:

Verify:
- [ ] `User.Read` (Read user profile)
- [ ] `Calendars.Read` (Read calendars)
- [ ] `offline_access` (Maintain access to data)

#### Admin Consent (Optional but Recommended)
Verify:
- [ ] Status shows "Granted for [your org]" with green checkmark
- [ ] If not, click "Grant admin consent for [your org]"

---

## ✅ Supabase Configuration Checklist

### Navigation
Go to: **Supabase Dashboard → Your Project → Authentication → Providers**

### Azure Provider Settings
Scroll down to find **"Azure"** provider

Verify:
- [ ] Toggle is **ON** (green)
- [ ] **Client ID**: Paste your Application (client) ID from Azure
- [ ] **Client Secret**: Paste the VALUE from Azure (the long string)
- [ ] **Tenant**: Leave **EMPTY** or set to `common` (NOT your tenant ID)
- [ ] **Redirect URL** (read-only): Shows `https://vlxwzuanbcpzsdkwaani.supabase.co/auth/v1/callback`
- [ ] Click **"Save"** after making changes

---

## 🔍 Common Mistakes

### ❌ Wrong Client Secret
**Symptom:** "Unable to exchange external code" error

**Common errors:**
- Copied the "Secret ID" instead of the "Value"
- Copied value with extra spaces or line breaks
- Secret expired (check Azure → Certificates & secrets)
- Special characters got corrupted when pasting

**Fix:** Create a NEW client secret in Azure, copy the VALUE carefully, update Supabase

---

### ❌ Wrong Tenant Setting
**Symptom:** Login works for some accounts but not others

**Common errors:**
- Supabase "Tenant" field has your specific tenant ID (like `12345-abcd-...`)
- This restricts login to only your organization

**Fix:** Set Supabase "Tenant" field to `common` or leave it EMPTY

---

### ❌ Redirect URI Mismatch
**Symptom:** "redirect_uri_mismatch" error or immediate redirect failure

**Common errors:**
- Missing `https://vlxwzuanbcpzsdkwaani.supabase.co/auth/v1/callback` in Azure
- Trailing slash: `...callback/` (wrong) vs `...callback` (correct)
- HTTP instead of HTTPS
- Different subdomain in Supabase URL

**Fix:** Add exact URI to Azure → Authentication → Web platform

---

### ❌ Implicit Grant Not Enabled
**Symptom:** Token exchange fails silently

**Fix:** Azure → Authentication → Check both "Access tokens" and "ID tokens"

---

## 🧪 Testing Steps

### Test 1: Verify Azure Credentials
1. Create a NEW client secret in Azure
2. Copy the VALUE immediately
3. Update Supabase with the new secret
4. Click "Save" in Supabase
5. Wait 30 seconds for changes to propagate

### Test 2: Test Login Flow
1. Open **incognito/private browser window** (to clear cookies)
2. Go to `https://attenda.app/login`
3. Click "Continue with Microsoft"
4. Should redirect to `login.microsoftonline.com`
5. Enter Microsoft account credentials
6. Should show permissions consent screen (if first time)
7. Click "Accept"
8. Should redirect back to `https://attenda.app/dashboard`

### Test 3: Check Supabase Logs
1. Supabase Dashboard → Your Project → **Logs** → **Auth Logs**
2. Look for recent failed login attempts
3. Error message will show specific issue

### Test 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try logging in
4. Look for error messages
5. Check **Network** tab for failed requests

---

## 🆘 Still Not Working?

### Get Detailed Error from Azure
1. Azure Portal → Your app → **Monitoring** → **Sign-in logs**
2. Look for failed sign-in attempts in last 10 minutes
3. Click on a failed attempt
4. Read the "Error code" and "Failure reason"
5. Share these details for specific troubleshooting

### Get Supabase Auth Logs
1. Supabase Dashboard → Your Project → **Logs** → **Auth Logs**
2. Filter by recent timestamp
3. Look for entries with error messages
4. Share the error message

### Verify Environment Variables
Make sure your app has the correct Supabase URL:

Check: `App/attenda/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://vlxwzuanbcpzsdkwaani.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 📋 Quick Fix Summary

**Most likely fix (90% of cases):**

1. Azure → Your app → Certificates & secrets → New client secret
2. Copy the VALUE (the long string)
3. Supabase → Authentication → Providers → Azure → Paste in "Client Secret"
4. Supabase → Set "Tenant" to `common` or leave EMPTY
5. Click "Save"
6. Wait 30 seconds
7. Test in incognito browser: `https://attenda.app/login`

**If that doesn't work:**
- Double-check redirect URIs in Azure (both URLs must be there)
- Verify "Implicit grant" is enabled in Azure
- Check Supabase Auth Logs for specific error

---

## 🎯 Expected Behavior

When working correctly:
1. Click "Continue with Microsoft" on login page
2. Redirect to `login.microsoftonline.com/common/oauth2/v2.0/authorize...`
3. Enter Microsoft credentials
4. Consent screen (if first time): "Attenda wants to access your profile"
5. Redirect to `https://vlxwzuanbcpzsdkwaani.supabase.co/auth/v1/callback?code=...`
6. Supabase exchanges code for tokens (happens server-side)
7. Redirect to `https://attenda.app/dashboard`
8. You're logged in!

The error "Unable to exchange external code" happens at step 6.
