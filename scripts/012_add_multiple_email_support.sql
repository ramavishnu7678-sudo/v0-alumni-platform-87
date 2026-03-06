-- Add support for multiple email addresses in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alternate_emails TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create email_aliases table for better management of multiple emails
CREATE TABLE IF NOT EXISTS public.email_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_type VARCHAR(50) NOT NULL DEFAULT 'personal',
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_email_aliases_email ON public.email_aliases(email);
CREATE INDEX IF NOT EXISTS idx_email_aliases_user_id ON public.email_aliases(user_id);

-- Enable RLS on email_aliases
ALTER TABLE public.email_aliases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own email aliases
CREATE POLICY IF NOT EXISTS "Users can view their own email aliases"
ON public.email_aliases FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own email aliases
CREATE POLICY IF NOT EXISTS "Users can insert their own email aliases"
ON public.email_aliases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own email aliases
CREATE POLICY IF NOT EXISTS "Users can update their own email aliases"
ON public.email_aliases FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own email aliases
CREATE POLICY IF NOT EXISTS "Users can delete their own email aliases"
ON public.email_aliases FOR DELETE
USING (auth.uid() = user_id);

-- Function to check if email exists (in profiles.email or email_aliases.email)
CREATE OR REPLACE FUNCTION public.email_exists(p_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = p_email
    UNION
    SELECT 1 FROM public.email_aliases WHERE email = p_email
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user by email (from either profiles or email_aliases)
CREATE OR REPLACE FUNCTION public.get_user_by_email(p_email VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- First check profiles table
  SELECT id INTO v_user_id FROM public.profiles WHERE email = p_email LIMIT 1;
  
  -- If not found, check email_aliases table
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM public.email_aliases WHERE email = p_email LIMIT 1;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add allowed email domains for MCE institution
CREATE TABLE IF NOT EXISTS public.allowed_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL UNIQUE,
  institution_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default allowed email domains
INSERT INTO public.allowed_email_domains (domain, institution_name, is_active)
VALUES 
  ('@mce.edu.in', 'Madras City Engineering', true),
  ('@student.mce.edu.in', 'MCE Student Email', true),
  ('@alumni.mce.edu.in', 'MCE Alumni Email', true)
ON CONFLICT (domain) DO NOTHING;

-- Enable RLS on allowed_email_domains
ALTER TABLE public.allowed_email_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view allowed domains
CREATE POLICY IF NOT EXISTS "Anyone can view allowed email domains"
ON public.allowed_email_domains FOR SELECT
USING (is_active = true);
