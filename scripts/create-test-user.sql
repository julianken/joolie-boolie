-- Create Test User Profile
-- Run this in Supabase SQL Editor after creating auth user in dashboard

-- First, get the user ID from the auth.users table
SELECT id, email FROM auth.users WHERE email = 'test@beakgaming.com';

-- Then create the profile (replace USER_ID with the UUID from above)
INSERT INTO public.profiles (id, facility_name, created_at, updated_at)
VALUES (
  'USER_ID_FROM_ABOVE',  -- Replace with actual UUID
  'Test Facility',
  now(),
  now()
);

-- Verify profile was created
SELECT p.id, p.facility_name, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'test@beakgaming.com';
