-- =============================================
-- 09_LOGISTICA_COMPRAS - Órdenes de Compra
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON public.ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON public.ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_numero ON public.ordenes_compra(numero);

-- RLS
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ordenes compra access for authenticated"
    ON public.ordenes_compra FOR ALL
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_detalle_compra_orden ON public.detalle_compra(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_detalle_compra_inventario ON public.detalle_compra(inventario_id);

-- RLS
ALTER TABLE public.detalle_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Detalle compra access for authenticated"
    ON public.detalle_compra FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
