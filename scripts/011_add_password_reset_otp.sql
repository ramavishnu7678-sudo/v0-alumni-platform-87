-- Create password reset OTP table
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_otp_code ON public.password_reset_otps(otp_code);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON public.password_reset_otps(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to insert their own OTP (no auth required)
DROP POLICY IF EXISTS "Allow insert password reset OTP" ON public.password_reset_otps;
CREATE POLICY "Allow insert password reset OTP"
ON public.password_reset_otps FOR INSERT
WITH CHECK (true);

-- Create policy for anyone to select OTPs (no auth required)
DROP POLICY IF EXISTS "Allow view password reset OTP" ON public.password_reset_otps;
CREATE POLICY "Allow view password reset OTP"
ON public.password_reset_otps FOR SELECT
USING (true);

-- Create policy for updating is_used flag
DROP POLICY IF EXISTS "Allow update password reset OTP" ON public.password_reset_otps;
CREATE POLICY "Allow update password reset OTP"
ON public.password_reset_otps FOR UPDATE
USING (true)
WITH CHECK (true);

-- Cleanup function to remove expired OTPs (can be called manually or via cron if needed)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.password_reset_otps 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
END;
$$ LANGUAGE plpgsql;
