-- Create password reset OTP table
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_otp ON password_reset_otps(otp_code);

-- Enable RLS
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to insert their own OTP
CREATE POLICY "Allow insert password reset OTP"
ON password_reset_otps FOR INSERT
WITH CHECK (true);

-- Create policy for users to view their own OTP verification results
CREATE POLICY "Allow view password reset OTP"
ON password_reset_otps FOR SELECT
USING (true);

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_password_reset_otp(p_email VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_otp VARCHAR(6);
BEGIN
  -- Generate random 6-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Delete expired OTPs for this email
  DELETE FROM password_reset_otps 
  WHERE email = p_email AND expires_at < NOW();
  
  -- Delete any unused OTP for this email (only keep one active)
  DELETE FROM password_reset_otps 
  WHERE email = p_email AND is_used = false;
  
  -- Insert new OTP
  INSERT INTO password_reset_otps (email, otp_code, expires_at)
  VALUES (p_email, v_otp, NOW() + INTERVAL '10 minutes');
  
  RETURN v_otp;
END;
$$ LANGUAGE plpgsql;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_password_reset_otp(p_email VARCHAR, p_otp VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
  v_expired BOOLEAN;
BEGIN
  -- Check if OTP exists, is not used, and not expired
  SELECT EXISTS(
    SELECT 1 FROM password_reset_otps 
    WHERE email = p_email 
    AND otp_code = p_otp 
    AND is_used = false 
    AND expires_at > NOW()
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Mark OTP as used
    UPDATE password_reset_otps 
    SET is_used = true 
    WHERE email = p_email AND otp_code = p_otp;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to check if OTP is valid (without marking as used)
CREATE OR REPLACE FUNCTION check_password_reset_otp(p_email VARCHAR, p_otp VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM password_reset_otps 
    WHERE email = p_email 
    AND otp_code = p_otp 
    AND is_used = false 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;
