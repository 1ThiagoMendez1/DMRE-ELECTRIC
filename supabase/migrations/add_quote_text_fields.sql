-- Migration to add missing text columns to cotizaciones table
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS alcance TEXT,
ADD COLUMN IF NOT EXISTS forma_pago TEXT,
ADD COLUMN IF NOT EXISTS nota_final TEXT;

-- Comments for clarity
COMMENT ON COLUMN public.cotizaciones.alcance IS 'Scope of work for the quotation.';
COMMENT ON COLUMN public.cotizaciones.forma_pago IS 'Payment terms/conditions.';
COMMENT ON COLUMN public.cotizaciones.nota_final IS 'Additional notes or terms displayed at the end of the quotation.';
