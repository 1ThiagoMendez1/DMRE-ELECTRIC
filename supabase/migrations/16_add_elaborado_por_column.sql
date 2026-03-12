-- Migration to add elaborado_por column to cotizaciones table
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS elaborado_por TEXT;

COMMENT ON COLUMN public.cotizaciones.elaborado_por IS 'Stored name of the user who prepared/created the quotation.';
