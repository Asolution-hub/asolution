-- Setup niisutavkreem@gmail.com as Pro test account
-- Run this in Supabase SQL Editor

-- First, find the user ID
SELECT id, email FROM auth.users WHERE email = 'niisutavkreem@gmail.com';

-- Update profile to Pro plan and mark onboarding complete
UPDATE public.profiles
SET
  plan = 'pro',
  onboarding_completed = true,
  subscription_status = 'active',
  updated_at = now()
WHERE id = (SELECT id FROM auth.users WHERE email = 'niisutavkreem@gmail.com');

-- Verify the update
SELECT
  id,
  plan,
  onboarding_completed,
  subscription_status,
  stripe_account_status
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'niisutavkreem@gmail.com');
