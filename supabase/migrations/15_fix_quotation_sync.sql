-- ====================================================================
-- FINAL FIX FOR QUOTATION SYNCHRONIZATION
-- RUN THIS IN SUPABASE SQL EDITOR
-- ====================================================================

-- 1. Add missing columns to 'cotizaciones' table
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS alcance TEXT,
ADD COLUMN IF NOT EXISTS forma_pago TEXT,
ADD COLUMN IF NOT EXISTS nota_final TEXT;

-- 2. Add missing columns to 'cotizacion_items' table
ALTER TABLE public.cotizacion_items
ADD COLUMN IF NOT EXISTS porcentaje NUMERIC DEFAULT 0;

-- 3. Update existing records if necessary (set defaults)
UPDATE public.cotizacion_items SET porcentaje = 0 WHERE porcentaje IS NULL;

-- 4. Comments for documentation
COMMENT ON COLUMN public.cotizaciones.alcance IS 'Scope of work for the quotation.';
COMMENT ON COLUMN public.cotizaciones.forma_pago IS 'Payment terms/conditions.';
COMMENT ON COLUMN public.cotizaciones.nota_final IS 'Additional notes or terms displayed at the end of the quotation.';
COMMENT ON COLUMN public.cotizacion_items.porcentaje IS 'Percentage increase applied to the unit price for this item.';
