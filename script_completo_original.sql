
-- ================================
-- 01_base.sql
-- ================================
-- Drop ALL storage policies first to avoid "already exists" errors
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;
-- ================================
-- =============================================
-- 01_BASE - Extensiones, Funciones y ENUMS
-- =============================================

-- ExtensiÃƒÂ³n para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- FUNCIÃƒâ€œN: Actualizar timestamp automÃƒÂ¡ticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- =============================================
-- TIPOS ENUM
-- =============================================

-- Primero eliminar tipos si existen (para evitar errores)
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP TYPE IF EXISTS tarea_prioridad CASCADE;
-- DROP TYPE IF EXISTS tarea_estado CASCADE;
-- DROP TYPE IF EXISTS trabajo_estado CASCADE;
-- DROP TYPE IF EXISTS cotizacion_estado CASCADE;
-- DROP TYPE IF EXISTS cotizacion_tipo CASCADE;
-- DROP TYPE IF EXISTS factura_estado CASCADE;
-- DROP TYPE IF EXISTS cuenta_tipo CASCADE;
-- DROP TYPE IF EXISTS movimiento_tipo CASCADE;
-- DROP TYPE IF EXISTS movimiento_categoria CASCADE;
-- DROP TYPE IF EXISTS inventario_categoria CASCADE;
-- DROP TYPE IF EXISTS inventario_ubicacion CASCADE;
-- DROP TYPE IF EXISTS proveedor_categoria CASCADE;
-- DROP TYPE IF EXISTS gasto_vehiculo_tipo CASCADE;
-- DROP TYPE IF EXISTS alerta_tipo CASCADE;
-- DROP TYPE IF EXISTS movimiento_inventario_tipo CASCADE;
-- DROP TYPE IF EXISTS entrega_estado CASCADE;
-- DROP TYPE IF EXISTS empleado_estado CASCADE;
-- DROP TYPE IF EXISTS novedad_tipo CASCADE;
-- DROP TYPE IF EXISTS liquidacion_tipo CASCADE;

-- Control y Sistema
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'ENGINEER', 'OPERATOR', 'VIEWER');
CREATE TYPE tarea_prioridad AS ENUM ('ALTA', 'MEDIA', 'BAJA');
CREATE TYPE tarea_estado AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- GestiÃƒÂ³n Comercial
CREATE TYPE trabajo_estado AS ENUM ('COTIZADO', 'APROBADO', 'EN_EJECUCION', 'PAUSADO', 'FINALIZADO', 'CANCELADO');
CREATE TYPE cotizacion_estado AS ENUM ('BORRADOR', 'PENDIENTE', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'EN_EJECUCION', 'FINALIZADA');
CREATE TYPE cotizacion_tipo AS ENUM ('NORMAL', 'SIMPLIFICADA');
CREATE TYPE factura_estado AS ENUM ('BORRADOR', 'PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA');

-- Financiera
CREATE TYPE cuenta_tipo AS ENUM ('BANCO', 'EFECTIVO', 'CREDITO');
CREATE TYPE movimiento_tipo AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE movimiento_categoria AS ENUM ('NOMINA', 'PROVEEDORES', 'SERVICIOS', 'IMPUESTOS', 'VENTAS', 'ANTICIPOS', 'OTROS');

-- LogÃƒÂ­stica e Inventarios
CREATE TYPE inventario_categoria AS ENUM ('MATERIAL', 'HERRAMIENTA', 'DOTACION', 'EPP', 'EQUIPO');
CREATE TYPE inventario_ubicacion AS ENUM ('BODEGA', 'OBRA', 'TRANSITO', 'BAJA');
CREATE TYPE proveedor_categoria AS ENUM ('MATERIALES', 'SERVICIOS', 'MIXTO');
CREATE TYPE gasto_vehiculo_tipo AS ENUM ('COMBUSTIBLE', 'PEAJE', 'MANTENIMIENTO', 'PARQUEADERO', 'LAVADO', 'SEGURO', 'OTROS');
CREATE TYPE alerta_tipo AS ENUM ('STOCK_BAJO', 'VENCIMIENTO_DOCUMENTO', 'PAGO_PENDIENTE', 'OTRO');
CREATE TYPE movimiento_inventario_tipo AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRASLADO');
CREATE TYPE entrega_estado AS ENUM ('PENDIENTE', 'ENTREGADO', 'RECHAZADO');

-- Talento Humano
CREATE TYPE empleado_estado AS ENUM ('ACTIVO', 'INACTIVO', 'LICENCIA', 'VACACIONES', 'RETIRADO');
CREATE TYPE novedad_tipo AS ENUM ('HORA_EXTRA_DIURNA', 'HORA_EXTRA_NOCTURNA', 'HORA_EXTRA_FESTIVA', 'RECARGO_NOCTURNO', 'DOMINICAL', 'PRESTAMO', 'DESCUENTO', 'AUXILIO', 'AUSENCIA', 'INCAPACIDAD', 'LICENCIA', 'OTRO');
CREATE TYPE liquidacion_tipo AS ENUM ('DEFINITIVA', 'PARCIAL', 'VACACIONES');

-- ================================
-- 02_control.sql
-- ================================
-- =============================================
-- 02_CONTROL - Control y Sistema
-- =============================================

-- =============================================
-- TABLA: profiles (vinculada a auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role user_role DEFAULT 'VIEWER',
    avatar_url TEXT,
    phone TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (select auth.uid()) AND role = 'ADMIN'
        )
    );

-- FunciÃƒÂ³n para crear perfil automÃƒÂ¡ticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TABLA: roles (roles personalizados)
-- =============================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS update_roles_modtime ON public.roles;
CREATE TRIGGER update_roles_modtime
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
CREATE POLICY "Roles viewable by authenticated" ON public.roles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;
CREATE POLICY "Only admin can manage roles" ON public.roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (select auth.uid()) AND role = 'ADMIN'
        )
    );

-- =============================================
-- TABLA: agenda (tareas y recordatorios)
-- =============================================
CREATE TABLE public.agenda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_vencimiento DATE,
    hora TIME,
    asignado_a UUID REFERENCES public.profiles(id),
    creado_por UUID REFERENCES public.profiles(id),
    prioridad tarea_prioridad DEFAULT 'MEDIA',
    estado tarea_estado DEFAULT 'PENDIENTE',
    etiquetas TEXT[],
    recordatorio BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_agenda_modtime
    BEFORE UPDATE ON public.agenda
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_agenda_asignado ON public.agenda(asignado_a);
CREATE INDEX IF NOT EXISTS idx_agenda_fecha ON public.agenda(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_agenda_estado ON public.agenda(estado);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own tasks or if admin" ON public.agenda;
CREATE POLICY "Users see own tasks or if admin" ON public.agenda FOR SELECT
    TO authenticated
    USING (
        asignado_a = (select auth.uid()) 
        OR creado_por = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (select auth.uid()) AND role IN ('ADMIN', 'MANAGER')
        )
    );

DROP POLICY IF EXISTS "Authenticated can create tasks" ON public.agenda;
CREATE POLICY "Authenticated can create tasks" ON public.agenda FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.agenda;
CREATE POLICY "Users can update own tasks" ON public.agenda FOR UPDATE
    TO authenticated
    USING (
        asignado_a = (select auth.uid()) 
        OR creado_por = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (select auth.uid()) AND role IN ('ADMIN', 'MANAGER')
        )
    );

DROP POLICY IF EXISTS "Admin can delete tasks" ON public.agenda;
CREATE POLICY "Admin can delete tasks" ON public.agenda FOR DELETE
    TO authenticated
    USING (
        creado_por = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (select auth.uid()) AND role = 'ADMIN'
        )
    );
















-- 1. UPGRADE PROFILES
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. CREATE AGENDA TABLE
CREATE TABLE IF NOT EXISTS agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    asignado_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    prioridad TEXT CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
    estado TEXT CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA')) DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROLES AND PERMISSIONS SCHEMA

-- 3.1 Permissions Catalog (Resources)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- e.g. "Control de Usuarios"
    module TEXT NOT NULL,               -- e.g. "usuarios"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 Role Permissions Pivot (Granular access)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL, -- Linking to 'role' string in profiles/auth or a separate roles table if strictly normalized. 
                        -- Given current architecture uses 'role' string in profiles, we key off that string or create a roles table.
                        -- User requested "Mantener roles como catÃƒÂ¡logo", implying a roles table might exist or we just use the string enum.
                        -- However, standard practice is a roles table. Let's start by ensuring roles table exists or we stick to string based on USER REQUEST "Tabla Actual: roles".
                        -- If "Tabla Actual: roles" exists (as user said), we reference it. If not, we create it.
                        -- User provided: "Tabla Actual: roles ... id, name..."
                        -- I will assume 'roles' table exists.
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    
    UNIQUE(role_id, permission_id)
);

-- 4. SEED DATA

