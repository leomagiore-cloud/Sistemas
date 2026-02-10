-- Add approval status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason text;

-- Create RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));