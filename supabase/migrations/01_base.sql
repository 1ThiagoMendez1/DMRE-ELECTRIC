-- =============================================
-- 01_BASE - Extensiones, Funciones y ENUMS
-- =============================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- FUNCIÓN: Actualizar timestamp automáticamente
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
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS tarea_prioridad CASCADE;
DROP TYPE IF EXISTS tarea_estado CASCADE;
DROP TYPE IF EXISTS trabajo_estado CASCADE;
DROP TYPE IF EXISTS cotizacion_estado CASCADE;
DROP TYPE IF EXISTS cotizacion_tipo CASCADE;
DROP TYPE IF EXISTS factura_estado CASCADE;
DROP TYPE IF EXISTS cuenta_tipo CASCADE;
DROP TYPE IF EXISTS movimiento_tipo CASCADE;
DROP TYPE IF EXISTS movimiento_categoria CASCADE;
DROP TYPE IF EXISTS inventario_categoria CASCADE;
DROP TYPE IF EXISTS inventario_ubicacion CASCADE;
DROP TYPE IF EXISTS proveedor_categoria CASCADE;
DROP TYPE IF EXISTS gasto_vehiculo_tipo CASCADE;
DROP TYPE IF EXISTS alerta_tipo CASCADE;
DROP TYPE IF EXISTS movimiento_inventario_tipo CASCADE;
DROP TYPE IF EXISTS entrega_estado CASCADE;
DROP TYPE IF EXISTS empleado_estado CASCADE;
DROP TYPE IF EXISTS novedad_tipo CASCADE;
DROP TYPE IF EXISTS liquidacion_tipo CASCADE;

-- Control y Sistema
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'ENGINEER', 'OPERATOR', 'VIEWER');
CREATE TYPE tarea_prioridad AS ENUM ('ALTA', 'MEDIA', 'BAJA');
CREATE TYPE tarea_estado AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- Gestión Comercial
CREATE TYPE trabajo_estado AS ENUM ('COTIZADO', 'APROBADO', 'EN_EJECUCION', 'PAUSADO', 'FINALIZADO', 'CANCELADO');
CREATE TYPE cotizacion_estado AS ENUM ('BORRADOR', 'PENDIENTE', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'EN_EJECUCION', 'FINALIZADA');
CREATE TYPE cotizacion_tipo AS ENUM ('NORMAL', 'SIMPLIFICADA');
CREATE TYPE factura_estado AS ENUM ('BORRADOR', 'PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA');

-- Financiera
CREATE TYPE cuenta_tipo AS ENUM ('BANCO', 'EFECTIVO', 'CREDITO');
CREATE TYPE movimiento_tipo AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE movimiento_categoria AS ENUM ('NOMINA', 'PROVEEDORES', 'SERVICIOS', 'IMPUESTOS', 'VENTAS', 'ANTICIPOS', 'OTROS');

-- Logística e Inventarios
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
