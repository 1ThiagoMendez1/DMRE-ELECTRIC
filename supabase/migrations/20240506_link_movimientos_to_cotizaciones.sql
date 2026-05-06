-- Add cotizacion_id to movimientos_financieros to link expenses to offers
ALTER TABLE public.movimientos_financieros ADD COLUMN IF NOT EXISTS cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_cotizacion ON public.movimientos_financieros(cotizacion_id);
