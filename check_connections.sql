-- Check Google and Microsoft calendar connections for test user
SELECT
  gc.id,
  gc.user_id,
  gc.provider,
  gc.google_email,
  gc.created_at,
  gc.expiry_date,
  CASE
    WHEN gc.encrypted_access_token IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_access_token,
  CASE
    WHEN gc.encrypted_refresh_token IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_refresh_token
FROM google_connections gc
WHERE gc.user_id = (SELECT id FROM auth.users WHERE email = 'niisutavkreem@gmail.com')
ORDER BY gc.created_at DESC;
