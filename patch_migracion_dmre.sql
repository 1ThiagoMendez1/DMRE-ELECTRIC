
-- --- Patch from setup_servicios.sql ---
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

-- --- Patch from 002_add_missing_columns.sql ---
-- Migration to add potentially missing columns to cotizaciones table
-- Run this in Supabase SQL Editor to fix "Column does not exist" errors

alter table cotizaciones
    add column if not exists cotizacion_estado text, -- Legacy/Dual support
    add column if not exists direccion_proyecto text,
    add column if not exists ubicacion jsonb,
    add column if not exists fecha_inicio timestamptz,
    add column if not exists fecha_fin_estimada timestamptz,
    add column if not exists fecha_fin_real timestamptz,
    add column if not exists costo_real numeric,
    add column if not exists responsable_id text,
    add column if not exists progreso numeric default 0,
    add column if not exists notas text,
    add column if not exists evidencia jsonb default '[]'::jsonb,
    add column if not exists comentarios jsonb default '[]'::jsonb,
    add column if not exists aiu_admin_global_porcentaje numeric default 0,
    add column if not exists aiu_imprevisto_global_porcentaje numeric default 0,
    add column if not exists aiu_utilidad_global_porcentaje numeric default 0,
    add column if not exists iva_utilidad_global_porcentaje numeric default 19,
    add column if not exists descuento_global numeric default 0,
    add column if not exists descuento_global_porcentaje numeric default 0,
    add column if not exists impuesto_global_porcentaje numeric default 19;

-- Ensure RLS allows updates to these columns if needed (Policies usually cover all cols, but good to check)

-- --- Patch from 004_add_empleado_files.sql ---
-- Add 'archivos' column to 'empleados' table to store file references
ALTER TABLE public.empleados
ADD COLUMN IF NOT EXISTS archivos JSONB DEFAULT '[]'::JSONB;

-- Comment on column
COMMENT ON COLUMN public.empleados.archivos IS 'List of files uploaded for the employee (Contract, CV, etc). Stored as JSON array of objects: { name, url, date, type }';

-- --- Patch from 11_support_nested_apus.sql ---
-- =============================================
-- MIGRATION: 11_support_nested_apus
-- =============================================
-- Authorization: Support recursive APUs (APUs within APUs)

-- 1. Add sub_codigo_id to materiales_asociados
-- This column references codigos_trabajo(id) and is mutually exclusive (conceptually) with inventario_id,
-- or can be used alongside it depending on logic, but typically an item is either a raw material or a sub-assembly.
ALTER TABLE public.materiales_asociados
ADD COLUMN IF NOT EXISTS sub_codigo_id UUID REFERENCES public.codigos_trabajo(id) ON DELETE SET NULL;

-- 2. Add index for performance
CREATE INDEX idx_materiales_asociados_sub_codigo ON public.materiales_asociados(sub_codigo_id);

-- 3. Relax constraint if any (currently there isn't a strict check, but good to note)
-- We should ensure that EITHER inventario_id OR sub_codigo_id is present, but not both NULL.
-- For now, we leave it flexible to avoid breaking existing queries, but UI should enforce it.

-- --- Patch from 15_fix_quotation_sync.sql ---
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

-- --- Patch from 16_add_elaborado_por_column.sql ---
-- Migration to add elaborado_por column to cotizaciones table
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS elaborado_por TEXT;

COMMENT ON COLUMN public.cotizaciones.elaborado_por IS 'Stored name of the user who prepared/created the quotation.';

-- --- Patch from add_item_porcentaje_column.sql ---
-- Migration to add porcentaje column to cotizacion_items table
ALTER TABLE public.cotizacion_items
ADD COLUMN IF NOT EXISTS porcentaje NUMERIC DEFAULT 0;

-- Comments for clarity
COMMENT ON COLUMN public.cotizacion_items.porcentaje IS 'Percentage increase applied to the unit price for this item.';

-- --- Patch from add_quote_text_fields.sql ---
-- Migration to add missing text columns to cotizaciones table
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS alcance TEXT,
ADD COLUMN IF NOT EXISTS forma_pago TEXT,
ADD COLUMN IF NOT EXISTS nota_final TEXT;

-- Comments for clarity
COMMENT ON COLUMN public.cotizaciones.alcance IS 'Scope of work for the quotation.';
COMMENT ON COLUMN public.cotizaciones.forma_pago IS 'Payment terms/conditions.';
COMMENT ON COLUMN public.cotizaciones.nota_final IS 'Additional notes or terms displayed at the end of the quotation.';

-- --- Patch from debug_fix_schema.sql ---
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

-- --- Missing notas in proveedores ---
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS notas text;

