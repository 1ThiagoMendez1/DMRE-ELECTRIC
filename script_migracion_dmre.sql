-- ==============================================================
-- MASTER MIGRATION SCRIPT (COMPLETE VERSION - V6)
-- Includes: Extensions, Enums, Security Functions, Tables, EXACT RLS Policies, Buckets
-- ==============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN CREATE TYPE public.user_role AS ENUM ('ADMIN', 'MANAGER', 'ENGINEER', 'OPERATOR', 'VIEWER'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tarea_prioridad') THEN CREATE TYPE public.tarea_prioridad AS ENUM ('ALTA', 'MEDIA', 'BAJA'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tarea_estado') THEN CREATE TYPE public.tarea_estado AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trabajo_estado') THEN CREATE TYPE public.trabajo_estado AS ENUM ('COTIZADO', 'APROBADO', 'EN_EJECUCION', 'PAUSADO', 'FINALIZADO', 'CANCELADO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cotizacion_estado') THEN CREATE TYPE public.cotizacion_estado AS ENUM ('BORRADOR', 'PENDIENTE', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'EN_EJECUCION', 'FINALIZADA'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cotizacion_tipo') THEN CREATE TYPE public.cotizacion_tipo AS ENUM ('NORMAL', 'SIMPLIFICADA'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'factura_estado') THEN CREATE TYPE public.factura_estado AS ENUM ('BORRADOR', 'PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cuenta_tipo') THEN CREATE TYPE public.cuenta_tipo AS ENUM ('BANCO', 'EFECTIVO', 'CREDITO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movimiento_tipo') THEN CREATE TYPE public.movimiento_tipo AS ENUM ('INGRESO', 'EGRESO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movimiento_categoria') THEN CREATE TYPE public.movimiento_categoria AS ENUM ('NOMINA', 'PROVEEDORES', 'SERVICIOS', 'IMPUESTOS', 'VENTAS', 'ANTICIPOS', 'OTROS'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventario_categoria') THEN CREATE TYPE public.inventario_categoria AS ENUM ('MATERIAL', 'HERRAMIENTA', 'DOTACION', 'EPP', 'EQUIPO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventario_ubicacion') THEN CREATE TYPE public.inventario_ubicacion AS ENUM ('BODEGA', 'OBRA', 'TRANSITO', 'BAJA'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proveedor_categoria') THEN CREATE TYPE public.proveedor_categoria AS ENUM ('MATERIALES', 'SERVICIOS', 'MIXTO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gasto_vehiculo_tipo') THEN CREATE TYPE public.gasto_vehiculo_tipo AS ENUM ('COMBUSTIBLE', 'PEAJE', 'MANTENIMIENTO', 'PARQUEADERO', 'LAVADO', 'SEGURO', 'OTROS'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alerta_tipo') THEN CREATE TYPE public.alerta_tipo AS ENUM ('STOCK_BAJO', 'VENCIMIENTO_DOCUMENTO', 'PAGO_PENDIENTE', 'OTRO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movimiento_inventario_tipo') THEN CREATE TYPE public.movimiento_inventario_tipo AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRASLADO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entrega_estado') THEN CREATE TYPE public.entrega_estado AS ENUM ('PENDIENTE', 'ENTREGADO', 'RECHAZADO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'empleado_estado') THEN CREATE TYPE public.empleado_estado AS ENUM ('ACTIVO', 'INACTIVO', 'LICENCIA', 'VACACIONES', 'RETIRADO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'novedad_tipo') THEN CREATE TYPE public.novedad_tipo AS ENUM ('HORA_EXTRA_DIURNA', 'HORA_EXTRA_NOCTURNA', 'HORA_EXTRA_FESTIVA', 'RECARGO_NOCTURNO', 'DOMINICAL', 'PRESTAMO', 'DESCUENTO', 'AUXILIO', 'AUSENCIA', 'INCAPACIDAD', 'LICENCIA', 'OTRO'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'liquidacion_tipo') THEN CREATE TYPE public.liquidacion_tipo AS ENUM ('DEFINITIVA', 'PARCIAL', 'VACACIONES'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_orden_compra') THEN CREATE TYPE public.estado_orden_compra AS ENUM ('PENDIENTE', 'ENVIADA', 'PARCIAL', 'RECIBIDA', 'CANCELADA'); END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  SELECT role::text INTO _role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(_role, 'VIEWER');
END;
$$;

-- 4. TABLES (All 40 tables)
CREATE TABLE IF NOT EXISTS public.profiles ( id uuid NOT NULL PRIMARY KEY, email text, full_name text, role public.user_role DEFAULT 'ADMIN'::public.user_role, avatar_url text, phone text, settings jsonb DEFAULT '{}'::jsonb, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now(), sidebar_access text[] DEFAULT ARRAY['dashboard'::text], is_active boolean DEFAULT true, CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE );
CREATE TABLE IF NOT EXISTS public.roles ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL UNIQUE, description text, permissions jsonb DEFAULT '[]'::jsonb, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.permissions ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL UNIQUE, module text NOT NULL, description text, created_at timestamp with time zone DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.role_permissions ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, role text NOT NULL, role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE, permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE, can_view boolean DEFAULT false, can_create boolean DEFAULT false, can_edit boolean DEFAULT false, can_delete boolean DEFAULT false );
CREATE TABLE IF NOT EXISTS public.agenda ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, titulo text NOT NULL, descripcion text, fecha_vencimiento date, hora time without time zone, asignado_a uuid REFERENCES public.profiles(id) ON DELETE SET NULL, creado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL, prioridad public.tarea_prioridad DEFAULT 'MEDIA'::public.tarea_prioridad, estado public.tarea_estado DEFAULT 'PENDIENTE'::public.tarea_estado, etiquetas text[], recordatorio boolean DEFAULT false, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.clientes ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, codigo text UNIQUE, nombre text NOT NULL, tipo_documento text DEFAULT 'NIT'::text, documento text, direccion text, ciudad text, correo text, telefono text, contacto_principal text, notas text, activo boolean DEFAULT true, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.trabajos ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, codigo text UNIQUE, nombre text NOT NULL, cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL, descripcion text, ubicacion text, direccion text, fecha_inicio date, fecha_fin_estimada date, fecha_fin_real date, estado public.trabajo_estado DEFAULT 'COTIZADO'::public.trabajo_estado, presupuesto numeric DEFAULT 0, costo_real numeric DEFAULT 0, responsable_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, notas text, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.cotizaciones ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, numero text UNIQUE, tipo public.cotizacion_tipo DEFAULT 'NORMAL'::public.cotizacion_tipo, fecha date DEFAULT CURRENT_DATE, fecha_validez date, cliente_id uuid REFERENCES public.clientes(id), trabajo_id uuid REFERENCES public.trabajos(id), descripcion_trabajo text, condiciones text, subtotal numeric DEFAULT 0, total numeric DEFAULT 0, estado public.cotizacion_estado DEFAULT 'BORRADOR'::public.cotizacion_estado, creado_por uuid REFERENCES public.profiles(id), aprobado_por uuid REFERENCES public.profiles(id), fecha_aprobacion timestamp with time zone, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now(), progreso numeric DEFAULT 0, notas text );
CREATE TABLE IF NOT EXISTS public.cotizacion_items ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE, inventario_id uuid, codigo_trabajo_id uuid, item_numero integer, descripcion text NOT NULL, unidad text DEFAULT 'UND'::text, cantidad numeric DEFAULT 1, valor_unitario numeric DEFAULT 0, valor_total numeric DEFAULT 0, sub_items jsonb DEFAULT '[]'::jsonb, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.cotizacion_historial ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE, fecha timestamp with time zone NOT NULL DEFAULT now(), usuario_id text, usuario_nombre text, tipo text NOT NULL, descripcion text, metadata jsonb DEFAULT '{}'::jsonb, created_at timestamp with time zone DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.proveedores ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, codigo text UNIQUE, nombre text NOT NULL, nit text, categoria public.proveedor_categoria DEFAULT 'MIXTO'::public.proveedor_categoria, direccion text, ciudad text, correo text, telefono text, contacto text, datos_bancarios jsonb DEFAULT '{}'::jsonb, activo boolean DEFAULT true, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.inventario ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sku text UNIQUE, codigo text, nombre text NOT NULL, descripcion text, categoria public.inventario_categoria DEFAULT 'MATERIAL'::public.inventario_categoria, ubicacion public.inventario_ubicacion DEFAULT 'BODEGA'::public.inventario_ubicacion, unidad text DEFAULT 'UND'::text, cantidad numeric DEFAULT 0, stock_minimo numeric DEFAULT 0, valor_unitario numeric DEFAULT 0, valor_total numeric DEFAULT 0, proveedor_id uuid REFERENCES public.proveedores(id), activo boolean DEFAULT true, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.codigos_trabajo ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, codigo text NOT NULL UNIQUE, nombre text NOT NULL, descripcion text, unidad text DEFAULT 'UND'::text, costo_total numeric DEFAULT 0, precio_venta numeric DEFAULT 0, activo boolean DEFAULT true, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.materiales_asociados ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, codigo_trabajo_id uuid NOT NULL REFERENCES public.codigos_trabajo(id) ON DELETE CASCADE, inventario_id uuid REFERENCES public.inventario(id), cantidad numeric DEFAULT 1, valor_unitario numeric DEFAULT 0, valor_total numeric DEFAULT 0, created_at timestamp with time zone NOT NULL DEFAULT now(), sub_codigo_id uuid REFERENCES public.codigos_trabajo(id) );
CREATE TABLE IF NOT EXISTS public.ordenes_compra ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, numero text NOT NULL UNIQUE, proveedor_id uuid NOT NULL REFERENCES public.proveedores(id), total numeric DEFAULT 0, estado public.estado_orden_compra DEFAULT 'PENDIENTE'::public.estado_orden_compra, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.detalle_compra ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, orden_compra_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE, inventario_id uuid REFERENCES public.inventario(id), descripcion text NOT NULL, cantidad numeric DEFAULT 1, valor_unitario numeric DEFAULT 0, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.empleados ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, codigo text UNIQUE, nombre_completo text NOT NULL, cedula text UNIQUE, cargo text, salario_base numeric DEFAULT 0, estado public.empleado_estado DEFAULT 'ACTIVO'::public.empleado_estado, user_id uuid REFERENCES public.profiles(id), created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.creditos_empleados ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE, monto_solicitado numeric NOT NULL, saldo_pendiente numeric, estado text DEFAULT 'PENDIENTE'::text, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.novedades_nomina ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE, tipo public.novedad_tipo NOT NULL, valor_total numeric DEFAULT 0, estado text DEFAULT 'PENDIENTE'::text, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.pagos_nomina ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE, periodo text NOT NULL, neto_pagar numeric DEFAULT 0, estado text DEFAULT 'PENDIENTE'::text, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.liquidaciones ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE, total_liquidacion numeric DEFAULT 0, estado text DEFAULT 'PENDIENTE'::text, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.entregas_dotacion ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE, estado public.entrega_estado DEFAULT 'PENDIENTE'::public.entrega_estado, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.dotacion_items ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, codigo text UNIQUE, descripcion text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.dotacion_variantes ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, dotacion_id uuid NOT NULL REFERENCES public.dotacion_items(id) ON DELETE CASCADE, talla text, cantidad_disponible numeric DEFAULT 0, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.entrega_dotacion_items ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, entrega_id uuid NOT NULL REFERENCES public.entregas_dotacion(id) ON DELETE CASCADE, dotacion_id uuid REFERENCES public.dotacion_items(id), cantidad integer DEFAULT 1, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.vehiculos ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, placa text NOT NULL UNIQUE, marca text, modelo text, conductor_id uuid REFERENCES public.profiles(id), estado text DEFAULT 'ACTIVO'::text, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.gastos_vehiculos ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE, tipo public.gasto_vehiculo_tipo DEFAULT 'COMBUSTIBLE'::public.gasto_vehiculo_tipo, valor numeric DEFAULT 0, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.cuentas_bancarias ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, nombre text NOT NULL, tipo public.cuenta_tipo DEFAULT 'BANCO'::public.cuenta_tipo, saldo_actual numeric DEFAULT 0, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.facturas ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, numero text UNIQUE, cliente_id uuid REFERENCES public.clientes(id), total numeric DEFAULT 0, estado public.factura_estado DEFAULT 'BORRADOR'::public.factura_estado, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.cuentas_por_pagar ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, proveedor_id uuid NOT NULL REFERENCES public.proveedores(id), valor_total numeric DEFAULT 0, estado public.factura_estado DEFAULT 'PENDIENTE'::public.factura_estado, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.pagos_cxp ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, cuenta_por_pagar_id uuid NOT NULL REFERENCES public.cuentas_por_pagar(id) ON DELETE CASCADE, valor numeric NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.movimientos_financieros ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, tipo public.movimiento_tipo NOT NULL, cuenta_id uuid REFERENCES public.cuentas_bancarias(id), valor numeric NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.obligaciones_financieras ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, entidad text NOT NULL, monto_original numeric NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.obligaciones_pagos ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, obligacion_id uuid NOT NULL REFERENCES public.obligaciones_financieras(id) ON DELETE CASCADE, valor numeric NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.projects ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, title text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.contact_requests ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL, email text NOT NULL, message text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.alertas_inventario ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, tipo public.alerta_tipo NOT NULL, mensaje text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.registro_obras ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, trabajo_id uuid NOT NULL REFERENCES public.trabajos(id) ON DELETE CASCADE, descripcion text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now() );
CREATE TABLE IF NOT EXISTS public.movimientos_inventario ( id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, inventario_id uuid NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE, tipo public.movimiento_inventario_tipo NOT NULL, cantidad numeric NOT NULL, trabajo_id uuid REFERENCES public.trabajos(id) ON DELETE SET NULL, fecha date DEFAULT CURRENT_DATE, responsable_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, observacion text, created_at timestamp with time zone NOT NULL DEFAULT now() );

