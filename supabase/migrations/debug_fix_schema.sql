-- ====================================================================
-- DEBUG FIX: MISSING COLUMNS IN 'cotizaciones' TABLE
-- RUN THIS IN SUPABASE SQL EDITOR TO RESOLVE SCHEMA CACHE ERRORS
-- ====================================================================

-- 1. Add missing columns to 'cotizaciones' table
ALTER TABLE public.cotizaciones 
ADD COLUMN IF NOT EXISTS alcance TEXT,
ADD COLUMN IF NOT EXISTS forma_pago TEXT,
ADD COLUMN IF NOT EXISTS nota_final TEXT,
ADD COLUMN IF NOT EXISTS elaborado_por TEXT,
ADD COLUMN IF NOT EXISTS cotizacion_estado TEXT;

-- 2. Add missing columns to 'cotizacion_items' table
ALTER TABLE public.cotizacion_items
ADD COLUMN IF NOT EXISTS porcentaje NUMERIC DEFAULT 0;

-- 3. Reload schema cache (PostgREST)
NOTIFY pgrst, 'reload schema';

-- 4. Comments for documentation
COMMENT ON COLUMN public.cotizaciones.alcance IS 'Scope of work for the quotation.';
COMMENT ON COLUMN public.cotizaciones.forma_pago IS 'Payment terms/conditions.';
COMMENT ON COLUMN public.cotizaciones.nota_final IS 'Additional notes or terms displayed at the end of the quotation.';
COMMENT ON COLUMN public.cotizaciones.elaborado_por IS 'Stored name of the user who prepared/created the quotation.';
COMMENT ON COLUMN public.cotizacion_items.porcentaje IS 'Percentage increase applied to the unit price for this item.';
