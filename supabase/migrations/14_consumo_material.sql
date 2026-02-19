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