-- 4.1 Seed Permissions (Modules)
INSERT INTO permissions (name, module, description) VALUES
('Dashboard General', 'dashboard', 'Acceso al resumen general del sistema'),
('GestiÃƒÂ³n de Usuarios', 'usuarios', 'AdministraciÃƒÂ³n de usuarios y accesos'),
('Agenda de Tareas', 'agenda', 'GestiÃƒÂ³n de calendario y tareas'),
('Inventario', 'inventario', 'GestiÃƒÂ³n de stock y productos'),
('Clientes', 'clientes', 'Base de datos de clientes'),
('Proveedores', 'proveedores', 'Base de datos de proveedores'),
('Cotizaciones', 'cotizaciones', 'GestiÃƒÂ³n de ofertas comerciales'),
('FacturaciÃƒÂ³n', 'facturas', 'GestiÃƒÂ³n financiera y facturas'),
('Activos y Flota', 'activos', 'GestiÃƒÂ³n de vehÃƒÂ­culos y equipos'),
('Roles y Permisos', 'roles', 'AdministraciÃƒÂ³n de seguridad')
ON CONFLICT (name) DO NOTHING;

-- 4.2 Seed Admin Permissions (Full Access)
-- Asumiendo que el rol ADMIN ya existe en la tabla 'roles'. Si no, deberÃƒÂ­amos crearlo.
-- DO $$ 
-- DECLARE 
--     admin_role_id UUID;
-- BEGIN
--     SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
    
--     IF admin_role_id IS NOT NULL THEN
--         INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
--         SELECT admin_role_id, id, TRUE, TRUE, TRUE, TRUE FROM permissions
--         ON CONFLICT DO NOTHING;
--     END IF;
-- END $$;






-- FIX: Add missing Foreign Key for Agenda -> Profiles
-- This ensures the relationship 'asignado_a' exists for Supabase queries.

DO $$
BEGIN
    -- 1. Check if the constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'agenda' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Verify column exists first
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda' AND column_name = 'asignado_a') THEN
            ALTER TABLE "agenda" 
            ADD CONSTRAINT "agenda_asignado_a_fkey" 
            FOREIGN KEY ("asignado_a") 
            REFERENCES "profiles" ("id") 
            ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 2. Force Notify Schema Cache Reload (Optional, usually automatic)
NOTIFY pgrst, 'reload config';




-- 1. Upgrade current user to ADMIN (This fixes the RLS error)
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = (select auth.uid());

-- 2. Ensure roles exist
INSERT INTO public.roles (name, description) VALUES 
('ADMIN', 'Administrador del Sistema'),
('MANAGER', 'Gerente'),
('VIEWER', 'Visualizador')
ON CONFLICT (name) DO NOTHING;
-- ================================
-- 03_comercial.sql
-- ================================
-- =============================================
-- 03_COMERCIAL - GestiÃƒÂ³n Comercial
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

CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON public.clientes(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON public.clientes(documento);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clientes access for authenticated" ON public.clientes;
CREATE POLICY "Clientes access for authenticated" ON public.clientes FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_trabajos_codigo ON public.trabajos(codigo);
CREATE INDEX IF NOT EXISTS idx_trabajos_cliente ON public.trabajos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON public.trabajos(estado);

ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trabajos access for authenticated" ON public.trabajos;
CREATE POLICY "Trabajos access for authenticated" ON public.trabajos FOR ALL
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
    opciones_pdf JSONB DEFAULT '{}'::jsonb,
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

CREATE INDEX IF NOT EXISTS idx_cotizaciones_numero ON public.cotizaciones(numero);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_trabajo ON public.cotizaciones(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON public.cotizaciones(fecha);

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cotizaciones access for authenticated" ON public.cotizaciones;
CREATE POLICY "Cotizaciones access for authenticated" ON public.cotizaciones FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: cotizacion_items
-- =============================================
CREATE TABLE public.cotizacion_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE CASCADE NOT NULL,
    inventario_id UUID, -- Se agregarÃƒÂ¡ FK despuÃƒÂ©s
    codigo_trabajo_id UUID, -- Se agregarÃƒÂ¡ FK despuÃƒÂ©s
    item_numero INTEGER,
    descripcion TEXT NOT NULL,
    unidad TEXT DEFAULT 'UND',
    cantidad NUMERIC(12,4) DEFAULT 1,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion ON public.cotizacion_items(cotizacion_id);

ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cotizacion items access for authenticated" ON public.cotizacion_items;
CREATE POLICY "Cotizacion items access for authenticated" ON public.cotizacion_items FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_facturas_numero ON public.facturas(numero);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON public.facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cotizacion ON public.facturas(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON public.facturas(fecha_emision);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facturas access for authenticated" ON public.facturas;
CREATE POLICY "Facturas access for authenticated" ON public.facturas FOR ALL
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
-- MigraciÃƒÂ³n de datos existentes (opcional)
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
DROP POLICY IF EXISTS "Public Read Imagenes" ON storage.objects;
CREATE POLICY "Public Read Imagenes" ON storage.objects FOR SELECT
USING ( bucket_id = 'imagenes' );
DROP POLICY IF EXISTS "Public Insert Imagenes" ON storage.objects;
CREATE POLICY "Public Insert Imagenes" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'imagenes' );
-- 4. Create permissive policies for 'videos' bucket
DROP POLICY IF EXISTS "Public Read Videos" ON storage.objects;
CREATE POLICY "Public Read Videos" ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );
DROP POLICY IF EXISTS "Public Insert Videos" ON storage.objects;
CREATE POLICY "Public Insert Videos" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'videos' );
-- 5. Global Policy (Optional, if you want full public access for everything in these buckets)
-- CREATE POLICY "Public All"
-- ON storage.objects FOR ALL
-- USING ( bucket_id IN ('imagenes', 'videos') )
-- WITH CHECK ( bucket_id IN ('imagenes', 'videos') );
-- ================================
-- 04_logistica.sql
-- ================================
-- =============================================
-- 04_LOGISTICA - LogÃƒÂ­stica e Inventarios
-- =============================================

