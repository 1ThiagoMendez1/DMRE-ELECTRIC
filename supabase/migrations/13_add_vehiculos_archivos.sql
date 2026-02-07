-- Add 'archivos' column to 'vehiculos' table if it doesn't exist
ALTER TABLE public.vehiculos 
ADD COLUMN IF NOT EXISTS archivos JSONB DEFAULT '[]'::jsonb;
