-- Update the handle_new_user function to auto-approve users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role,
    graduation_year,
    department,
    is_approved  -- Auto-approve all new users
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'graduation_year' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'graduation_year')::INTEGER 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'department',
    true  -- Set is_approved to true for auto-approval
  );
  RETURN NEW;
END;
$$;

-- Update existing users to be approved (optional - run if you want to approve existing pending users)
UPDATE public.profiles SET is_approved = true WHERE is_approved = false;