-- 5. EXACT RLS POLICIES (From User Source Server)

-- Clean up existing policies for public schema
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Enable RLS on ALL tables
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 5.1 Profiles
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN'::text);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = uid());
CREATE POLICY "Users can see own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = uid()) OR (get_current_user_role() = 'ADMIN'::text));

-- 5.2 Roles
CREATE POLICY "Only admin can manage roles" ON public.roles FOR ALL TO authenticated USING (get_current_user_role() = 'ADMIN'::text);
CREATE POLICY "Roles viewable by authenticated" ON public.roles FOR SELECT TO authenticated USING (true);

-- 5.3 Agenda
CREATE POLICY "Authenticated can create tasks" ON public.agenda FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can delete tasks" ON public.agenda FOR DELETE TO authenticated USING ((creado_por = uid()) OR (get_current_user_role() = 'ADMIN'::text));
CREATE POLICY "Users can update own tasks" ON public.agenda FOR UPDATE TO authenticated USING ((asignado_a = uid()) OR (creado_por = uid()) OR (get_current_user_role() = ANY (ARRAY['ADMIN'::text, 'MANAGER'::text])));
CREATE POLICY "Users see own tasks or if admin" ON public.agenda FOR SELECT TO authenticated USING ((asignado_a = uid()) OR (creado_por = uid()) OR (get_current_user_role() = ANY (ARRAY['ADMIN'::text, 'MANAGER'::text])));

