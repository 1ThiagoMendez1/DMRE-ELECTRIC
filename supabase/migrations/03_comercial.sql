-- =============================================
-- 03_COMERCIAL - Gestión Comercial
-- =============================================

-- =============================================
-- TABLA: clientes
-- =============================================
CREATE TABLE public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    tipo_documento TEXT DEFAULT 'NIT',
    documento TEXT,
    direccion TEXT,
    ciudad TEXT,
    correo TEXT,
    telefono TEXT,
    contacto_principal TEXT,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_clientes_modtime
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_clientes_codigo ON public.clientes(codigo);
CREATE INDEX idx_clientes_documento ON public.clientes(documento);
CREATE INDEX idx_clientes_nombre ON public.clientes(nombre);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes access for authenticated"
    ON public.clientes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: trabajos (proyectos/obras)
-- =============================================
CREATE TABLE public.trabajos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    descripcion TEXT,
    ubicacion TEXT,
    direccion TEXT,
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    estado trabajo_estado DEFAULT 'COTIZADO',
    presupuesto NUMERIC(15,2) DEFAULT 0,
    costo_real NUMERIC(15,2) DEFAULT 0,
    responsable_id UUID REFERENCES public.profiles(id),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_trabajos_modtime
    BEFORE UPDATE ON public.trabajos
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_trabajos_codigo ON public.trabajos(codigo);
CREATE INDEX idx_trabajos_cliente ON public.trabajos(cliente_id);
CREATE INDEX idx_trabajos_estado ON public.trabajos(estado);

ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trabajos access for authenticated"
    ON public.trabajos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: cotizaciones
-- =============================================
CREATE TABLE public.cotizaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero TEXT UNIQUE,
    tipo cotizacion_tipo DEFAULT 'NORMAL',
    fecha DATE DEFAULT CURRENT_DATE,
    fecha_validez DATE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    descripcion_trabajo TEXT,
    condiciones TEXT,
    -- Valores
    subtotal NUMERIC(15,2) DEFAULT 0,
    aiu_admin NUMERIC(5,2) DEFAULT 0,
    aiu_imprevistos NUMERIC(5,2) DEFAULT 0,
    aiu_utilidad NUMERIC(5,2) DEFAULT 0,
    valor_aiu NUMERIC(15,2) DEFAULT 0,
    iva_porcentaje NUMERIC(5,2) DEFAULT 19,
    iva NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    -- Estado
    estado cotizacion_estado DEFAULT 'BORRADOR',
    creado_por UUID REFERENCES public.profiles(id),
    aprobado_por UUID REFERENCES public.profiles(id),
    fecha_aprobacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_cotizaciones_modtime
    BEFORE UPDATE ON public.cotizaciones
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_cotizaciones_numero ON public.cotizaciones(numero);
CREATE INDEX idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_trabajo ON public.cotizaciones(trabajo_id);
CREATE INDEX idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX idx_cotizaciones_fecha ON public.cotizaciones(fecha);

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cotizaciones access for authenticated"
    ON public.cotizaciones FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: cotizacion_items
-- =============================================
CREATE TABLE public.cotizacion_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE CASCADE NOT NULL,
    inventario_id UUID, -- Se agregará FK después
    codigo_trabajo_id UUID, -- Se agregará FK después
    item_numero INTEGER,
    descripcion TEXT NOT NULL,
    unidad TEXT DEFAULT 'UND',
    cantidad NUMERIC(12,4) DEFAULT 1,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cotizacion_items_cotizacion ON public.cotizacion_items(cotizacion_id);

ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cotizacion items access for authenticated"
    ON public.cotizacion_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: facturas
-- =============================================
CREATE TABLE public.facturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero TEXT UNIQUE,
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    -- Fechas
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    -- Valores
    subtotal NUMERIC(15,2) DEFAULT 0,
    iva NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) DEFAULT 0,
    anticipo_recibido NUMERIC(15,2) DEFAULT 0,
    -- Retenciones
    retencion_fuente NUMERIC(15,2) DEFAULT 0,
    retencion_ica NUMERIC(15,2) DEFAULT 0,
    retencion_iva NUMERIC(15,2) DEFAULT 0,
    -- Saldo
    valor_pagado NUMERIC(15,2) DEFAULT 0,
    saldo_pendiente NUMERIC(15,2) DEFAULT 0,
    -- Estado
    estado factura_estado DEFAULT 'BORRADOR',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_facturas_modtime
    BEFORE UPDATE ON public.facturas
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_facturas_numero ON public.facturas(numero);
CREATE INDEX idx_facturas_cliente ON public.facturas(cliente_id);
CREATE INDEX idx_facturas_cotizacion ON public.facturas(cotizacion_id);
CREATE INDEX idx_facturas_estado ON public.facturas(estado);
CREATE INDEX idx_facturas_fecha ON public.facturas(fecha_emision);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facturas access for authenticated"
    ON public.facturas FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);



    -- =============================================
