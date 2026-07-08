CREATE TABLE IF NOT EXISTS public.permissions (
  role text PRIMARY KEY,
  routes jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.permissions;
CREATE POLICY "Enable read access for authenticated users"
ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for admins only" ON public.permissions;
CREATE POLICY "Enable insert for admins only"
ON public.permissions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
  )
);

DROP POLICY IF EXISTS "Enable update for admins only" ON public.permissions;
CREATE POLICY "Enable update for admins only"
ON public.permissions FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
  )
);

DROP POLICY IF EXISTS "Enable delete for admins only" ON public.permissions;
CREATE POLICY "Enable delete for admins only"
ON public.permissions FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
  )
);

-- Seed default role permissions only when the table is empty
INSERT INTO public.permissions (role, routes)
SELECT role, routes
FROM (
  VALUES
    ('Admin', '["*"]'::jsonb),
    (
      'Manager',
      '[
        "/dashboard",
        "/jobs",
        "/services",
        "/inventory",
        "/customers",
        "/bays",
        "/billing",
        "action:apply_discount"
      ]'::jsonb
    ),
    (
      'Supervisor',
      '[
        "/dashboard",
        "/jobs",
        "/services",
        "/inventory",
        "/customers",
        "/bays"
      ]'::jsonb
    ),
    (
      'Team Lead',
      '["/dashboard", "/jobs", "/inventory", "/bays"]'::jsonb
    ),
    (
      'Technician',
      '["/dashboard", "/jobs", "/bays"]'::jsonb
    ),
    (
      'Sales',
      '["/billing", "/dashboard", "/jobs", "/services"]'::jsonb
    )
) AS defaults(role, routes)
WHERE NOT EXISTS (SELECT 1 FROM public.permissions LIMIT 1);
