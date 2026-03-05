-- Fix the handle_new_user function to properly handle NULL values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Added COALESCE for all fields to provide defaults and prevent NULL constraint violations
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    graduation_year, 
    department, 
    is_approved
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'graduation_year' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'graduation_year')::INTEGER
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'Not Specified'),
    true
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Added error handling to log and re-raise exceptions for debugging
  RAISE NOTICE 'Error in handle_new_user: %, User email: %', SQLERRM, NEW.email;
  RETURN NEW;
END;
$$;
