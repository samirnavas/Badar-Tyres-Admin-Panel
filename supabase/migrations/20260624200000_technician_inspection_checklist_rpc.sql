-- Technician app uses the anon key (no Supabase Auth session).
-- These SECURITY DEFINER RPCs validate technician_id against jobs, then read/write
-- inspections and job checklists without exposing customers/vehicles RLS.

CREATE OR REPLACE FUNCTION public.upsert_job_inspection(
  p_job_id uuid,
  p_technician_id uuid,
  p_vehicle_id uuid,
  p_status text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inspection_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE id = p_job_id
      AND technician_id = p_technician_id
  ) THEN
    RAISE EXCEPTION 'Job not assigned to this technician';
  END IF;

  SELECT id
  INTO v_inspection_id
  FROM public.inspections
  WHERE job_id = p_job_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_inspection_id IS NULL THEN
    INSERT INTO public.inspections (
      job_id,
      technician_id,
      vehicle_id,
      status,
      items
    )
    VALUES (
      p_job_id,
      p_technician_id,
      p_vehicle_id,
      p_status,
      p_items
    )
    RETURNING id INTO v_inspection_id;
  ELSE
    UPDATE public.inspections
    SET
      technician_id = p_technician_id,
      vehicle_id = p_vehicle_id,
      status = p_status,
      items = p_items
    WHERE id = v_inspection_id;
  END IF;

  RETURN v_inspection_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_job_inspection(
  p_job_id uuid,
  p_technician_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE id = p_job_id
      AND technician_id = p_technician_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(i)
  INTO v_row
  FROM public.inspections i
  WHERE i.job_id = p_job_id
  ORDER BY i.created_at DESC
  LIMIT 1;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_job_checklist(
  p_job_id uuid,
  p_technician_id uuid,
  p_checklist jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line_items jsonb;
  v_new_items jsonb := '[]'::jsonb;
  v_meta jsonb := '{}'::jsonb;
  v_elem jsonb;
  i int;
BEGIN
  SELECT line_items
  INTO v_line_items
  FROM public.jobs
  WHERE id = p_job_id
    AND technician_id = p_technician_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or not assigned to this technician';
  END IF;

  IF v_line_items IS NULL THEN
    v_line_items := '[]'::jsonb;
  END IF;

  FOR i IN 0 .. GREATEST(COALESCE(jsonb_array_length(v_line_items), 0) - 1, -1) LOOP
    v_elem := v_line_items -> i;
    IF v_elem ->> 'name' = '__meta__' THEN
      v_meta := COALESCE(v_elem -> '_meta', '{}'::jsonb) - 'checklist';
    ELSE
      v_new_items := v_new_items || jsonb_build_array(v_elem);
    END IF;
  END LOOP;

  v_meta := v_meta || jsonb_build_object('checklist', p_checklist);

  v_new_items :=
    jsonb_build_array(
      jsonb_build_object(
        'name', '__meta__',
        '_meta', v_meta,
        'total', 0,
        'quantity', 0,
        'unitPrice', 0
      )
    ) || v_new_items;

  UPDATE public.jobs
  SET line_items = v_new_items
  WHERE id = p_job_id
    AND technician_id = p_technician_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_job_inspection(uuid, uuid, uuid, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_inspection(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_job_checklist(uuid, uuid, jsonb) TO anon, authenticated;
