-- Fix RLS policies for proper profile access
-- Drop conflicting policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create unified policies
-- 1. Users can view their own profile
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
CREATE POLICY "users_select_own_profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Users can view approved profiles
DROP POLICY IF EXISTS "users_select_approved_profiles" ON public.profiles;
CREATE POLICY "users_select_approved_profiles" ON public.profiles
FOR SELECT
USING (is_approved = true);

-- 3. Users can insert their own profile
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Users can update their own profile
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Users can delete their own profile
DROP POLICY IF EXISTS "users_delete_own_profile" ON public.profiles;
CREATE POLICY "users_delete_own_profile" ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Fix password_reset_otps policies to allow unauthenticated access
DROP POLICY IF EXISTS "Allow insert password reset OTP" ON public.password_reset_otps;
DROP POLICY IF EXISTS "Allow view password reset OTP" ON public.password_reset_otps;
DROP POLICY IF EXISTS "Allow update password reset OTP" ON public.password_reset_otps;

CREATE POLICY "allow_public_insert_otp" ON public.password_reset_otps
FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow_public_select_otp" ON public.password_reset_otps
FOR SELECT
USING (true);

CREATE POLICY "allow_public_update_otp" ON public.password_reset_otps
FOR UPDATE
USING (true)
WITH CHECK (true);
