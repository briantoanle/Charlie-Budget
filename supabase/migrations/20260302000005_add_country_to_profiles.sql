-- Add country column to profiles for holiday spending predictions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US' 
CHECK (country IN ('US', 'CA'));

COMMENT ON COLUMN public.profiles.country IS 'User country for holiday spending predictions (US/CA)';
