-- Migration: Add Compras Financieras
-- Table to store purchase invoices linked to approved offers

CREATE TABLE IF NOT EXISTS public.compras_financiera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
    cotizacion_proveedor_id UUID REFERENCES public.cotizaciones_proveedor(id) ON DELETE SET NULL,
    numero_factura TEXT NOT NULL,
    iva NUMERIC DEFAULT 0,
    valor_factura NUMERIC NOT NULL DEFAULT 0,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_pago NUMERIC DEFAULT 0,
    fecha_pago DATE,
    saldo NUMERIC GENERATED ALWAYS AS (valor_factura - valor_pago) STORED,
    dias_credito INTEGER DEFAULT 0,
    metodo_pago TEXT,
    soporte_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_compras_financiera_cotizacion ON public.compras_financiera(cotizacion_id);

-- Trigger for updated_at (using existing function update_modified_column)
DROP TRIGGER IF EXISTS update_compras_financiera_modtime ON public.compras_financiera;
CREATE TRIGGER update_compras_financiera_modtime
    BEFORE UPDATE ON public.compras_financiera
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- RLS Policies
ALTER TABLE public.compras_financiera ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.compras_financiera;
CREATE POLICY "Enable read access for authenticated users" ON public.compras_financiera
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.compras_financiera;
CREATE POLICY "Enable insert for authenticated users" ON public.compras_financiera
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.compras_financiera;
CREATE POLICY "Enable update for authenticated users" ON public.compras_financiera
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.compras_financiera;
CREATE POLICY "Enable delete for authenticated users" ON public.compras_financiera
    FOR DELETE TO authenticated USING (true);
