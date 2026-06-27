-- Denormalize vehicle plate + customer contact onto jobs so technicians
-- can read them without RLS access to vehicles/customers tables.
-- Run in Supabase SQL Editor or: npm run migrate:job-display-fields

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS plate_number text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS vehicle_make text,
  ADD COLUMN IF NOT EXISTS vehicle_model text;

CREATE OR REPLACE FUNCTION public.sync_job_display_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle public.vehicles%ROWTYPE;
  v_customer public.customers%ROWTYPE;
BEGIN
  IF NEW.vehicle_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_vehicle FROM public.vehicles WHERE id = NEW.vehicle_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  NEW.plate_number := v_vehicle.plate_number;
  NEW.vehicle_make := v_vehicle.make;
  NEW.vehicle_model := v_vehicle.model;

  IF v_vehicle.customer_id IS NOT NULL THEN
    SELECT * INTO v_customer FROM public.customers WHERE id = v_vehicle.customer_id;
    IF FOUND THEN
      NEW.customer_name := trim(both from concat_ws(' ', v_customer.first_name, v_customer.last_name));
      NEW.customer_phone := v_customer.phone;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobs_sync_display_fields ON public.jobs;
CREATE TRIGGER trg_jobs_sync_display_fields
  BEFORE INSERT OR UPDATE OF vehicle_id ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_display_fields();

CREATE OR REPLACE FUNCTION public.sync_jobs_from_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_customer_name text;
  v_customer_phone text;
BEGIN
  v_customer_name := NULL;
  v_customer_phone := NULL;

  IF NEW.customer_id IS NOT NULL THEN
    SELECT * INTO v_customer FROM public.customers WHERE id = NEW.customer_id;
    IF FOUND THEN
      v_customer_name := trim(both from concat_ws(' ', v_customer.first_name, v_customer.last_name));
      v_customer_phone := v_customer.phone;
    END IF;
  END IF;

  UPDATE public.jobs
  SET
    plate_number = NEW.plate_number,
    vehicle_make = NEW.make,
    vehicle_model = NEW.model,
    customer_name = v_customer_name,
    customer_phone = v_customer_phone
  WHERE vehicle_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vehicles_sync_jobs ON public.vehicles;
CREATE TRIGGER trg_vehicles_sync_jobs
  AFTER INSERT OR UPDATE OF plate_number, make, model, customer_id ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_jobs_from_vehicle();

CREATE OR REPLACE FUNCTION public.sync_jobs_from_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := trim(both from concat_ws(' ', NEW.first_name, NEW.last_name));
BEGIN
  UPDATE public.jobs j
  SET
    customer_name = v_name,
    customer_phone = NEW.phone
  FROM public.vehicles v
  WHERE j.vehicle_id = v.id
    AND v.customer_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_sync_jobs ON public.customers;
CREATE TRIGGER trg_customers_sync_jobs
  AFTER UPDATE OF first_name, last_name, phone ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_jobs_from_customer();

-- Backfill existing jobs
UPDATE public.jobs j
SET
  plate_number = v.plate_number,
  vehicle_make = v.make,
  vehicle_model = v.model,
  customer_name = trim(both from concat_ws(' ', c.first_name, c.last_name)),
  customer_phone = c.phone
FROM public.vehicles v
LEFT JOIN public.customers c ON c.id = v.customer_id
WHERE j.vehicle_id = v.id;
