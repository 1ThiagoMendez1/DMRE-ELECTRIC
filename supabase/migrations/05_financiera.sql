-- =============================================
-- 05_FINANCIERA - Módulo Financiero
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

CREATE POLICY "Cuentas bancarias access for authenticated"
    ON public.cuentas_bancarias FOR ALL
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

CREATE INDEX idx_movimientos_fecha ON public.movimientos_financieros(fecha);
CREATE INDEX idx_movimientos_tipo ON public.movimientos_financieros(tipo);
CREATE INDEX idx_movimientos_cuenta ON public.movimientos_financieros(cuenta_id);
CREATE INDEX idx_movimientos_categoria ON public.movimientos_financieros(categoria);
CREATE INDEX idx_movimientos_trabajo ON public.movimientos_financieros(trabajo_id);

ALTER TABLE public.movimientos_financieros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movimientos access for authenticated"
    ON public.movimientos_financieros FOR ALL
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

CREATE INDEX idx_obligaciones_estado ON public.obligaciones_financieras(estado);
CREATE INDEX idx_obligaciones_entidad ON public.obligaciones_financieras(entidad);

ALTER TABLE public.obligaciones_financieras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Obligaciones access for authenticated"
    ON public.obligaciones_financieras FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);



-- =============================================
-- SEED DATA: Obligaciones Financieras
-- =============================================
INSERT INTO public.obligaciones_financieras (
    tipo, 
    entidad, 
    descripcion, 
    monto_original, 
    tasa_interes, 
    plazo_meses, 
    fecha_inicio, 
    valor_cuota, 
    saldo_capital, 
    estado,
    observaciones
) VALUES 
(
    'PRESTAMO',
    'Banco Agrario',
    'Crédito Libre Inversión',
    50000000,
    0.015, -- 1.5% MV
    60,
    '2025-01-15',
    1269000,
    49500000,
    'ACTIVO',
    'Crédito rotativo para capital de trabajo'
),
(
    'LEASING',
    'Bancolombia',
    'Leasing Camioneta',
    85000000,
    0.012, -- 1.2% MV
    48,
    '2025-02-01',
    2350000,
    85000000,
    'ACTIVO',
    'Vehículo placa HJK-456'
),
(
    'TARJETA_CREDITO',
    'Davivienda',
    'Tarjeta Corporativa',
    15000000,
    0.021, -- 2.1% MV
    24,
    '2024-11-20',
    850000,
    12400000,
    'ACTIVO',
    'Compras de insumos mensuales'
);



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
CREATE INDEX idx_pagos_obligacion ON public.obligaciones_pagos(obligacion_id);
ALTER TABLE public.obligaciones_pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pagos access for authenticated"
    ON public.obligaciones_pagos FOR ALL
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