-- 5.4 Projects & Contact Requests
CREATE POLICY "Authenticated users can delete projects" ON public.projects FOR DELETE USING (role() = 'authenticated'::text);
CREATE POLICY "Authenticated users can update projects" ON public.projects FOR UPDATE USING (role() = 'authenticated'::text);
CREATE POLICY "Authenticated users can insert projects" ON public.projects FOR INSERT WITH CHECK (role() = 'authenticated'::text);
CREATE POLICY "Public projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update contact requests" ON public.contact_requests FOR UPDATE USING (role() = 'authenticated'::text);
CREATE POLICY "Authenticated users can view contact requests" ON public.contact_requests FOR SELECT USING (role() = 'authenticated'::text);
CREATE POLICY "Public can insert contact requests" ON public.contact_requests FOR INSERT WITH CHECK (true);

-- 5.5 History
CREATE POLICY "Authenticated users can insert history" ON public.cotizacion_historial FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can select history" ON public.cotizacion_historial FOR SELECT TO authenticated USING (true);

-- 5.6 General Access (ALL TO authenticated USING true - EXACT NAMES)
CREATE POLICY "Clientes access for authenticated" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Trabajos access for authenticated" ON public.trabajos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Facturas access for authenticated" ON public.facturas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Proveedores access for authenticated" ON public.proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Codigos trabajo access for authenticated" ON public.codigos_trabajo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Cuentas por pagar access for authenticated" ON public.cuentas_por_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Vehiculos access for authenticated" ON public.vehiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Dotacion items access for authenticated" ON public.dotacion_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Dotacion variantes access for authenticated" ON public.dotacion_variantes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Gastos vehiculos access for authenticated" ON public.gastos_vehiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Alertas access for authenticated" ON public.alertas_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Cuentas bancarias access for authenticated" ON public.cuentas_bancarias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Movimientos access for authenticated" ON public.movimientos_financieros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Obligaciones access for authenticated" ON public.obligaciones_financieras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Empleados access for authenticated" ON public.empleados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Registro obras access for authenticated" ON public.registro_obras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Movimientos inventario access for authenticated" ON public.movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Novedades access for authenticated" ON public.novedades_nomina FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Pagos nomina access for authenticated" ON public.pagos_nomina FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Liquidaciones access for authenticated" ON public.liquidaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Creditos empleados access for authenticated" ON public.creditos_empleados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Entregas dotacion access for authenticated" ON public.entregas_dotacion FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Entrega items access for authenticated" ON public.entrega_dotacion_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Cotizacion items access for authenticated" ON public.cotizacion_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Cotizaciones access for authenticated" ON public.cotizaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Inventario access for authenticated" ON public.inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Pagos access for authenticated" ON public.obligaciones_pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Ordenes compra access for authenticated" ON public.ordenes_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Detalle compra access for authenticated" ON public.detalle_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Materiales asociados access for authenticated" ON public.materiales_asociados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Pagos CXP access for authenticated" ON public.pagos_cxp FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public) VALUES ('imagenes', 'imagenes', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('projects', 'projects', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('Archivos Carros', 'Archivos Carros', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies cleanup
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- Archivos Carros Policies
CREATE POLICY "Allow authenticated users to delete files from Archivos Carros" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'Archivos Carros'::text);
CREATE POLICY "Allow authenticated users to update files in Archivos Carros" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'Archivos Carros'::text);
CREATE POLICY "Allow authenticated users to insert files to Archivos Carros" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'Archivos Carros'::text);
CREATE POLICY "Allow authenticated users to select files from Archivos Carros" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'Archivos Carros'::text);

