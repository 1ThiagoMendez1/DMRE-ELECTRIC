-- Add 'archivos' column to 'empleados' table to store file references
ALTER TABLE public.empleados
ADD COLUMN IF NOT EXISTS archivos JSONB DEFAULT '[]'::JSONB;

-- Comment on column
COMMENT ON COLUMN public.empleados.archivos IS 'List of files uploaded for the employee (Contract, CV, etc). Stored as JSON array of objects: { name, url, date, type }';
