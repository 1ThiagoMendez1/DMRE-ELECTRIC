-- Migration to add porcentaje column to cotizacion_items table
ALTER TABLE public.cotizacion_items
ADD COLUMN IF NOT EXISTS porcentaje NUMERIC DEFAULT 0;

-- Comments for clarity
COMMENT ON COLUMN public.cotizacion_items.porcentaje IS 'Percentage increase applied to the unit price for this item.';
