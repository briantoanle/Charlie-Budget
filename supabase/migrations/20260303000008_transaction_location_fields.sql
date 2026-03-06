-- Store Plaid transaction location metadata for spend mapping
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lon double precision,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_region text,
  ADD COLUMN IF NOT EXISTS location_postal_code text,
  ADD COLUMN IF NOT EXISTS location_country text;

COMMENT ON COLUMN public.transactions.location_lat IS
  'Latitude from Plaid transaction.location.lat';
COMMENT ON COLUMN public.transactions.location_lon IS
  'Longitude from Plaid transaction.location.lon';
COMMENT ON COLUMN public.transactions.location_address IS
  'Street address from Plaid transaction.location.address';
COMMENT ON COLUMN public.transactions.location_city IS
  'City from Plaid transaction.location.city';
COMMENT ON COLUMN public.transactions.location_region IS
  'Region/state from Plaid transaction.location.region';
COMMENT ON COLUMN public.transactions.location_postal_code IS
  'Postal code from Plaid transaction.location.postal_code';
COMMENT ON COLUMN public.transactions.location_country IS
  'Country code from Plaid transaction.location.country';
