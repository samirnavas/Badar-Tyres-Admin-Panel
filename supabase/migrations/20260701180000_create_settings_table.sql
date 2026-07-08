CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name text NOT NULL DEFAULT '',
  shop_address text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  default_gst_rate numeric NOT NULL DEFAULT 0,
  terms_and_conditions text NOT NULL DEFAULT '',
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS (allow authenticated users to read, admins to update)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.settings;
CREATE POLICY "Enable read access for authenticated users"
ON public.settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update for admins only" ON public.settings;
CREATE POLICY "Enable update for admins only"
ON public.settings FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
  )
);

DROP POLICY IF EXISTS "Enable insert for admins only" ON public.settings;
CREATE POLICY "Enable insert for admins only"
ON public.settings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
  )
);

-- Seed default settings data only when the table is empty
INSERT INTO public.settings (
  shop_name,
  shop_address,
  contact_phone,
  contact_email,
  default_gst_rate,
  terms_and_conditions
)
SELECT
  'Badar Tyres & Auto Car',
  'Wayanad Road Koduvally, Kozhikode',
  '+91 9188954101',
  'info@badartyres.com',
  16,
  'This is the terms and conditions.'
WHERE NOT EXISTS (SELECT 1 FROM public.settings LIMIT 1);
