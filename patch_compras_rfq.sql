-- Patch: Módulo de Compras (RFQs y Órdenes de Compra)
-- Depende de: cotizaciones, proveedores, inventario

-- 1. Cotizaciones de Proveedores (Solicitud de Cotización de Materiales / RFQ)
CREATE TABLE IF NOT EXISTS public.cotizaciones_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL UNIQUE,
    cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, ENVIADA, APROBADA, RECHAZADA
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    creado_por UUID,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Items de la Cotización a Proveedores
CREATE TABLE IF NOT EXISTS public.cotizaciones_proveedor_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_proveedor_id UUID NOT NULL REFERENCES public.cotizaciones_proveedor(id) ON DELETE CASCADE,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    valor_unitario_ofrecido NUMERIC(15,2), -- Llenado por el proveedor o el comprador al recibir la oferta
    valor_total_ofrecido NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Órdenes de Compra
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL UNIQUE,
    cotizacion_proveedor_id UUID REFERENCES public.cotizaciones_proveedor(id) ON DELETE SET NULL,
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, ENVIADA, PARCIAL, RECIBIDA, CANCELADA
    fecha_emision TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_entrega_estimada TIMESTAMP WITH TIME ZONE,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    impuestos NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    observaciones TEXT,
    creado_por UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía de antes, asegurarnos de que tenga la columna de vinculación
ALTER TABLE public.ordenes_compra ADD COLUMN IF NOT EXISTS cotizacion_proveedor_id UUID REFERENCES public.cotizaciones_proveedor(id) ON DELETE SET NULL;

-- Items de la Orden de Compra
CREATE TABLE IF NOT EXISTS public.ordenes_compra_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_compra_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,
    valor_unitario NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    cantidad_recibida NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.cotizaciones_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones_proveedor_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.cotizaciones_proveedor FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.cotizaciones_proveedor FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.cotizaciones_proveedor FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.cotizaciones_proveedor FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.cotizaciones_proveedor_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.cotizaciones_proveedor_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.cotizaciones_proveedor_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.cotizaciones_proveedor_items FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.ordenes_compra FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.ordenes_compra FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.ordenes_compra FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.ordenes_compra FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.ordenes_compra_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.ordenes_compra_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.ordenes_compra_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.ordenes_compra_items FOR DELETE USING (auth.role() = 'authenticated');
