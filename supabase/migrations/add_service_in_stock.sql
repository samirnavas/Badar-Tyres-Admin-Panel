-- Stock availability flag for service catalog items
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS services_in_stock_idx ON public.services (in_stock);
