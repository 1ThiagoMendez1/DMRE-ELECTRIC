-- Add credit management columns
ALTER TABLE public.movimientos_financieros ADD COLUMN IF NOT EXISTS cuotas INTEGER;
ALTER TABLE public.movimientos_financieros ADD COLUMN IF NOT EXISTS cuota_actual INTEGER;

ALTER TABLE public.compras_financiera ADD COLUMN IF NOT EXISTS cuotas INTEGER DEFAULT 1;
