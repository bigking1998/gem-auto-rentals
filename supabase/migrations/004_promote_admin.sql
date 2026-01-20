-- =============================================
-- PROMOTE USER TO ADMIN
-- =============================================
-- Run this after creating a user in Supabase Dashboard > Authentication > Users
-- Replace 'admin@gemautorentals.com' with the email you created

UPDATE public.users
SET role = 'ADMIN'
WHERE email = 'admin@gemautorentals.com';

-- Verify the update
SELECT id, email, first_name, last_name, role
FROM public.users
WHERE email = 'admin@gemautorentals.com';
