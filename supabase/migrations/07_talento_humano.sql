-- =============================================
-- 07_TALENTO_HUMANO - Módulo de RRHH
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

CREATE INDEX idx_empleados_cedula ON public.empleados(cedula);
CREATE INDEX idx_empleados_codigo ON public.empleados(codigo);
CREATE INDEX idx_empleados_estado ON public.empleados(estado);
CREATE INDEX idx_empleados_cargo ON public.empleados(cargo);

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empleados access for authenticated"
    ON public.empleados FOR ALL
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

CREATE INDEX idx_novedades_empleado ON public.novedades_nomina(empleado_id);
CREATE INDEX idx_novedades_periodo ON public.novedades_nomina(periodo);
CREATE INDEX idx_novedades_fecha ON public.novedades_nomina(fecha);
CREATE INDEX idx_novedades_tipo ON public.novedades_nomina(tipo);

ALTER TABLE public.novedades_nomina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Novedades access for authenticated"
    ON public.novedades_nomina FOR ALL
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

CREATE INDEX idx_pagos_nomina_empleado ON public.pagos_nomina(empleado_id);
CREATE INDEX idx_pagos_nomina_periodo ON public.pagos_nomina(periodo);
CREATE INDEX idx_pagos_nomina_estado ON public.pagos_nomina(estado);

ALTER TABLE public.pagos_nomina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pagos nomina access for authenticated"
    ON public.pagos_nomina FOR ALL
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

CREATE INDEX idx_liquidaciones_empleado ON public.liquidaciones(empleado_id);
CREATE INDEX idx_liquidaciones_tipo ON public.liquidaciones(tipo);
CREATE INDEX idx_liquidaciones_estado ON public.liquidaciones(estado);

ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Liquidaciones access for authenticated"
    ON public.liquidaciones FOR ALL
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

CREATE INDEX idx_creditos_empleados_empleado ON public.creditos_empleados(empleado_id);
CREATE INDEX idx_creditos_empleados_estado ON public.creditos_empleados(estado);

ALTER TABLE public.creditos_empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creditos empleados access for authenticated"
    ON public.creditos_empleados FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: entregas_dotacion (movida aquí por FK a empleados)
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

CREATE INDEX idx_entregas_dotacion_empleado ON public.entregas_dotacion(empleado_id);
CREATE INDEX idx_entregas_dotacion_fecha ON public.entregas_dotacion(fecha);
CREATE INDEX idx_entregas_dotacion_estado ON public.entregas_dotacion(estado);

ALTER TABLE public.entregas_dotacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entregas dotacion access for authenticated"
    ON public.entregas_dotacion FOR ALL
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

CREATE INDEX idx_entrega_items_entrega ON public.entrega_dotacion_items(entrega_id);

ALTER TABLE public.entrega_dotacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entrega items access for authenticated"
    ON public.entrega_dotacion_items FOR ALL
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