-- Atualizacion tablas cotizaciones schema update
-- =============================================
-- Add missing columns to 'cotizaciones' table
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS direccion_proyecto TEXT,
ADD COLUMN IF NOT EXISTS ubicacion JSONB,
ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_fin_estimada TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_fin_real TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS costo_real NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS responsable_id TEXT,
ADD COLUMN IF NOT EXISTS evidencia JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comentarios JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS descuento_global NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_global_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS impuesto_global_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_admin_global_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_imprevisto_global_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_utilidad_global_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_utilidad_global_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_admin NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_imprevistos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_utilidad NUMERIC DEFAULT 0;
-- Add missing columns to 'cotizacion_items' table
ALTER TABLE cotizacion_items
ADD COLUMN IF NOT EXISTS descuento_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS impuesto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ocultar_detalles BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sub_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_admin_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_imprevisto_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aiu_utilidad_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_utilidad_porcentaje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notas TEXT;
-- Verify columns (Optional for user, just output to confirm)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cotizaciones';


    -- =============================================
-- Atualizacion tablas cotizaciones schema repair precision
-- =============================================
-- Add missing columns to 'cotizaciones' table


-- DEFINITIVE FIX FOR NUMERIC OVERFLOW (V2 - Handling Generated Columns)
-- This script broadens all numeric columns in 'cotizaciones' and 'cotizacion_items'
-- and correctly handles the 'valor_total' generated column blocker.
-- 1. DROP Generated columns that block type alteration
ALTER TABLE cotizacion_items DROP COLUMN IF EXISTS valor_total;
-- 2. Broaden 'cotizaciones' columns
ALTER TABLE cotizaciones 
  ALTER COLUMN subtotal TYPE NUMERIC,
  ALTER COLUMN iva TYPE NUMERIC,
  ALTER COLUMN total TYPE NUMERIC,
  ALTER COLUMN descuento_global TYPE NUMERIC,
  ALTER COLUMN descuento_global_porcentaje TYPE NUMERIC,
  ALTER COLUMN impuesto_global_porcentaje TYPE NUMERIC,
  ALTER COLUMN aiu_admin_global_porcentaje TYPE NUMERIC,
  ALTER COLUMN aiu_imprevisto_global_porcentaje TYPE NUMERIC,
  ALTER COLUMN aiu_utilidad_global_porcentaje TYPE NUMERIC,
  ALTER COLUMN iva_utilidad_global_porcentaje TYPE NUMERIC,
  ALTER COLUMN aiu_admin TYPE NUMERIC,
  ALTER COLUMN aiu_imprevistos TYPE NUMERIC,
  ALTER COLUMN aiu_utilidad TYPE NUMERIC,
  ALTER COLUMN costo_real TYPE NUMERIC;
-- 3. Broaden 'cotizacion_items' source columns
ALTER TABLE cotizacion_items
  ALTER COLUMN cantidad TYPE NUMERIC,
  ALTER COLUMN valor_unitario TYPE NUMERIC,
  ALTER COLUMN descuento_valor TYPE NUMERIC,
  ALTER COLUMN descuento_porcentaje TYPE NUMERIC,
  ALTER COLUMN impuesto TYPE NUMERIC,
  ALTER COLUMN costo_unitario TYPE NUMERIC,
  ALTER COLUMN aiu_admin_porcentaje TYPE NUMERIC,
  ALTER COLUMN aiu_imprevisto_porcentaje TYPE NUMERIC,
  ALTER COLUMN aiu_utilidad_porcentaje TYPE NUMERIC,
  ALTER COLUMN iva_utilidad_porcentaje TYPE NUMERIC;
-- 4. RECREATE 'valor_total' as a broader NUMERIC generated column
ALTER TABLE cotizacion_items 
  ADD COLUMN valor_total NUMERIC GENERATED ALWAYS AS (cantidad * valor_unitario) STORED;
-- 5. Ensure defaults are set to 0 where they might be null
UPDATE cotizaciones SET 
  subtotal = COALESCE(subtotal, 0),
  iva = COALESCE(iva, 0),
  total = COALESCE(total, 0);
UPDATE cotizacion_items SET
  valor_unitario = COALESCE(valor_unitario, 0);



    -- =============================================
-- Atualizacion tablas cotizaciones schema repair precision
-- =============================================
-- Add missing columns to 'cotizaciones' table

ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS progreso NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cotizacion_estado TEXT,
ADD COLUMN IF NOT EXISTS notas TEXT;
-- Migración de datos existentes (opcional)
UPDATE cotizaciones SET cotizacion_estado = estado WHERE cotizacion_estado IS NULL;




-- =============================================
-- FIX STORAGE RLS POLICIES FOR EVIDENCE
-- =============================================
-- 1. Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes', 'imagenes', true)
ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;
-- 3. Create permissive policies for 'imagenes' bucket
CREATE POLICY "Public Read Imagenes"
ON storage.objects FOR SELECT
USING ( bucket_id = 'imagenes' );
CREATE POLICY "Public Insert Imagenes"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'imagenes' );
-- 4. Create permissive policies for 'videos' bucket
CREATE POLICY "Public Read Videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );
CREATE POLICY "Public Insert Videos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'videos' );
-- 5. Global Policy (Optional, if you want full public access for everything in these buckets)
-- CREATE POLICY "Public All"
-- ON storage.objects FOR ALL
-- USING ( bucket_id IN ('imagenes', 'videos') )
-- WITH CHECK ( bucket_id IN ('imagenes', 'videos') );