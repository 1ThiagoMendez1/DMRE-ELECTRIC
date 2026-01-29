-- =============================================
-- 06_OPERACIONES - Operaciones y Logística
-- =============================================

-- =============================================
-- TABLA: registro_obras (Registro de actividades en obras)
-- =============================================
CREATE TABLE public.registro_obras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE CASCADE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    descripcion TEXT NOT NULL,
    tipo_actividad TEXT,
    avance_porcentaje NUMERIC(5,2) DEFAULT 0 CHECK (avance_porcentaje >= 0 AND avance_porcentaje <= 100),
    horas_trabajadas NUMERIC(5,2),
    personal_cantidad INTEGER,
    -- Clima y condiciones
    clima TEXT,
    condiciones TEXT,
    -- Materiales usados
    materiales_usados JSONB DEFAULT '[]',
    -- Incidentes
    incidentes TEXT,
    -- Registro
    responsable_id UUID REFERENCES public.profiles(id),
    fotos TEXT[],
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_registro_obras_modtime
    BEFORE UPDATE ON public.registro_obras
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_registro_obras_trabajo ON public.registro_obras(trabajo_id);
CREATE INDEX idx_registro_obras_fecha ON public.registro_obras(fecha);
CREATE INDEX idx_registro_obras_responsable ON public.registro_obras(responsable_id);

ALTER TABLE public.registro_obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registro obras access for authenticated"
    ON public.registro_obras FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: movimientos_inventario
-- =============================================
CREATE TABLE public.movimientos_inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE CASCADE NOT NULL,
    tipo movimiento_inventario_tipo NOT NULL,
    cantidad NUMERIC(12,4) NOT NULL,
    cantidad_anterior NUMERIC(12,4),
    cantidad_nueva NUMERIC(12,4),
    -- Referencias
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    origen TEXT,
    destino TEXT,
    -- Documento
    numero_documento TEXT,
    -- Registro
    fecha DATE DEFAULT CURRENT_DATE,
    responsable_id UUID REFERENCES public.profiles(id),
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_movimientos_inv_inventario ON public.movimientos_inventario(inventario_id);
CREATE INDEX idx_movimientos_inv_trabajo ON public.movimientos_inventario(trabajo_id);
CREATE INDEX idx_movimientos_inv_fecha ON public.movimientos_inventario(fecha);
CREATE INDEX idx_movimientos_inv_tipo ON public.movimientos_inventario(tipo);

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movimientos inventario access for authenticated"
    ON public.movimientos_inventario FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
