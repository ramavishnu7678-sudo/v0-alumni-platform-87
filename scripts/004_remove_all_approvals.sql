-- Remove approval requirements from all tables and policies

-- Update profiles table - remove is_approved column dependency
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT true;

-- Update all existing profiles to be approved
UPDATE public.profiles SET is_approved = true WHERE is_approved = false;

-- Update jobs table - remove is_approved column dependency  
ALTER TABLE public.jobs ALTER COLUMN is_approved SET DEFAULT true;

-- Update all existing jobs to be approved
UPDATE public.jobs SET is_approved = true WHERE is_approved = false;

-- Drop and recreate RLS policies without approval checks

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view approved jobs" ON public.jobs;
DROP POLICY IF EXISTS "Alumni can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Alumni can insert meetings" ON public.meetings;

-- Create new policies without approval requirements

-- RLS Policies for profiles (remove approval check)
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

-- RLS Policies for jobs (remove approval check)
CREATE POLICY "Users can view all active jobs" ON public.jobs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Alumni can insert jobs without approval" ON public.jobs
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'alumni')
  );

-- RLS Policies for meetings (remove approval check)
CREATE POLICY "Alumni can insert meetings without approval" ON public.meetings
  FOR INSERT WITH CHECK (
    auth.uid() = host_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'alumni')
  );

-- Update the handle_new_user function to auto-approve all users
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
    is_approved  -- Always set to true for auto-approval
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
    true  -- Auto-approve all new users
  );
  RETURN NEW;
END;
$$;
