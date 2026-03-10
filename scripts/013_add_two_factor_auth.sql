-- Create table for Two-Factor Authentication settings
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  secret_key VARCHAR(255),
  backup_codes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON public.two_factor_auth(user_id);

-- Enable RLS
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own 2FA settings
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.two_factor_auth;
CREATE POLICY "Users can view their own 2FA settings"
ON public.two_factor_auth FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own 2FA settings
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.two_factor_auth;
CREATE POLICY "Users can update their own 2FA settings"
ON public.two_factor_auth FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own 2FA settings
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public.two_factor_auth;
CREATE POLICY "Users can insert their own 2FA settings"
ON public.two_factor_auth FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to generate backup codes
CREATE OR REPLACE FUNCTION public.generate_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
  v_codes TEXT[] := ARRAY[]::TEXT[];
  v_i INT;
BEGIN
  FOR v_i IN 1..10 LOOP
    v_codes := array_append(
      v_codes,
      substr(md5(random()::text || clock_timestamp()::text), 1, 8)
    );
  END LOOP;
  RETURN v_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add 2FA column to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