-- =============================================
-- TABLA: proveedores
-- =============================================
CREATE TABLE public.proveedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    nit TEXT,
    categoria proveedor_categoria DEFAULT 'MIXTO',
    direccion TEXT,
    ciudad TEXT,
    correo TEXT,
    telefono TEXT,
    contacto TEXT,
    datos_bancarios JSONB DEFAULT '{}',
    calificacion INTEGER DEFAULT 5 CHECK (calificacion >= 1 AND calificacion <= 5),
    activo BOOLEAN DEFAULT true,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_proveedores_modtime
    BEFORE UPDATE ON public.proveedores
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_proveedores_nit ON public.proveedores(nit);
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON public.proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_categoria ON public.proveedores(categoria);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proveedores access for authenticated" ON public.proveedores;
CREATE POLICY "Proveedores access for authenticated" ON public.proveedores FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: inventario (CatÃƒÂ¡logo)
-- =============================================
CREATE TABLE public.inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE,
    codigo TEXT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria inventario_categoria DEFAULT 'MATERIAL',
    ubicacion inventario_ubicacion DEFAULT 'BODEGA',
    unidad TEXT DEFAULT 'UND',
    cantidad NUMERIC(12,4) DEFAULT 0,
    stock_minimo NUMERIC(12,4) DEFAULT 0,
    stock_maximo NUMERIC(12,4),
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    marca TEXT,
    modelo TEXT,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_inventario_modtime
    BEFORE UPDATE ON public.inventario
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_inventario_sku ON public.inventario(sku);
CREATE INDEX IF NOT EXISTS idx_inventario_codigo ON public.inventario(codigo);
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON public.inventario(categoria);
CREATE INDEX IF NOT EXISTS idx_inventario_ubicacion ON public.inventario(ubicacion);
CREATE INDEX IF NOT EXISTS idx_inventario_proveedor ON public.inventario(proveedor_id);

ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventario access for authenticated" ON public.inventario;
CREATE POLICY "Inventario access for authenticated" ON public.inventario FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: codigos_trabajo (APUs)
-- =============================================
CREATE TABLE public.codigos_trabajo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    unidad TEXT DEFAULT 'UND',
    mano_de_obra NUMERIC(15,2) DEFAULT 0,
    costo_materiales NUMERIC(15,2) DEFAULT 0,
    otros_costos NUMERIC(15,2) DEFAULT 0,
    costo_total NUMERIC(15,2) DEFAULT 0,
    precio_venta NUMERIC(15,2) DEFAULT 0,
    margen NUMERIC(5,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_codigos_trabajo_modtime
    BEFORE UPDATE ON public.codigos_trabajo
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_codigos_trabajo_codigo ON public.codigos_trabajo(codigo);

ALTER TABLE public.codigos_trabajo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Codigos trabajo access for authenticated" ON public.codigos_trabajo;
CREATE POLICY "Codigos trabajo access for authenticated" ON public.codigos_trabajo FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: materiales_asociados (materiales de APUs)
-- =============================================
CREATE TABLE public.materiales_asociados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_trabajo_id UUID REFERENCES public.codigos_trabajo(id) ON DELETE CASCADE NOT NULL,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE SET NULL,
    nombre TEXT,
    descripcion TEXT,
    unidad TEXT DEFAULT 'UND',
    cantidad NUMERIC(12,4) DEFAULT 1,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_materiales_asociados_codigo ON public.materiales_asociados(codigo_trabajo_id);
CREATE INDEX IF NOT EXISTS idx_materiales_asociados_inventario ON public.materiales_asociados(inventario_id);

ALTER TABLE public.materiales_asociados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Materiales asociados access for authenticated" ON public.materiales_asociados;
CREATE POLICY "Materiales asociados access for authenticated" ON public.materiales_asociados FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: cuentas_por_pagar
-- =============================================
CREATE TABLE public.cuentas_por_pagar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL NOT NULL,
    numero_factura TEXT,
    fecha_factura DATE,
    fecha_vencimiento DATE,
    concepto TEXT,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    valor_total NUMERIC(15,2) DEFAULT 0,
    valor_pagado NUMERIC(15,2) DEFAULT 0,
    saldo_pendiente NUMERIC(15,2) GENERATED ALWAYS AS (valor_total - valor_pagado) STORED,
    estado factura_estado DEFAULT 'PENDIENTE',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_cuentas_por_pagar_modtime
    BEFORE UPDATE ON public.cuentas_por_pagar
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_cuentas_por_pagar_proveedor ON public.cuentas_por_pagar(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_por_pagar_trabajo ON public.cuentas_por_pagar(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_por_pagar_estado ON public.cuentas_por_pagar(estado);

ALTER TABLE public.cuentas_por_pagar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cuentas por pagar access for authenticated" ON public.cuentas_por_pagar;
CREATE POLICY "Cuentas por pagar access for authenticated" ON public.cuentas_por_pagar FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLAS: DotaciÃƒÂ³n
-- =============================================
CREATE TABLE public.dotacion_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE,
    descripcion TEXT NOT NULL,
    categoria TEXT DEFAULT 'UNIFORME',
    genero TEXT DEFAULT 'UNISEX',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_dotacion_items_modtime
    BEFORE UPDATE ON public.dotacion_items
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.dotacion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dotacion items access for authenticated" ON public.dotacion_items;
CREATE POLICY "Dotacion items access for authenticated" ON public.dotacion_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE TABLE public.dotacion_variantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dotacion_id UUID REFERENCES public.dotacion_items(id) ON DELETE CASCADE NOT NULL,
    talla TEXT,
    color TEXT,
    cantidad_disponible NUMERIC(10,2) DEFAULT 0,
    cantidad_minima NUMERIC(10,2) DEFAULT 0,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_dotacion_variantes_modtime
    BEFORE UPDATE ON public.dotacion_variantes
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_dotacion_variantes_dotacion ON public.dotacion_variantes(dotacion_id);

ALTER TABLE public.dotacion_variantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dotacion variantes access for authenticated" ON public.dotacion_variantes;
CREATE POLICY "Dotacion variantes access for authenticated" ON public.dotacion_variantes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLAS: VehÃƒÂ­culos y Activos
-- =============================================
CREATE TABLE public.vehiculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    placa TEXT UNIQUE NOT NULL,
    tipo TEXT,
    marca TEXT,
    modelo TEXT,
    anno INTEGER,
    color TEXT,
    conductor_asignado TEXT,
    conductor_id UUID REFERENCES public.profiles(id),
    -- Documentos
    vencimiento_soat DATE,
    vencimiento_tecnomecanica DATE,
    vencimiento_seguro DATE,
    vencimiento_licencia_transito DATE,
    -- Estado
    kilometraje_actual NUMERIC(12,2) DEFAULT 0,
    estado TEXT DEFAULT 'ACTIVO',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_vehiculos_modtime
    BEFORE UPDATE ON public.vehiculos
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON public.vehiculos(placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_conductor ON public.vehiculos(conductor_id);

ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vehiculos access for authenticated" ON public.vehiculos;
CREATE POLICY "Vehiculos access for authenticated" ON public.vehiculos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE TABLE public.gastos_vehiculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE CASCADE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo gasto_vehiculo_tipo DEFAULT 'COMBUSTIBLE',
    descripcion TEXT,
    kilometraje NUMERIC(12,2),
    valor NUMERIC(15,2) DEFAULT 0,
    proveedor TEXT,
    numero_factura TEXT,
    responsable_id UUID REFERENCES public.profiles(id),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gastos_vehiculos_vehiculo ON public.gastos_vehiculos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_gastos_vehiculos_fecha ON public.gastos_vehiculos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_vehiculos_tipo ON public.gastos_vehiculos(tipo);

ALTER TABLE public.gastos_vehiculos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gastos vehiculos access for authenticated" ON public.gastos_vehiculos;
CREATE POLICY "Gastos vehiculos access for authenticated" ON public.gastos_vehiculos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: alertas_inventario
-- =============================================
CREATE TABLE public.alertas_inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo alerta_tipo NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id UUID,
    mensaje TEXT NOT NULL,
    umbral NUMERIC(15,2),
    valor_actual NUMERIC(15,2),
    activa BOOLEAN DEFAULT true,
    leida BOOLEAN DEFAULT false,
    fecha_generacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON public.alertas_inventario(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_activa ON public.alertas_inventario(activa);

ALTER TABLE public.alertas_inventario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alertas access for authenticated" ON public.alertas_inventario;
CREATE POLICY "Alertas access for authenticated" ON public.alertas_inventario FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- Agregar FKs a cotizacion_items
-- =============================================
ALTER TABLE public.cotizacion_items 
    ADD CONSTRAINT fk_cotizacion_items_inventario 
    FOREIGN KEY (inventario_id) REFERENCES public.inventario(id) ON DELETE SET NULL;

ALTER TABLE public.cotizacion_items 
    ADD CONSTRAINT fk_cotizacion_items_codigo_trabajo 
    FOREIGN KEY (codigo_trabajo_id) REFERENCES public.codigos_trabajo(id) ON DELETE SET NULL;



-- =============================================
-- Agregar columnas a inventario
-- =============================================
ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS precio_proveedor NUMERIC DEFAULT 0;






-- =============================================
-- TABLA: pagos_cxp (Historial de Pagos a Proveedores)
-- =============================================

CREATE TABLE IF NOT EXISTS public.pagos_cxp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cuenta_por_pagar_id UUID NOT NULL REFERENCES public.cuentas_por_pagar(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
    metodo_pago TEXT,
    cuenta_bancaria_id UUID,
    nota TEXT,
    referencia_bancaria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagos_cxp_cuenta ON public.pagos_cxp(cuenta_por_pagar_id);

-- Habilitar RLS
ALTER TABLE public.pagos_cxp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pagos CXP access for authenticated" ON public.pagos_cxp;
CREATE POLICY "Pagos CXP access for authenticated" ON public.pagos_cxp FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);



-- ================================
-- 05_financiera.sql
-- ================================
-- =============================================
-- 05_FINANCIERA - MÃƒÂ³dulo Financiero
-- =============================================

-- =============================================
-- TABLA: cuentas_bancarias
-- =============================================
CREATE TABLE public.cuentas_bancarias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo cuenta_tipo DEFAULT 'BANCO',
    banco TEXT,
    numero_cuenta TEXT,
    tipo_cuenta TEXT,
    titular TEXT,
    saldo_inicial NUMERIC(15,2) DEFAULT 0,
    saldo_actual NUMERIC(15,2) DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    principal BOOLEAN DEFAULT false,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_cuentas_bancarias_modtime
    BEFORE UPDATE ON public.cuentas_bancarias
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cuentas bancarias access for authenticated" ON public.cuentas_bancarias;
CREATE POLICY "Cuentas bancarias access for authenticated" ON public.cuentas_bancarias FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: movimientos_financieros
-- =============================================
CREATE TABLE public.movimientos_financieros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo movimiento_tipo NOT NULL,
    cuenta_id UUID REFERENCES public.cuentas_bancarias(id) ON DELETE SET NULL,
    categoria movimiento_categoria DEFAULT 'OTROS',
    tercero TEXT,
    concepto TEXT NOT NULL,
    descripcion TEXT,
    valor NUMERIC(15,2) NOT NULL,
    -- Referencias opcionales
    factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    cuenta_por_pagar_id UUID REFERENCES public.cuentas_por_pagar(id) ON DELETE SET NULL,
    -- Documento soporte
    numero_documento TEXT,
    comprobante_url TEXT,
    -- Registro
    registrado_por UUID REFERENCES public.profiles(id),
    aprobado BOOLEAN DEFAULT false,
    aprobado_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_movimientos_financieros_modtime
    BEFORE UPDATE ON public.movimientos_financieros
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON public.movimientos_financieros(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON public.movimientos_financieros(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON public.movimientos_financieros(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_categoria ON public.movimientos_financieros(categoria);
CREATE INDEX IF NOT EXISTS idx_movimientos_trabajo ON public.movimientos_financieros(trabajo_id);

ALTER TABLE public.movimientos_financieros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Movimientos access for authenticated" ON public.movimientos_financieros;
CREATE POLICY "Movimientos access for authenticated" ON public.movimientos_financieros FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: obligaciones_financieras
-- =============================================
CREATE TABLE public.obligaciones_financieras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT DEFAULT 'PRESTAMO',
    entidad TEXT NOT NULL,
    descripcion TEXT,
    monto_original NUMERIC(15,2) NOT NULL,
    tasa_interes NUMERIC(6,4) DEFAULT 0,
    plazo_meses INTEGER,
    fecha_inicio DATE,
    fecha_fin DATE,
    valor_cuota NUMERIC(15,2) DEFAULT 0,
    cuotas_pagadas INTEGER DEFAULT 0,
    saldo_capital NUMERIC(15,2),
    estado TEXT DEFAULT 'ACTIVO',
    cuenta_id UUID REFERENCES public.cuentas_bancarias(id),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_obligaciones_modtime
    BEFORE UPDATE ON public.obligaciones_financieras
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_obligaciones_estado ON public.obligaciones_financieras(estado);
CREATE INDEX IF NOT EXISTS idx_obligaciones_entidad ON public.obligaciones_financieras(entidad);

ALTER TABLE public.obligaciones_financieras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Obligaciones access for authenticated" ON public.obligaciones_financieras;
CREATE POLICY "Obligaciones access for authenticated" ON public.obligaciones_financieras FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);






-- =============================================
-- MIGRATION: Payments for Obligations
-- =============================================
CREATE TABLE public.obligaciones_pagos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    obligacion_id UUID NOT NULL REFERENCES public.obligaciones_financieras(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    valor NUMERIC(15,2) NOT NULL,
    interes NUMERIC(15,2) DEFAULT 0,
    capital NUMERIC(15,2) DEFAULT 0,
    saldo_restante NUMERIC(15,2) NOT NULL,
    nota TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pagos_obligacion ON public.obligaciones_pagos(obligacion_id);
ALTER TABLE public.obligaciones_pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pagos access for authenticated" ON public.obligaciones_pagos;
CREATE POLICY "Pagos access for authenticated" ON public.obligaciones_pagos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
-- Function to update parent balance automatically
CREATE OR REPLACE FUNCTION update_obligacion_saldo()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.obligaciones_financieras
    SET 
        saldo_capital = NEW.saldo_restante,
        cuotas_pagadas = cuotas_pagadas + 1,
        updated_at = NOW()
    WHERE id = NEW.obligacion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_saldo_obligacion
    AFTER INSERT ON public.obligaciones_pagos
    FOR EACH ROW
    EXECUTE FUNCTION update_obligacion_saldo();



    -- =================================================================
-- FIX: Re-sync Obligation Balances
-- Description: Resets 'saldo_capital' to 'monto_original' 
-- for any obligation that has zero recorded payments.
-- This fixes "Ghost Balances" from testing.
-- =================================================================
UPDATE public.obligaciones_financieras
SET 
    saldo_capital = monto_original,
    cuotas_pagadas = 0,
    updated_at = NOW()
WHERE id NOT IN (
    SELECT DISTINCT obligacion_id FROM public.obligaciones_pagos
);
-- Optional: If you want to delete ALL payments and start fresh for ALL obligations:
-- TRUNCATE TABLE public.obligaciones_pagos CASCADE;
-- UPDATE public.obligaciones_financieras SET saldo_capital = monto_original, cuotas_pagadas = 0;
-- ================================
-- 06_operaciones.sql
-- ================================
-- =============================================
-- 06_OPERACIONES - Operaciones y LogÃƒÂ­stica
-- =============================================

-- =============================================
-- TABLA: registro_obras (Registro de actividades en obras)
-- =============================================
CREATE TABLE public.registro_obras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE CASCADE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    descripcion TEXT NOT NULL,
    tipo_actividad TEXT,
    avance_porcentaje NUMERIC(5,2) DEFAULT 0 CHECK (avance_porcentaje >= 0 AND avance_porcentaje <= 100),
    horas_trabajadas NUMERIC(5,2),
    personal_cantidad INTEGER,
    -- Clima y condiciones
    clima TEXT,
    condiciones TEXT,
    opciones_pdf JSONB DEFAULT '{}'::jsonb,
    -- Materiales usados
    materiales_usados JSONB DEFAULT '[]',
    -- Incidentes
    incidentes TEXT,
    -- Registro
    responsable_id UUID REFERENCES public.profiles(id),
    fotos TEXT[],
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_registro_obras_modtime
    BEFORE UPDATE ON public.registro_obras
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_registro_obras_trabajo ON public.registro_obras(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_registro_obras_fecha ON public.registro_obras(fecha);
CREATE INDEX IF NOT EXISTS idx_registro_obras_responsable ON public.registro_obras(responsable_id);

ALTER TABLE public.registro_obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registro obras access for authenticated" ON public.registro_obras;
CREATE POLICY "Registro obras access for authenticated" ON public.registro_obras FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: movimientos_inventario
-- =============================================
CREATE TABLE public.movimientos_inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE CASCADE NOT NULL,
    tipo movimiento_inventario_tipo NOT NULL,
    cantidad NUMERIC(12,4) NOT NULL,
    cantidad_anterior NUMERIC(12,4),
    cantidad_nueva NUMERIC(12,4),
    -- Referencias
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    origen TEXT,
    destino TEXT,
    -- Documento
    numero_documento TEXT,
    -- Registro
    fecha DATE DEFAULT CURRENT_DATE,
    responsable_id UUID REFERENCES public.profiles(id),
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movimientos_inv_inventario ON public.movimientos_inventario(inventario_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inv_trabajo ON public.movimientos_inventario(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inv_fecha ON public.movimientos_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_inv_tipo ON public.movimientos_inventario(tipo);

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Movimientos inventario access for authenticated" ON public.movimientos_inventario;
CREATE POLICY "Movimientos inventario access for authenticated" ON public.movimientos_inventario FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ================================
-- 07_talento_humano.sql
-- ================================
-- =============================================
-- 07_TALENTO_HUMANO - MÃƒÂ³dulo de RRHH
-- =============================================

-- =============================================
-- TABLA: empleados
-- =============================================
CREATE TABLE public.empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE,
    nombre_completo TEXT NOT NULL,
    cedula TEXT UNIQUE,
    tipo_documento TEXT DEFAULT 'CC',
    fecha_nacimiento DATE,
    genero TEXT,
    direccion TEXT,
    ciudad TEXT,
    telefono TEXT,
    correo TEXT,
    contacto_emergencia TEXT,
    telefono_emergencia TEXT,
    -- Laboral
    cargo TEXT,
    area TEXT,
    tipo_contrato TEXT DEFAULT 'INDEFINIDO',
    fecha_ingreso DATE,
    fecha_retiro DATE,
    salario_base NUMERIC(15,2) DEFAULT 0,
    auxilio_transporte BOOLEAN DEFAULT true,
    -- Seguridad social
    eps TEXT,
    arl TEXT,
    fondo_pensiones TEXT,
    caja_compensacion TEXT,
    -- Banco
    banco TEXT,
    tipo_cuenta_banco TEXT,
    numero_cuenta_banco TEXT,
    -- Estado
    estado empleado_estado DEFAULT 'ACTIVO',
    user_id UUID REFERENCES public.profiles(id),
    foto_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_empleados_modtime
    BEFORE UPDATE ON public.empleados
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_empleados_cedula ON public.empleados(cedula);
CREATE INDEX IF NOT EXISTS idx_empleados_codigo ON public.empleados(codigo);
CREATE INDEX IF NOT EXISTS idx_empleados_estado ON public.empleados(estado);
CREATE INDEX IF NOT EXISTS idx_empleados_cargo ON public.empleados(cargo);

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empleados access for authenticated" ON public.empleados;
CREATE POLICY "Empleados access for authenticated" ON public.empleados FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: novedades_nomina
-- =============================================
CREATE TABLE public.novedades_nomina (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE NOT NULL,
    periodo TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo novedad_tipo NOT NULL,
    descripcion TEXT,
    cantidad NUMERIC(10,2) DEFAULT 0,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) DEFAULT 0,
    es_deduccion BOOLEAN DEFAULT false,
    aprobada BOOLEAN DEFAULT false,
    aprobado_por UUID REFERENCES public.profiles(id),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_novedades_modtime
    BEFORE UPDATE ON public.novedades_nomina
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_novedades_empleado ON public.novedades_nomina(empleado_id);
CREATE INDEX IF NOT EXISTS idx_novedades_periodo ON public.novedades_nomina(periodo);
CREATE INDEX IF NOT EXISTS idx_novedades_fecha ON public.novedades_nomina(fecha);
CREATE INDEX IF NOT EXISTS idx_novedades_tipo ON public.novedades_nomina(tipo);

ALTER TABLE public.novedades_nomina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Novedades access for authenticated" ON public.novedades_nomina;
CREATE POLICY "Novedades access for authenticated" ON public.novedades_nomina FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: pagos_nomina
-- =============================================
CREATE TABLE public.pagos_nomina (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE NOT NULL,
    periodo TEXT NOT NULL,
    fecha_pago DATE,
    -- Devengados
    salario_base NUMERIC(15,2) DEFAULT 0,
    auxilio_transporte NUMERIC(15,2) DEFAULT 0,
    horas_extras NUMERIC(15,2) DEFAULT 0,
    recargos NUMERIC(15,2) DEFAULT 0,
    comisiones NUMERIC(15,2) DEFAULT 0,
    bonificaciones NUMERIC(15,2) DEFAULT 0,
    otros_devengados NUMERIC(15,2) DEFAULT 0,
    total_devengado NUMERIC(15,2) DEFAULT 0,
    -- Deducciones
    salud NUMERIC(15,2) DEFAULT 0,
    pension NUMERIC(15,2) DEFAULT 0,
    fondo_solidaridad NUMERIC(15,2) DEFAULT 0,
    retencion_fuente NUMERIC(15,2) DEFAULT 0,
    prestamos NUMERIC(15,2) DEFAULT 0,
    otros_descuentos NUMERIC(15,2) DEFAULT 0,
    total_deducido NUMERIC(15,2) DEFAULT 0,
    -- Neto
    neto_pagar NUMERIC(15,2) DEFAULT 0,
    -- Estado
    estado TEXT DEFAULT 'PENDIENTE',
    pagado BOOLEAN DEFAULT false,
    fecha_real_pago DATE,
    cuenta_id UUID REFERENCES public.cuentas_bancarias(id),
    detalles JSONB DEFAULT '{}',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_pagos_nomina_modtime
    BEFORE UPDATE ON public.pagos_nomina
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_pagos_nomina_empleado ON public.pagos_nomina(empleado_id);
CREATE INDEX IF NOT EXISTS idx_pagos_nomina_periodo ON public.pagos_nomina(periodo);
CREATE INDEX IF NOT EXISTS idx_pagos_nomina_estado ON public.pagos_nomina(estado);

ALTER TABLE public.pagos_nomina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pagos nomina access for authenticated" ON public.pagos_nomina;
CREATE POLICY "Pagos nomina access for authenticated" ON public.pagos_nomina FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: liquidaciones
-- =============================================
CREATE TABLE public.liquidaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE NOT NULL,
    tipo liquidacion_tipo DEFAULT 'DEFINITIVA',
    fecha_liquidacion DATE DEFAULT CURRENT_DATE,
    fecha_inicio_periodo DATE,
    fecha_fin_periodo DATE,
    -- Valores
    dias_trabajados INTEGER DEFAULT 0,
    salario_promedio NUMERIC(15,2) DEFAULT 0,
    cesantias NUMERIC(15,2) DEFAULT 0,
    intereses_cesantias NUMERIC(15,2) DEFAULT 0,
    prima NUMERIC(15,2) DEFAULT 0,
    vacaciones NUMERIC(15,2) DEFAULT 0,
    indemnizacion NUMERIC(15,2) DEFAULT 0,
    otros_conceptos NUMERIC(15,2) DEFAULT 0,
    total_liquidacion NUMERIC(15,2) DEFAULT 0,
    -- Deducciones
    deducciones NUMERIC(15,2) DEFAULT 0,
    neto_pagar NUMERIC(15,2) DEFAULT 0,
    -- Estado
    estado TEXT DEFAULT 'PENDIENTE',
    pagada BOOLEAN DEFAULT false,
    fecha_pago DATE,
    detalles JSONB DEFAULT '{}',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_liquidaciones_modtime
    BEFORE UPDATE ON public.liquidaciones
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_liquidaciones_empleado ON public.liquidaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_tipo ON public.liquidaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_estado ON public.liquidaciones(estado);

ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Liquidaciones access for authenticated" ON public.liquidaciones;
CREATE POLICY "Liquidaciones access for authenticated" ON public.liquidaciones FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: creditos_empleados
-- =============================================
CREATE TABLE public.creditos_empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT DEFAULT 'PRESTAMO',
    concepto TEXT,
    monto_solicitado NUMERIC(15,2) NOT NULL,
    monto_aprobado NUMERIC(15,2),
    plazo_meses INTEGER,
    cuota_mensual NUMERIC(15,2) DEFAULT 0,
    cuotas_pagadas INTEGER DEFAULT 0,
    saldo_pendiente NUMERIC(15,2),
    fecha_solicitud DATE DEFAULT CURRENT_DATE,
    fecha_aprobacion DATE,
    fecha_inicio_descuento DATE,
    estado TEXT DEFAULT 'PENDIENTE',
    aprobado_por UUID REFERENCES public.profiles(id),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_creditos_empleados_modtime
    BEFORE UPDATE ON public.creditos_empleados
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_creditos_empleados_empleado ON public.creditos_empleados(empleado_id);
CREATE INDEX IF NOT EXISTS idx_creditos_empleados_estado ON public.creditos_empleados(estado);

ALTER TABLE public.creditos_empleados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creditos empleados access for authenticated" ON public.creditos_empleados;
CREATE POLICY "Creditos empleados access for authenticated" ON public.creditos_empleados FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: entregas_dotacion (movida aquÃƒÂ­ por FK a empleados)
-- =============================================
CREATE TABLE public.entregas_dotacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID REFERENCES public.empleados(id) ON DELETE CASCADE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    estado entrega_estado DEFAULT 'PENDIENTE',
    fecha_entrega DATE,
    fecha_aceptacion DATE,
    entregado_por UUID REFERENCES public.profiles(id),
    observaciones TEXT,
    firma_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_entregas_dotacion_modtime
    BEFORE UPDATE ON public.entregas_dotacion
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX IF NOT EXISTS idx_entregas_dotacion_empleado ON public.entregas_dotacion(empleado_id);
CREATE INDEX IF NOT EXISTS idx_entregas_dotacion_fecha ON public.entregas_dotacion(fecha);
CREATE INDEX IF NOT EXISTS idx_entregas_dotacion_estado ON public.entregas_dotacion(estado);

ALTER TABLE public.entregas_dotacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entregas dotacion access for authenticated" ON public.entregas_dotacion;
CREATE POLICY "Entregas dotacion access for authenticated" ON public.entregas_dotacion FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE TABLE public.entrega_dotacion_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entrega_id UUID REFERENCES public.entregas_dotacion(id) ON DELETE CASCADE NOT NULL,
    dotacion_id UUID REFERENCES public.dotacion_items(id) ON DELETE SET NULL,
    variante_id UUID REFERENCES public.dotacion_variantes(id) ON DELETE SET NULL,
    cantidad INTEGER DEFAULT 1,
    talla TEXT,
    color TEXT,
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entrega_items_entrega ON public.entrega_dotacion_items(entrega_id);

ALTER TABLE public.entrega_dotacion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entrega items access for authenticated" ON public.entrega_dotacion_items;
CREATE POLICY "Entrega items access for authenticated" ON public.entrega_dotacion_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);






-- FIX: Add 'estado' column to match Frontend Logic
-- Also ensure 'observaciones' is used correctly.

DO $$
BEGIN
    -- 1. Add 'estado' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'novedades_nomina' AND column_name = 'estado') THEN
        ALTER TABLE "novedades_nomina" ADD COLUMN "estado" TEXT DEFAULT 'PENDIENTE';
        
        -- Migrate data: aprobada = true -> APROBADA
        UPDATE "novedades_nomina" SET "estado" = 'APROBADA' WHERE "aprobada" = TRUE;
        UPDATE "novedades_nomina" SET "estado" = 'PENDIENTE' WHERE "aprobada" = FALSE OR "aprobada" IS NULL;
    END IF;
END $$;

-- 2. Notify to refresh cache
NOTIFY pgrst, 'reload config';





-- ================================
-- 001_create_historial_table.sql
-- ================================
-- Create table for Cotizacion History
create table if not exists cotizacion_historial (
  id uuid default gen_random_uuid() primary key,
  cotizacion_id uuid references cotizaciones(id) on delete cascade not null,
  fecha timestamptz default now() not null,
  usuario_id text, -- Can be linked to auth.users or just a string if using custom users
  usuario_nombre text,
  tipo text not null, -- CREACION, ESTADO, PROGRESO, EDICION, NOTA, ITEM_*, etc.
  descripcion text,
  valor_anterior text,
  valor_nuevo text,
  metadata jsonb default '{}'::jsonb, -- Store extra data like location {lat, lng}, or photo URLs
  created_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists idx_cotizacion_historial_cotizacion_id on cotizacion_historial(cotizacion_id);
create index if not exists idx_cotizacion_historial_fecha on cotizacion_historial(fecha desc);

-- Enable RLS
alter table cotizacion_historial enable row level security;

-- Policies (Adjust based on your project's auth needs, allowing all for authenticated for now)
DROP POLICY IF EXISTS "Authenticated users can select history" ON cotizacion_historial;
CREATE POLICY "Authenticated users can select history" ON cotizacion_historial for select
to authenticated
using (true);

DROP POLICY IF EXISTS "Authenticated users can insert history" ON cotizacion_historial;
CREATE POLICY "Authenticated users can insert history" ON cotizacion_historial for insert
to authenticated
with check (true);

-- ================================
-- 002_add_missing_columns.sql
-- ================================
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

-- ================================
-- 003_update_enum_values.sql
-- ================================
-- Migration to update the cotizacion_estado enum
-- The error "invalid input value for enum cotizacion_estado: EN_REVISION" indicates the DB enum is missing values.

-- NOTE: PostgreSQL does not support "ALTER TYPE ... ADD VALUE IF NOT EXISTS" in a single transaction block easily in some versions/clients.
-- The safest way is to alter it one by one outside of a transaction, or check first.
-- However, for Supabase SQL Editor, running these lines is usually safe.

-- Try adding EN_REVISION
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'EN_REVISION';

-- Add other potentially missing values based on types/sistema.ts
-- 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'PENDIENTE' | 'NO_APROBADA' | 'EN_EJECUCION' | 'FINALIZADA'

ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'PENDIENTE';
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'NO_APROBADA';
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'EN_EJECUCION';
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'FINALIZADA';

-- ================================
-- 004_add_empleado_files.sql
-- ================================
-- Add 'archivos' column to 'empleados' table to store file references
ALTER TABLE public.empleados
ADD COLUMN IF NOT EXISTS archivos JSONB DEFAULT '[]'::JSONB;

-- Comment on column
COMMENT ON COLUMN public.empleados.archivos IS 'List of files uploaded for the employee (Contract, CV, etc). Stored as JSON array of objects: { name, url, date, type }';

-- ================================
-- 004_add_modificacion_enum.sql
-- ================================
-- Add MODIFICACION to the cotizacion_estado enum
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'MODIFICACION';

-- ================================
-- 06_fix_bank_rpc.sql
-- ================================
-- RPC to update bank account balance
CREATE OR REPLACE FUNCTION public.update_cuenta_saldo(cuenta_uuid UUID, delta_valor NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.cuentas_bancarias
    SET 
        saldo_actual = saldo_actual + delta_valor,
        updated_at = NOW()
    WHERE id = cuenta_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 08_fix_rls.sql
-- ================================
-- Fix infinite recursion by using a security definer function for role checks

-- 1. Create helper function to get role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  _role text;
BEGIN
  -- Access profiles directly bypassing RLS due to SECURITY DEFINER
  SELECT role::text INTO _role
  FROM public.profiles
  WHERE id = (select auth.uid());
  
  RETURN _role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Profiles Policy to avoid self-recursion
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );

-- 3. Update Agenda Policies to be more efficient and safe
DROP POLICY IF EXISTS "Users see own tasks or if admin" ON public.agenda;
DROP POLICY IF EXISTS "Users see own tasks or if admin" ON public.agenda;
CREATE POLICY "Users see own tasks or if admin" ON public.agenda FOR SELECT
    TO authenticated
    USING (
        asignado_a = (select auth.uid()) 
        OR creado_por = (select auth.uid())
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

DROP POLICY IF EXISTS "Users can update own tasks" ON public.agenda;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.agenda;
CREATE POLICY "Users can update own tasks" ON public.agenda FOR UPDATE
    TO authenticated
    USING (
        asignado_a = (select auth.uid()) 
        OR creado_por = (select auth.uid())
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

DROP POLICY IF EXISTS "Admin can delete tasks" ON public.agenda;
DROP POLICY IF EXISTS "Admin can delete tasks" ON public.agenda;
CREATE POLICY "Admin can delete tasks" ON public.agenda FOR DELETE
    TO authenticated
    USING (
        creado_por = (select auth.uid())
        OR get_current_user_role() = 'ADMIN'
    );
     
-- 4. Update Roles Policy
DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;
CREATE POLICY "Only admin can manage roles" ON public.roles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );

-- ================================
-- 09_logistica_compras.sql
-- ================================
-- =============================================
-- 09_LOGISTICA_COMPRAS - Ãƒâ€œrdenes de Compra
-- =============================================

-- 1. ENUM para estados de orden de compra
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_orden_compra') THEN
        CREATE TYPE public.estado_orden_compra AS ENUM ('PENDIENTE', 'ENVIADA', 'PARCIAL', 'RECIBIDA', 'CANCELADA');
    END IF;
END $$;

-- 2. TABLA: ordenes_compra
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL NOT NULL,
    fecha_emision TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    fecha_entrega_estimada DATE,
    subtotal NUMERIC(15,2) DEFAULT 0,
    impuestos NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    estado estado_orden_compra DEFAULT 'PENDIENTE',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger para updated_at
CREATE TRIGGER update_ordenes_compra_modtime
    BEFORE UPDATE ON public.ordenes_compra
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ÃƒÂndices
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON public.ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON public.ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_numero ON public.ordenes_compra(numero);

-- RLS
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ordenes compra access for authenticated" ON public.ordenes_compra;
CREATE POLICY "Ordenes compra access for authenticated" ON public.ordenes_compra FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. TABLA: detalle_compra
CREATE TABLE IF NOT EXISTS public.detalle_compra (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orden_compra_id UUID REFERENCES public.ordenes_compra(id) ON DELETE CASCADE NOT NULL,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(12,4) DEFAULT 1,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) DEFAULT 0,
    recibido NUMERIC(12,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ÃƒÂndices
CREATE INDEX IF NOT EXISTS idx_detalle_compra_orden ON public.detalle_compra(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_detalle_compra_inventario ON public.detalle_compra(inventario_id);

-- RLS
ALTER TABLE public.detalle_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Detalle compra access for authenticated" ON public.detalle_compra;
CREATE POLICY "Detalle compra access for authenticated" ON public.detalle_compra FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ================================
-- 10_fix_recursion_final.sql
-- ================================
-- =============================================
-- 10_FIX_RECURSION_FINAL.SQL
-- Fixes infinite recursion by using SECURITY DEFINER and CASCADE drop
-- =============================================

-- 1. DROP FUNCTION WITH CASCADE
-- This is necessary because some policies (on agenda/roles) depend on this function.
-- CASCADE will automatically remove those dependent policies so we can recreate them clean.
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- 2. RECREATE THE HELPER FUNCTION
-- SECURITY DEFINER: Runs with permissions of the creator (usually postgres/admin), bypassing RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  -- Direct query to profiles. Since this is SECURITY DEFINER, 
  -- it bypasses the RLS on profiles table that calls this function.
  SELECT role::text INTO _role
  FROM public.profiles
  WHERE id = (select auth.uid());
  
  -- Return 'VIEWER' if no role found (safety default)
  RETURN COALESCE(_role, 'VIEWER');
END;
$$;

-- 3. RECREATE/UPDATE POLICIES

-- We must manually cleanup any potential remaining policies that CASCADE didn't catch 
-- (mostly just to be sure we don't have duplicates if names differed),
-- then we recreate everything consistently.

-- ==========================
-- A) PROFILES POLICIES
-- ==========================
-- Drop old variations just in case
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile" ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = (select auth.uid())
        OR get_current_user_role() = 'ADMIN'
    );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        id = (select auth.uid())
    );

DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );


-- ==========================
-- B) ROLES POLICIES
-- ==========================
-- Need to drop if they weren't dropped by CASCADE (unlikely if they depended on the function, but good hygiene)
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;

DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
CREATE POLICY "Roles viewable by authenticated" ON public.roles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;
CREATE POLICY "Only admin can manage roles" ON public.roles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );


-- ==========================
-- C) AGENDA POLICIES
-- ==========================
-- Similarly, drop ensuring clean slate before create
DROP POLICY IF EXISTS "Users see own tasks or if admin" ON public.agenda;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.agenda;
DROP POLICY IF EXISTS "Admin can delete tasks" ON public.agenda;
DROP POLICY IF EXISTS "Authenticated can create tasks" ON public.agenda;

DROP POLICY IF EXISTS "Users see own tasks or if admin" ON public.agenda;
CREATE POLICY "Users see own tasks or if admin" ON public.agenda FOR SELECT
    TO authenticated
    USING (
        asignado_a = (select auth.uid()) 
        OR creado_por = (select auth.uid())
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

DROP POLICY IF EXISTS "Users can update own tasks" ON public.agenda;
CREATE POLICY "Users can update own tasks" ON public.agenda FOR UPDATE
    TO authenticated
    USING (
        asignado_a = (select auth.uid()) 
        OR creado_por = (select auth.uid())
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

DROP POLICY IF EXISTS "Admin can delete tasks" ON public.agenda;
CREATE POLICY "Admin can delete tasks" ON public.agenda FOR DELETE
    TO authenticated
    USING (
        creado_por = (select auth.uid())
        OR get_current_user_role() = 'ADMIN'
    );

DROP POLICY IF EXISTS "Authenticated can create tasks" ON public.agenda;
CREATE POLICY "Authenticated can create tasks" ON public.agenda FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ================================
-- 11_fix_roles_policy.sql
-- ================================
-- =============================================
-- 11_FIX_ROLES_POLICY.SQL
-- Fixes RLS violation on 'roles' table by ensuring policy uses secure function
-- and attempts to upgrade current user to ADMIN if possible.
-- =============================================

-- 1. Attempt to Ensure Current User is ADMIN (for Development)
-- This works if run in SQL Editor where (select auth.uid()) is the current user.
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
BEGIN
    current_user_id := (select auth.uid());
    
    IF current_user_id IS NOT NULL THEN
        -- Try to get email if possible, otherwise use placeholder
        BEGIN
            SELECT email FROM auth.users WHERE id = current_user_id INTO user_email;
        EXCEPTION WHEN OTHERS THEN
            user_email := 'admin@example.com';
        END;

        -- Upsert profile as ADMIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            current_user_id, 
            COALESCE(user_email, 'admin@example.com'), 
            'System Admin', 
            'ADMIN'
        )
        ON CONFLICT (id) DO UPDATE
        SET role = 'ADMIN';
    END IF;
END $$;

-- 2. Fix Roles RLS Policy
-- Ensure it uses the new safe function defined in migration 10

DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;

DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;
CREATE POLICY "Only admin can manage roles" ON public.roles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );

-- Ensure View policy exists
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
CREATE POLICY "Roles viewable by authenticated" ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- ================================
-- 11_support_nested_apus.sql
-- ================================
-- =============================================
-- MIGRATION: 11_support_nested_apus
-- =============================================
-- Authorization: Support recursive APUs (APUs within APUs)

-- 1. Add sub_codigo_id to materiales_asociados
-- This column references codigos_trabajo(id) and is mutually exclusive (conceptually) with inventario_id,
-- or can be used alongside it depending on logic, but typically an item is either a raw material or a sub-assembly.
ALTER TABLE public.materiales_asociados
ADD COLUMN sub_codigo_id UUID REFERENCES public.codigos_trabajo(id) ON DELETE SET NULL;

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_materiales_asociados_sub_codigo ON public.materiales_asociados(sub_codigo_id);

-- 3. Relax constraint if any (currently there isn't a strict check, but good to note)
-- We should ensure that EITHER inventario_id OR sub_codigo_id is present, but not both NULL.
-- For now, we leave it flexible to avoid breaking existing queries, but UI should enforce it.

-- ================================
-- 12_plans_module.sql
-- ================================
-- ============================================
-- DMRE-PLANS Module - Database Schema
-- ============================================

-- Drop existing if needed
DROP TABLE IF EXISTS proyectos_planos CASCADE;

-- ============================================
-- PROYECTOS PLANOS TABLE
-- ============================================

CREATE TABLE proyectos_planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client VARCHAR(255),
    scale VARCHAR(20) DEFAULT '1:100',
    canvas_state JSONB, -- Fabric.js canvas JSON
    thumbnail_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_proyectos_planos_created_by ON proyectos_planos(created_by);
CREATE INDEX IF NOT EXISTS idx_proyectos_planos_created_at ON proyectos_planos(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_proyectos_planos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proyectos_planos_updated_at
    BEFORE UPDATE ON proyectos_planos
    FOR EACH ROW
    EXECUTE FUNCTION update_proyectos_planos_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE proyectos_planos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all projects (for collaboration)
DROP POLICY IF EXISTS "Everyone can view projects" ON proyectos_planos;
CREATE POLICY "Everyone can view projects" ON proyectos_planos FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert
DROP POLICY IF EXISTS "Authenticated users can create projects" ON proyectos_planos;
CREATE POLICY "Authenticated users can create projects" ON proyectos_planos FOR INSERT
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Policy: Users can update their own projects
DROP POLICY IF EXISTS "Users can update own projects" ON proyectos_planos;
CREATE POLICY "Users can update own projects" ON proyectos_planos FOR UPDATE
    USING (created_by = (select auth.uid()) OR created_by IS NULL);

-- Policy: Users can delete their own projects
DROP POLICY IF EXISTS "Users can delete own projects" ON proyectos_planos;
CREATE POLICY "Users can delete own projects" ON proyectos_planos FOR DELETE
    USING (created_by = (select auth.uid()) OR created_by IS NULL);

-- ============================================
-- STORAGE BUCKET POLICY (for Planos bucket)
-- ============================================

-- Note: Run these in Supabase dashboard or via API
-- The bucket "Planos" should already exist

-- Policy: Authenticated users can upload
-- INSERT policy on storage.objects WHERE bucket_id = 'Planos' AND (select auth.uid()) IS NOT NULL

-- Policy: Public read access for thumbnails
-- SELECT policy on storage.objects WHERE bucket_id = 'Planos'

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to get projects with user info
CREATE OR REPLACE FUNCTION get_proyectos_planos_with_user()
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    client VARCHAR(255),
    scale VARCHAR(20),
    thumbnail_url TEXT,
    created_by UUID,
    created_by_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.client,
        p.scale,
        p.thumbnail_url,
        p.created_by,
        COALESCE(pr.full_name, 'Usuario') as created_by_name,
        p.created_at,
        p.updated_at
    FROM proyectos_planos p
    LEFT JOIN profiles pr ON p.created_by = pr.id
    ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON proyectos_planos TO authenticated;
GRANT SELECT ON proyectos_planos TO anon;
GRANT EXECUTE ON FUNCTION get_proyectos_planos_with_user() TO authenticated;

-- ================================
-- 13_documentos_storage_policies.sql
-- ================================
-- Migration: Add RLS policies for Documentost_rabajos bucket
-- This enables uploads, reads, updates, and deletes for the document storage bucket

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('Documentost_rabajos', 'Documentost_rabajos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Allow public read Documentost_rabajos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert Documentost_rabajos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update Documentost_rabajos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete Documentost_rabajos" ON storage.objects;

-- SELECT: Allow public read access
DROP POLICY IF EXISTS "Allow public read Documentost_rabajos" ON storage.objects;
CREATE POLICY "Allow public read Documentost_rabajos" ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Documentost_rabajos');

-- INSERT: Allow authenticated users to upload
DROP POLICY IF EXISTS "Allow authenticated insert Documentost_rabajos" ON storage.objects;
CREATE POLICY "Allow authenticated insert Documentost_rabajos" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Documentost_rabajos');

-- UPDATE: Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated update Documentost_rabajos" ON storage.objects;
CREATE POLICY "Allow authenticated update Documentost_rabajos" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Documentost_rabajos');

-- DELETE: Allow authenticated users to delete
DROP POLICY IF EXISTS "Allow authenticated delete Documentost_rabajos" ON storage.objects;
CREATE POLICY "Allow authenticated delete Documentost_rabajos" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Documentost_rabajos');

-- ================================
-- 14_consumo_material.sql
-- ================================
-- =============================================
-- 14_CONSUMO_MATERIAL - Historial de consumo de materiales por proyecto
-- =============================================

-- Drop table if it exists (for re-runs)
DROP TABLE IF EXISTS public.consumo_material;

CREATE TABLE public.consumo_material (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE CASCADE,
    descripcion_material TEXT,  -- Name of material (for items without inventory link)
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
    cantidad NUMERIC(12,4) NOT NULL CHECK (cantidad > 0),
    unidad TEXT DEFAULT 'UND',
    descripcion TEXT,
    registrado_por UUID REFERENCES public.profiles(id),
    fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consumo_material_inventario ON public.consumo_material(inventario_id);
CREATE INDEX IF NOT EXISTS idx_consumo_material_cotizacion ON public.consumo_material(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_consumo_material_fecha ON public.consumo_material(fecha);

-- Disable RLS for simplicity (matches other tables pattern)
ALTER TABLE public.consumo_material ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consumo material full access for authenticated" ON public.consumo_material;
CREATE POLICY "Consumo material full access for authenticated" ON public.consumo_material FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ================================
-- 15_fix_quotation_sync.sql
-- ================================
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

-- ================================
-- 16_add_elaborado_por_column.sql
-- ================================
-- Migration to add elaborado_por column to cotizaciones table
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS elaborado_por TEXT;

COMMENT ON COLUMN public.cotizaciones.elaborado_por IS 'Stored name of the user who prepared/created the quotation.';

-- ================================
-- 20240220_plan_versions.sql
-- ================================
-- ============================================
-- Plan Versions Table
-- Stores snapshots of plan designs for restoration
-- ============================================

CREATE TABLE IF NOT EXISTS public.plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.proyectos_planos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    canvas_state JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view versions of their projects" ON public.plan_versions;
CREATE POLICY "Users can view versions of their projects" ON public.plan_versions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );

DROP POLICY IF EXISTS "Users can create versions of their projects" ON public.plan_versions;
CREATE POLICY "Users can create versions of their projects" ON public.plan_versions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );

DROP POLICY IF EXISTS "Users can delete versions of their projects" ON public.plan_versions;
CREATE POLICY "Users can delete versions of their projects" ON public.plan_versions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );

-- ================================
-- 20240721000000_create_projects_table.sql
-- ================================
-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Create policies for projects
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public projects are viewable by everyone" ON public.projects for select
  using ( true );

DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
CREATE POLICY "Authenticated users can insert projects" ON public.projects for insert
  with check ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
CREATE POLICY "Authenticated users can update projects" ON public.projects for update
  using ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;
CREATE POLICY "Authenticated users can delete projects" ON public.projects for delete
  using ( auth.role() = 'authenticated' );

-- Create storage bucket for projects if it doesn't exist
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do nothing;

-- Storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects for select
  using ( bucket_id = 'projects' );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects for insert
  with check ( bucket_id = 'projects' and auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update" ON storage.objects for update
  with check ( bucket_id = 'projects' and auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete" ON storage.objects for delete
  using ( bucket_id = 'projects' and auth.role() = 'authenticated' );

-- ================================
-- 20240721000001_create_contact_requests_table.sql
-- ================================
-- Create contact_requests table
create table if not exists public.contact_requests (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text default 'PENDIENTE', -- PENDIENTE, CONTACTADO, CERRADO
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contact_requests enable row level security;

-- Create policies for contact_requests
DROP POLICY IF EXISTS "Public can insert contact requests" ON public.contact_requests;
CREATE POLICY "Public can insert contact requests" ON public.contact_requests for insert
  with check ( true );

DROP POLICY IF EXISTS "Authenticated users can view contact requests" ON public.contact_requests;
CREATE POLICY "Authenticated users can view contact requests" ON public.contact_requests for select
  using ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can update contact requests" ON public.contact_requests;
CREATE POLICY "Authenticated users can update contact requests" ON public.contact_requests for update
  using ( auth.role() = 'authenticated' );

-- ================================
-- 20240721000002_create_profiles_table.sql
-- ================================
-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('ADMIN', 'ENGINEER', 'CLIENT', 'VIEWER')) default 'VIEWER',
  sidebar_access text[], -- Array of allowed module IDs
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles for select
  using ( true );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles for update
  using ( (select auth.uid()) = id );

-- Allow admins to manage all profiles (this depends on the admin checking their own role, 
-- which can be recursive, so often we use a function or a simpler check if possible. 
-- For now, we'll keep it simple: authenticated users can read.
-- We will implement admin-only writes via Service Role in server actions to avoid complex RLS recursion initially.)

-- Trigger to create profile on signup (optional, but good for self-signup. 
-- For admin-created users, we can insert manually.)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, sidebar_access)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'VIEWER', ARRAY['dashboard']);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger is useful if we allow public signups. 
-- Since this is an internal system, we might strictly control creation via Admin.
-- However, enabling it doesn't hurt for safety.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================
-- 20240721000003_fix_profiles_schema.sql
-- ================================
-- Fix for missing sidebar_access column
alter table if exists public.profiles 
add column if not exists sidebar_access text[] default ARRAY['dashboard'];

-- Ensure the column is an array of text
alter table public.profiles 
alter column sidebar_access set data type text[] using sidebar_access::text[];

-- ================================
-- add_item_porcentaje_column.sql
-- ================================
-- Migration to add porcentaje column to cotizacion_items table
ALTER TABLE public.cotizacion_items
ADD COLUMN IF NOT EXISTS porcentaje NUMERIC DEFAULT 0;

-- Comments for clarity
COMMENT ON COLUMN public.cotizacion_items.porcentaje IS 'Percentage increase applied to the unit price for this item.';

-- ================================
-- add_quote_text_fields.sql
-- ================================
-- Migration to add missing text columns to cotizaciones table
ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS alcance TEXT,
ADD COLUMN IF NOT EXISTS forma_pago TEXT,
ADD COLUMN IF NOT EXISTS nota_final TEXT;

-- Comments for clarity
COMMENT ON COLUMN public.cotizaciones.alcance IS 'Scope of work for the quotation.';
COMMENT ON COLUMN public.cotizaciones.forma_pago IS 'Payment terms/conditions.';
COMMENT ON COLUMN public.cotizaciones.nota_final IS 'Additional notes or terms displayed at the end of the quotation.';

-- ================================
-- debug_fix_schema.sql
-- ================================
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

-- ================================
-- instalaciones_create_table.sql
-- ================================
-- =========================================================================
-- SCRIPT DE CREACION: INSTALACIONES
-- DescripciÃƒÂ³n: Script para generar la tabla de instalaciones y sus polÃƒÂ­ticas
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.instalaciones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    codigo text NOT NULL,
    descripcion text NOT NULL,
    valor_calculado numeric(15,2) NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    creado_por uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT instalaciones_pkey PRIMARY KEY (id),
    CONSTRAINT instalaciones_codigo_key UNIQUE (codigo)
);

-- Habilitar RLS
ALTER TABLE public.instalaciones ENABLE ROW LEVEL SECURITY;

-- PolÃƒÂ­ticas de lectura
DROP POLICY IF EXISTS "Lectura permitida" ON public.instalaciones;
CREATE POLICY "Lectura permitida" ON public.instalaciones FOR SELECT 
    USING (true);

-- PolÃƒÂ­ticas de inserciÃƒÂ³n
DROP POLICY IF EXISTS "InserciÃƒÂ³n permitida" ON public.instalaciones;
CREATE POLICY "InserciÃƒÂ³n permitida" ON public.instalaciones FOR INSERT 
    WITH CHECK (true);

-- PolÃƒÂ­ticas de actualizaciÃƒÂ³n
DROP POLICY IF EXISTS "ActualizaciÃƒÂ³n permitida" ON public.instalaciones;
CREATE POLICY "ActualizaciÃƒÂ³n permitida" ON public.instalaciones FOR UPDATE 
    USING (true);

-- PolÃƒÂ­ticas de eliminaciÃƒÂ³n
DROP POLICY IF EXISTS "EliminaciÃƒÂ³n permitida" ON public.instalaciones;
CREATE POLICY "EliminaciÃƒÂ³n permitida" ON public.instalaciones FOR DELETE 
    USING (true);

-- Trigger para updated_at (requiere funciÃƒÂ³n set_updated_at si no existe)
-- CREATE OR REPLACE FUNCTION public.set_updated_at()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- AS $function$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $function$;

-- CREATE TRIGGER set_public_instalaciones_updated_at 
--     BEFORE UPDATE ON public.instalaciones 
--     FOR EACH ROW 
--     EXECUTE FUNCTION public.set_updated_at();

-- ================================
-- setup_servicios.sql
-- ================================
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
DROP POLICY IF EXISTS "Allow authenticated users to read servicios" ON public.servicios_logistica;
CREATE POLICY "Allow authenticated users to read servicios" ON public.servicios_logistica 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow all authenticated users to insert
DROP POLICY IF EXISTS "Allow authenticated users to insert servicios" ON public.servicios_logistica;
CREATE POLICY "Allow authenticated users to insert servicios" ON public.servicios_logistica 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy to allow all authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated users to update servicios" ON public.servicios_logistica;
CREATE POLICY "Allow authenticated users to update servicios" ON public.servicios_logistica 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policy to allow all authenticated users to delete
DROP POLICY IF EXISTS "Allow authenticated users to delete servicios" ON public.servicios_logistica;
CREATE POLICY "Allow authenticated users to delete servicios" ON public.servicios_logistica 
FOR DELETE 
TO authenticated 
USING (true);

-- ================================
-- setup_storage.sql
-- ================================
-- run this in your supabase sql editor to create the required storage bucket
insert into storage.buckets (id, name, public)
values ('cotizaciones_docs', 'cotizaciones_docs', false)
on conflict (id) do nothing;

DROP POLICY IF EXISTS "Allow authenticated admins to upload" ON storage.objects;
CREATE POLICY "Allow authenticated admins to upload" ON storage.objects for insert
to authenticated
with check ( bucket_id = 'cotizaciones_docs' );

DROP POLICY IF EXISTS "Allow authenticated admins to delete" ON storage.objects;
CREATE POLICY "Allow authenticated admins to delete" ON storage.objects for delete
to authenticated
using ( bucket_id = 'cotizaciones_docs' );

-- Since clients are not authenticated via standard Supabase Auth in the portal,
-- the server uses the Service Role Key to manage these files.
-- Thus, the Service Role key bypasses RLS and handles all uploads/downloads/deletes internally.
-- No public policies are needed, maximizing security as requested.


-- =============================================
-- RESOLVE CIRCULAR DEPENDENCY: pagos_cxp -> cuentas_bancarias
-- =============================================
ALTER TABLE public.pagos_cxp
ADD CONSTRAINT fk_pagos_cxp_cuenta_bancaria
FOREIGN KEY (cuenta_bancaria_id) REFERENCES public.cuentas_bancarias(id) ON DELETE SET NULL;




