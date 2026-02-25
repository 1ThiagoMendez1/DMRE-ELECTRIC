-- Create the servicios_logistica table
CREATE TABLE IF NOT EXISTS public.servicios_logistica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    costo NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.servicios_logistica ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read servicios" 
ON public.servicios_logistica 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow all authenticated users to insert
CREATE POLICY "Allow authenticated users to insert servicios" 
ON public.servicios_logistica 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy to allow all authenticated users to update
CREATE POLICY "Allow authenticated users to update servicios" 
ON public.servicios_logistica 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policy to allow all authenticated users to delete
CREATE POLICY "Allow authenticated users to delete servicios" 
ON public.servicios_logistica 
FOR DELETE 
TO authenticated 
USING (true);
