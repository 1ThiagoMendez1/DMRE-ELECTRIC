-- =============================================
-- 00_CLEANUP - LIMPIEZA COMPLETA DE LA BASE DE DATOS
-- =============================================
-- ADVERTENCIA: Este script eliminará TODAS las tablas, funciones y tipos
-- Ejecutar SOLO si desea recrear toda la base de datos
-- =============================================

-- Desactivar verificación de claves foráneas temporalmente
SET session_replication_role = 'replica';

-- =============================================
-- 1. ELIMINAR TODAS LAS POLÍTICAS RLS
-- =============================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =============================================
-- 2. ELIMINAR TODOS LOS TRIGGERS
-- =============================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', r.trigger_name, r.event_object_table);
    END LOOP;
END $$;

-- =============================================
-- 3. ELIMINAR TODAS LAS TABLAS
-- =============================================

-- Tablas encontradas en la base de datos actual
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.codigo_trabajo_materiales CASCADE;
DROP TABLE IF EXISTS public.orden_compra_items CASCADE;
DROP TABLE IF EXISTS public.ordenes_compra CASCADE;

-- Talento Humano
DROP TABLE IF EXISTS public.entrega_dotacion_items CASCADE;
DROP TABLE IF EXISTS public.entregas_dotacion CASCADE;
DROP TABLE IF EXISTS public.creditos_empleados CASCADE;
DROP TABLE IF EXISTS public.liquidaciones CASCADE;
DROP TABLE IF EXISTS public.pagos_nomina CASCADE;
DROP TABLE IF EXISTS public.novedades_nomina CASCADE;
DROP TABLE IF EXISTS public.empleados CASCADE;

-- Operaciones
DROP TABLE IF EXISTS public.movimientos_inventario CASCADE;
DROP TABLE IF EXISTS public.registro_obras CASCADE;

-- Financiera
DROP TABLE IF EXISTS public.obligaciones_financieras CASCADE;
DROP TABLE IF EXISTS public.movimientos_financieros CASCADE;
DROP TABLE IF EXISTS public.cuentas_bancarias CASCADE;

-- Logística
DROP TABLE IF EXISTS public.alertas_inventario CASCADE;
DROP TABLE IF EXISTS public.gastos_vehiculos CASCADE;
DROP TABLE IF EXISTS public.vehiculos CASCADE;
DROP TABLE IF EXISTS public.dotacion_variantes CASCADE;
DROP TABLE IF EXISTS public.dotacion_items CASCADE;
DROP TABLE IF EXISTS public.cuentas_por_pagar CASCADE;
DROP TABLE IF EXISTS public.materiales_asociados CASCADE;
DROP TABLE IF EXISTS public.codigos_trabajo CASCADE;
DROP TABLE IF EXISTS public.inventario CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;

-- Comercial
DROP TABLE IF EXISTS public.facturas CASCADE;
DROP TABLE IF EXISTS public.cotizacion_items CASCADE;
DROP TABLE IF EXISTS public.cotizaciones CASCADE;
DROP TABLE IF EXISTS public.trabajos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- Control y Sistema
DROP TABLE IF EXISTS public.agenda CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =============================================
-- 4. ELIMINAR FUNCIONES
-- =============================================
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =============================================
-- 5. ELIMINAR TIPOS ENUM
-- =============================================
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.tarea_prioridad CASCADE;
DROP TYPE IF EXISTS public.tarea_estado CASCADE;
DROP TYPE IF EXISTS public.trabajo_estado CASCADE;
DROP TYPE IF EXISTS public.cotizacion_estado CASCADE;
DROP TYPE IF EXISTS public.cotizacion_tipo CASCADE;
DROP TYPE IF EXISTS public.factura_estado CASCADE;
DROP TYPE IF EXISTS public.cuenta_tipo CASCADE;
DROP TYPE IF EXISTS public.movimiento_tipo CASCADE;
DROP TYPE IF EXISTS public.movimiento_categoria CASCADE;
DROP TYPE IF EXISTS public.inventario_categoria CASCADE;
DROP TYPE IF EXISTS public.inventario_ubicacion CASCADE;
DROP TYPE IF EXISTS public.proveedor_categoria CASCADE;
DROP TYPE IF EXISTS public.gasto_vehiculo_tipo CASCADE;
DROP TYPE IF EXISTS public.alerta_tipo CASCADE;
DROP TYPE IF EXISTS public.movimiento_inventario_tipo CASCADE;
DROP TYPE IF EXISTS public.entrega_estado CASCADE;
DROP TYPE IF EXISTS public.empleado_estado CASCADE;
DROP TYPE IF EXISTS public.novedad_tipo CASCADE;
DROP TYPE IF EXISTS public.liquidacion_tipo CASCADE;

-- Restaurar verificación de claves foráneas
SET session_replication_role = 'origin';

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Limpieza completada exitosamente' as resultado;
