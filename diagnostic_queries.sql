-- ==============================================================================
-- DIAGNOSTIC QUERIES FOR ISSUE #2 AND #5
-- Run these in Supabase SQL Editor
-- ==============================================================================

-- Query 1: Check all user profiles and their subscription status
-- This will help diagnose issue #5 (niisutavkreem@gmail.com showing as Starter)
-- ==============================================================================
SELECT
  p.id,
  u.email,
  p.subscription_status,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.stripe_account_id,
  p.stripe_account_status,
  p.onboarding_completed,
  p.business_name,
  p.business_country,
  p.created_at,
  p.updated_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('niisutavkreem@gmail.com', 'attenda.solution@gmail.com')
ORDER BY u.email;

-- Query 2: Check for duplicate user accounts (same email, multiple profiles)
-- This could cause authentication confusion
-- ==============================================================================
SELECT
  u.email,
  COUNT(p.id) as profile_count,
  array_agg(p.id) as profile_ids,
  array_agg(p.subscription_status) as statuses,
  array_agg(p.created_at) as created_dates
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email IN ('niisutavkreem@gmail.com', 'attenda.solution@gmail.com')
GROUP BY u.email;

-- Query 3: Check Stripe subscription status in our database
-- Compare with actual Stripe dashboard to see if webhook failed
-- ==============================================================================
SELECT
  u.email,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.subscription_status,
  p.stripe_account_status,
  p.onboarding_completed
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'niisutavkreem@gmail.com';

-- Query 4: Check business onboarding logs for authentication issues
-- This will show if users are reaching the onboarding endpoint
-- ==============================================================================
SELECT
  bol.user_id,
  u.email,
  bol.step,
  bol.metadata,
  bol.created_at
FROM business_onboarding_logs bol
JOIN auth.users u ON bol.user_id = u.id
WHERE u.email IN ('niisutavkreem@gmail.com', 'attenda.solution@gmail.com')
ORDER BY bol.created_at DESC
LIMIT 20;

-- Query 5: Check if business_onboarding_logs table exists
-- (It might not exist if migration wasn't run)
-- ==============================================================================
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'business_onboarding_logs'
) AS table_exists;

-- Query 6: Check all users in the system (to clean up test accounts later)
-- ==============================================================================
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  p.subscription_status,
  p.onboarding_completed
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- ==============================================================================
-- DIAGNOSTIC COMMANDS TO CHECK AUTH COOKIES (run in browser console)
-- ==============================================================================
/*
Open browser console on attenda.app and run:

// Check if Supabase session exists
const session = await window.supabase.auth.getSession();
console.log('Session:', session);

// Check cookies
console.log('All cookies:', document.cookie);

// Check for Supabase auth token in localStorage
console.log('LocalStorage keys:', Object.keys(localStorage));
console.log('Supabase session:', localStorage.getItem('sb-<project-ref>-auth-token'));
*/

-- ==============================================================================
-- FIX QUERIES (run AFTER diagnostics confirm the issue)
-- ==============================================================================

-- Fix #1: Set niisutavkreem@gmail.com to Pro (if needed)
-- DON'T RUN YET - only after confirming current state
-- ==============================================================================
/*
UPDATE profiles
SET
  subscription_status = 'active',
  stripe_subscription_id = 'sub_XXXXX', -- Replace with actual Stripe sub ID
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'niisutavkreem@gmail.com');
*/

-- Fix #2: Set attenda.solution@gmail.com to Starter (if needed)
-- DON'T RUN YET - only after confirming current state
-- ==============================================================================
/*
UPDATE profiles
SET
  subscription_status = NULL,
  stripe_subscription_id = NULL,
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'attenda.solution@gmail.com');
*/

-- Fix #3: Delete all other test users (DANGEROUS - backup first!)
-- DON'T RUN YET - only after user confirms which accounts to keep
-- ==============================================================================
/*
-- First, soft delete profiles
UPDATE profiles
SET deleted_at = NOW()
WHERE id NOT IN (
  SELECT id FROM auth.users
  WHERE email IN ('niisutavkreem@gmail.com', 'attenda.solution@gmail.com')
);

-- Then delete from auth.users (THIS IS PERMANENT)
-- DELETE FROM auth.users
-- WHERE email NOT IN ('niisutavkreem@gmail.com', 'attenda.solution@gmail.com');
*/
