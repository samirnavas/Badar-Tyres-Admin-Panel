-- Vehicle manufacturers lookup table (manage rows in Supabase Table Editor)
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vehicle_types text[] NOT NULL DEFAULT '{Car,Bike,Others}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manufacturers_name_unique UNIQUE (name),
  CONSTRAINT manufacturers_vehicle_types_check CHECK (
    vehicle_types <@ ARRAY['Car', 'Bike', 'Others']::text[]
    AND cardinality(vehicle_types) > 0
  )
);

CREATE INDEX IF NOT EXISTS manufacturers_name_lower_idx
  ON public.manufacturers (lower(name));

-- Link vehicles.make to manufacturers via FK
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS make_id uuid REFERENCES public.manufacturers (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS vehicles_make_id_idx ON public.vehicles (make_id);

-- Seed common manufacturers (safe to re-run)
INSERT INTO public.manufacturers (name, vehicle_types)
VALUES
  ('Toyota', ARRAY['Car']),
  ('Honda', ARRAY['Car']),
  ('Hyundai', ARRAY['Car']),
  ('Volkswagen', ARRAY['Car']),
  ('TVS', ARRAY['Car', 'Bike']),
  ('Royal Enfield', ARRAY['Bike']),
  ('Mahindra', ARRAY['Car']),
  ('Maruti Suzuki', ARRAY['Car']),
  ('Bajaj', ARRAY['Bike']),
  ('KTM', ARRAY['Bike'])
ON CONFLICT (name) DO NOTHING;

-- Backfill make_id from existing vehicles.make text
UPDATE public.vehicles v
SET make_id = m.id
FROM public.manufacturers m
WHERE v.make_id IS NULL
  AND lower(trim(v.make)) = lower(trim(m.name));

-- Create manufacturers for any orphan make values still on vehicles
INSERT INTO public.manufacturers (name)
SELECT DISTINCT trim(v.make)
FROM public.vehicles v
WHERE v.make IS NOT NULL
  AND trim(v.make) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.manufacturers m
    WHERE lower(m.name) = lower(trim(v.make))
  )
ON CONFLICT (name) DO NOTHING;

UPDATE public.vehicles v
SET make_id = m.id
FROM public.manufacturers m
WHERE v.make_id IS NULL
  AND v.make IS NOT NULL
  AND trim(v.make) <> ''
  AND lower(trim(v.make)) = lower(trim(m.name));

-- Keep vehicles.make in sync when make_id is set
CREATE OR REPLACE FUNCTION public.sync_vehicle_make_from_manufacturer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.make_id IS NOT NULL THEN
    SELECT name INTO NEW.make
    FROM public.manufacturers
    WHERE id = NEW.make_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicles_sync_make ON public.vehicles;
CREATE TRIGGER vehicles_sync_make
  BEFORE INSERT OR UPDATE OF make_id ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vehicle_make_from_manufacturer();
