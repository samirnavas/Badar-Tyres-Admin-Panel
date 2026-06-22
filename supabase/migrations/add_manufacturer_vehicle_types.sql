-- Allowed values: Car, Bike, Others (one or more per manufacturer)
ALTER TABLE public.manufacturers
  ADD COLUMN IF NOT EXISTS vehicle_types text[] NOT NULL DEFAULT '{Car,Bike,Others}';

ALTER TABLE public.manufacturers
  DROP CONSTRAINT IF EXISTS manufacturers_vehicle_types_check;

ALTER TABLE public.manufacturers
  ADD CONSTRAINT manufacturers_vehicle_types_check
  CHECK (
    vehicle_types <@ ARRAY['Car', 'Bike', 'Others']::text[]
    AND cardinality(vehicle_types) > 0
  );

-- Sensible defaults for seeded / common brands
UPDATE public.manufacturers
SET vehicle_types = ARRAY['Car']
WHERE lower(name) IN (
  'toyota', 'honda', 'hyundai', 'volkswagen', 'maruti suzuki', 'mahindra'
);

UPDATE public.manufacturers
SET vehicle_types = ARRAY['Bike']
WHERE lower(name) IN ('royal enfield', 'bajaj', 'ktm', 'hero', 'yamaha');

UPDATE public.manufacturers
SET vehicle_types = ARRAY['Car', 'Bike']
WHERE lower(name) = 'tvs';
