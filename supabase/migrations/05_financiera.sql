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