-- Projects Bucket Policies
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'projects'::text);
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE TO public USING ((bucket_id = 'projects'::text) AND (role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE TO public WITH CHECK ((bucket_id = 'projects'::text) AND (role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO public WITH CHECK ((bucket_id = 'projects'::text) AND (role() = 'authenticated'::text));
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'projects'::text);

-- Imagenes & Videos Policies
CREATE POLICY "Public Insert Videos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'videos'::text);
CREATE POLICY "Public Read Videos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'videos'::text);
CREATE POLICY "Public Insert Imagenes" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'imagenes'::text);
CREATE POLICY "Public Read Imagenes" ON storage.objects FOR SELECT TO public USING (bucket_id = 'imagenes'::text);

SELECT 'FULL CLONE V6: Con todas las políticas EXACTAS aplicadas' as resultado;



-- DESHABILITAR RLS para tablas UNRESTRICTED
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;











-- ============================================
-- DMRE-PLANS Module - Database Schema CANVA
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
CREATE INDEX idx_proyectos_planos_created_by ON proyectos_planos(created_by);
CREATE INDEX idx_proyectos_planos_created_at ON proyectos_planos(created_at DESC);

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
CREATE POLICY "Everyone can view projects"
    ON proyectos_planos FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can create projects"
    ON proyectos_planos FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON proyectos_planos FOR UPDATE
    USING (created_by = auth.uid() OR created_by IS NULL);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON proyectos_planos FOR DELETE
    USING (created_by = auth.uid() OR created_by IS NULL);

-- ============================================
-- STORAGE BUCKET POLICY (for Planos bucket)
-- ============================================

-- Note: Run these in Supabase dashboard or via API
-- The bucket "Planos" should already exist

-- Policy: Authenticated users can upload
-- INSERT policy on storage.objects WHERE bucket_id = 'Planos' AND auth.uid() IS NOT NULL

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















-- para el bucket de documentos Migration: Add RLS policies for Documentost_rabajos bucket
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
CREATE POLICY "Allow public read Documentost_rabajos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Documentost_rabajos');

-- INSERT: Allow authenticated users to upload
CREATE POLICY "Allow authenticated insert Documentost_rabajos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Documentost_rabajos');

-- UPDATE: Allow authenticated users to update
CREATE POLICY "Allow authenticated update Documentost_rabajos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Documentost_rabajos');

-- DELETE: Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete Documentost_rabajos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Documentost_rabajos');







-- =============================================
-- 14_CONSUMO_MATERIAL - Historial de consumo de materiales por proyecto lo nuevo para material
-- =============================================

CREATE TABLE public.consumo_material (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    cantidad NUMERIC(12,4) NOT NULL CHECK (cantidad > 0),
    unidad TEXT DEFAULT 'UND',
    descripcion TEXT,
    registrado_por UUID REFERENCES public.profiles(id),
    fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_consumo_material_inventario ON public.consumo_material(inventario_id);
CREATE INDEX idx_consumo_material_trabajo ON public.consumo_material(trabajo_id);
CREATE INDEX idx_consumo_material_fecha ON public.consumo_material(fecha);

ALTER TABLE public.consumo_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumo material access for authenticated"
    ON public.consumo_material FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);








    -- =============================================
-- 14_CONSUMO_MATERIAL - Historial de consumo de materiales por proyecto mejora
-- =============================================

-- Drop table if it exists (for re-runs)
DROP TABLE IF EXISTS public.consumo_material;

CREATE TABLE public.consumo_material (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE CASCADE,
    descripcion_material TEXT,  -- Name of material (for items without inventory link)
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    cantidad NUMERIC(12,4) NOT NULL CHECK (cantidad > 0),
    unidad TEXT DEFAULT 'UND',
    descripcion TEXT,
    registrado_por UUID REFERENCES public.profiles(id),
    fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_consumo_material_inventario ON public.consumo_material(inventario_id);
CREATE INDEX idx_consumo_material_trabajo ON public.consumo_material(trabajo_id);
CREATE INDEX idx_consumo_material_fecha ON public.consumo_material(fecha);

-- Disable RLS completely for simplicity (matches other tables in the project)
ALTER TABLE public.consumo_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumo material access for authenticated"
    ON public.consumo_material FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);













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

CREATE INDEX idx_consumo_material_inventario ON public.consumo_material(inventario_id);
CREATE INDEX idx_consumo_material_cotizacion ON public.consumo_material(cotizacion_id);
CREATE INDEX idx_consumo_material_fecha ON public.consumo_material(fecha);

-- Disable RLS for simplicity (matches other tables pattern)
ALTER TABLE public.consumo_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumo material full access for authenticated"
    ON public.consumo_material FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);







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
CREATE POLICY "Users can view versions of their projects" 
    ON public.plan_versions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );

CREATE POLICY "Users can create versions of their projects" 
    ON public.plan_versions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );

CREATE POLICY "Users can delete versions of their projects" 
    ON public.plan_versions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );
