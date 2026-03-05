-- Add email domain validation at database level
-- This ensures only @mce.edu.in emails can be stored in the profiles table

-- Add check constraint to profiles table for email domain validation
ALTER TABLE profiles 
ADD CONSTRAINT check_email_domain 
CHECK (email LIKE '%@mce.edu.in');

-- Update the handle_new_user function to validate email domain
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email domain
  IF NEW.email NOT LIKE '%@mce.edu.in' THEN
    RAISE EXCEPTION 'Only @mce.edu.in email addresses are allowed';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, graduation_year, department, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'role',
    CASE 
      WHEN NEW.raw_user_meta_data->>'graduation_year' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'graduation_year')::INTEGER
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'department',
    true -- Auto-approve users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
