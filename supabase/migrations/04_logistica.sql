-- =============================================
-- 04_LOGISTICA - Logística e Inventarios
-- =============================================

-- =============================================
-- TABLA: proveedores
-- =============================================
CREATE TABLE public.proveedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    nit TEXT,
    categoria proveedor_categoria DEFAULT 'MIXTO',
    direccion TEXT,
    ciudad TEXT,
    correo TEXT,
    telefono TEXT,
    contacto TEXT,
    datos_bancarios JSONB DEFAULT '{}',
    calificacion INTEGER DEFAULT 5 CHECK (calificacion >= 1 AND calificacion <= 5),
    activo BOOLEAN DEFAULT true,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_proveedores_modtime
    BEFORE UPDATE ON public.proveedores
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_proveedores_nit ON public.proveedores(nit);
CREATE INDEX idx_proveedores_nombre ON public.proveedores(nombre);
CREATE INDEX idx_proveedores_categoria ON public.proveedores(categoria);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proveedores access for authenticated"
    ON public.proveedores FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: inventario (Catálogo)
-- =============================================
CREATE TABLE public.inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE,
    codigo TEXT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria inventario_categoria DEFAULT 'MATERIAL',
    ubicacion inventario_ubicacion DEFAULT 'BODEGA',
    unidad TEXT DEFAULT 'UND',
    cantidad NUMERIC(12,4) DEFAULT 0,
    stock_minimo NUMERIC(12,4) DEFAULT 0,
    stock_maximo NUMERIC(12,4),
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    marca TEXT,
    modelo TEXT,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_inventario_modtime
    BEFORE UPDATE ON public.inventario
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_inventario_sku ON public.inventario(sku);
CREATE INDEX idx_inventario_codigo ON public.inventario(codigo);
CREATE INDEX idx_inventario_categoria ON public.inventario(categoria);
CREATE INDEX idx_inventario_ubicacion ON public.inventario(ubicacion);
CREATE INDEX idx_inventario_proveedor ON public.inventario(proveedor_id);

ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventario access for authenticated"
    ON public.inventario FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: codigos_trabajo (APUs)
-- =============================================
CREATE TABLE public.codigos_trabajo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    unidad TEXT DEFAULT 'UND',
    mano_de_obra NUMERIC(15,2) DEFAULT 0,
    costo_materiales NUMERIC(15,2) DEFAULT 0,
    otros_costos NUMERIC(15,2) DEFAULT 0,
    costo_total NUMERIC(15,2) DEFAULT 0,
    precio_venta NUMERIC(15,2) DEFAULT 0,
    margen NUMERIC(5,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_codigos_trabajo_modtime
    BEFORE UPDATE ON public.codigos_trabajo
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_codigos_trabajo_codigo ON public.codigos_trabajo(codigo);

ALTER TABLE public.codigos_trabajo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Codigos trabajo access for authenticated"
    ON public.codigos_trabajo FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: materiales_asociados (materiales de APUs)
-- =============================================
CREATE TABLE public.materiales_asociados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_trabajo_id UUID REFERENCES public.codigos_trabajo(id) ON DELETE CASCADE NOT NULL,
    inventario_id UUID REFERENCES public.inventario(id) ON DELETE SET NULL,
    nombre TEXT,
    descripcion TEXT,
    unidad TEXT DEFAULT 'UND',
    cantidad NUMERIC(12,4) DEFAULT 1,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_materiales_asociados_codigo ON public.materiales_asociados(codigo_trabajo_id);
CREATE INDEX idx_materiales_asociados_inventario ON public.materiales_asociados(inventario_id);

ALTER TABLE public.materiales_asociados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materiales asociados access for authenticated"
    ON public.materiales_asociados FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: cuentas_por_pagar
-- =============================================
CREATE TABLE public.cuentas_por_pagar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL NOT NULL,
    numero_factura TEXT,
    fecha_factura DATE,
    fecha_vencimiento DATE,
    concepto TEXT,
    trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
    valor_total NUMERIC(15,2) DEFAULT 0,
    valor_pagado NUMERIC(15,2) DEFAULT 0,
    saldo_pendiente NUMERIC(15,2) GENERATED ALWAYS AS (valor_total - valor_pagado) STORED,
    estado factura_estado DEFAULT 'PENDIENTE',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_cuentas_por_pagar_modtime
    BEFORE UPDATE ON public.cuentas_por_pagar
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_cuentas_por_pagar_proveedor ON public.cuentas_por_pagar(proveedor_id);
CREATE INDEX idx_cuentas_por_pagar_trabajo ON public.cuentas_por_pagar(trabajo_id);
CREATE INDEX idx_cuentas_por_pagar_estado ON public.cuentas_por_pagar(estado);

ALTER TABLE public.cuentas_por_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cuentas por pagar access for authenticated"
    ON public.cuentas_por_pagar FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLAS: Dotación
-- =============================================
CREATE TABLE public.dotacion_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE,
    descripcion TEXT NOT NULL,
    categoria TEXT DEFAULT 'UNIFORME',
    genero TEXT DEFAULT 'UNISEX',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_dotacion_items_modtime
    BEFORE UPDATE ON public.dotacion_items
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.dotacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dotacion items access for authenticated"
    ON public.dotacion_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE TABLE public.dotacion_variantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dotacion_id UUID REFERENCES public.dotacion_items(id) ON DELETE CASCADE NOT NULL,
    talla TEXT,
    color TEXT,
    cantidad_disponible NUMERIC(10,2) DEFAULT 0,
    cantidad_minima NUMERIC(10,2) DEFAULT 0,
    valor_unitario NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_dotacion_variantes_modtime
    BEFORE UPDATE ON public.dotacion_variantes
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_dotacion_variantes_dotacion ON public.dotacion_variantes(dotacion_id);

ALTER TABLE public.dotacion_variantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dotacion variantes access for authenticated"
    ON public.dotacion_variantes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLAS: Vehículos y Activos
-- =============================================
CREATE TABLE public.vehiculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    placa TEXT UNIQUE NOT NULL,
    tipo TEXT,
    marca TEXT,
    modelo TEXT,
    anno INTEGER,
    color TEXT,
    conductor_asignado TEXT,
    conductor_id UUID REFERENCES public.profiles(id),
    -- Documentos
    vencimiento_soat DATE,
    vencimiento_tecnomecanica DATE,
    vencimiento_seguro DATE,
    vencimiento_licencia_transito DATE,
    -- Estado
    kilometraje_actual NUMERIC(12,2) DEFAULT 0,
    estado TEXT DEFAULT 'ACTIVO',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_vehiculos_modtime
    BEFORE UPDATE ON public.vehiculos
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_vehiculos_placa ON public.vehiculos(placa);
CREATE INDEX idx_vehiculos_conductor ON public.vehiculos(conductor_id);

ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehiculos access for authenticated"
    ON public.vehiculos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE TABLE public.gastos_vehiculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE CASCADE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo gasto_vehiculo_tipo DEFAULT 'COMBUSTIBLE',
    descripcion TEXT,
    kilometraje NUMERIC(12,2),
    valor NUMERIC(15,2) DEFAULT 0,
    proveedor TEXT,
    numero_factura TEXT,
    responsable_id UUID REFERENCES public.profiles(id),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_gastos_vehiculos_vehiculo ON public.gastos_vehiculos(vehiculo_id);
CREATE INDEX idx_gastos_vehiculos_fecha ON public.gastos_vehiculos(fecha);
CREATE INDEX idx_gastos_vehiculos_tipo ON public.gastos_vehiculos(tipo);

ALTER TABLE public.gastos_vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gastos vehiculos access for authenticated"
    ON public.gastos_vehiculos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- TABLA: alertas_inventario
-- =============================================
CREATE TABLE public.alertas_inventario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo alerta_tipo NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id UUID,
    mensaje TEXT NOT NULL,
    umbral NUMERIC(15,2),
    valor_actual NUMERIC(15,2),
    activa BOOLEAN DEFAULT true,
    leida BOOLEAN DEFAULT false,
    fecha_generacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_alertas_tipo ON public.alertas_inventario(tipo);
CREATE INDEX idx_alertas_activa ON public.alertas_inventario(activa);

ALTER TABLE public.alertas_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alertas access for authenticated"
    ON public.alertas_inventario FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- Agregar FKs a cotizacion_items
-- =============================================
ALTER TABLE public.cotizacion_items 
    ADD CONSTRAINT fk_cotizacion_items_inventario 
    FOREIGN KEY (inventario_id) REFERENCES public.inventario(id) ON DELETE SET NULL;

ALTER TABLE public.cotizacion_items 
    ADD CONSTRAINT fk_cotizacion_items_codigo_trabajo 
    FOREIGN KEY (codigo_trabajo_id) REFERENCES public.codigos_trabajo(id) ON DELETE SET NULL;



-- =============================================
-- Agregar columnas a inventario
-- =============================================
ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS precio_proveedor NUMERIC DEFAULT 0;



-- INSERTAR DATOS DEMO EN CUENTAS POR PAGAR (VERSION FINAL)
INSERT INTO public.cuentas_por_pagar (
    proveedor_id, 
    numero_factura, 
    fecha_factura, 
    fecha_vencimiento, 
    concepto, 
    trabajo_id, 
    valor_total, 
    valor_pagado, 
    estado, 
    observaciones
) VALUES 
(
    (SELECT id FROM proveedores WHERE codigo = 'PROV-003' LIMIT 1), 
    'FACT-A202', 
    '2024-05-10', 
    '2024-06-10', 
    'Compra de Conductores ELÉCTRICOS THW #12', 
    (SELECT id FROM trabajos WHERE codigo = 'OBR-2024-001' LIMIT 1), 
    1250000, 
    0, 
    'PENDIENTE', 
    'Material crítico para el piso 5'
),
(
    (SELECT id FROM proveedores WHERE codigo = 'PROV-001' LIMIT 1), 
    'INV-9988', 
    '2024-05-15', 
    '2024-06-15', 
    'Tubería EMT y accesorios de conexión', 
    (SELECT id FROM trabajos WHERE codigo = 'OBR-2024-002' LIMIT 1), 
    850000, 
    400000, 
    'PENDIENTE', 
    'Abono parcial realizado'
),
(
    (SELECT id FROM proveedores WHERE codigo = 'PROV-002' LIMIT 1), 
    'FE-1055', 
    '2024-05-20', 
    '2024-06-20', 
    'Tableros de distribución trifásicos', 
    (SELECT id FROM trabajos WHERE codigo = 'OBR-2024-003' LIMIT 1), 
    3450000, 
    3450000, 
    'PAGADA', 
    'Factura cancelada en su totalidad'
),
(
    (SELECT id FROM proveedores WHERE codigo = 'PROV-004' LIMIT 1), 
    'SERV-004', 
    '2024-05-25', 
    '2024-06-25', 
    'Servicio técnico especializado - Pruebas de carga', 
    (SELECT id FROM trabajos WHERE codigo = 'OBR-2024-001' LIMIT 1), 
    600000, 
    0, 
    'PENDIENTE', 
    'Pendiente por revisión de interventoría'
);



-- =============================================
-- TABLA: pagos_cxp (Historial de Pagos a Proveedores)
-- =============================================

CREATE TABLE IF NOT EXISTS public.pagos_cxp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cuenta_por_pagar_id UUID NOT NULL REFERENCES public.cuentas_por_pagar(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
    metodo_pago TEXT,
    cuenta_bancaria_id UUID REFERENCES public.cuentas_bancarias(id),
    nota TEXT,
    referencia_bancaria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagos_cxp_cuenta ON public.pagos_cxp(cuenta_por_pagar_id);

-- Habilitar RLS
ALTER TABLE public.pagos_cxp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pagos CXP access for authenticated"
    ON public.pagos_cxp FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =============================================
-- DATOS DE SIMULACIÓN PARA PAGOS RECURRENNTES
-- =============================================

-- 1. Pago parcial para INV-9988 (PROV-001)
INSERT INTO public.pagos_cxp (cuenta_por_pagar_id, fecha, valor, metodo_pago, cuenta_bancaria_id, nota)
SELECT 
    id, 
    '2024-05-16', 
    200000, 
    'TRANSFERENCIA', 
    (SELECT id FROM cuentas_bancarias WHERE principal = true LIMIT 1),
    'Abono inicial 1'
FROM cuentas_por_pagar 
WHERE numero_factura = 'INV-9988' 
LIMIT 1;

INSERT INTO public.pagos_cxp (cuenta_por_pagar_id, fecha, valor, metodo_pago, cuenta_bancaria_id, nota)
SELECT 
    id, 
    '2024-05-18', 
    200000, 
    'TRANSFERENCIA', 
    (SELECT id FROM cuentas_bancarias WHERE principal = true LIMIT 1),
    'Abono inicial 2'
FROM cuentas_por_pagar 
WHERE numero_factura = 'INV-9988' 
LIMIT 1;

-- 2. Pago total para FE-1055 (PROV-002)
INSERT INTO public.pagos_cxp (cuenta_por_pagar_id, fecha, valor, metodo_pago, cuenta_bancaria_id, nota)
SELECT 
    id, 
    '2024-05-21', 
    3450000, 
    'TRANSFERENCIA', 
    (SELECT id FROM cuentas_bancarias WHERE principal = true LIMIT 1),
    'Pago total factura'
FROM cuentas_por_pagar 
WHERE numero_factura = 'FE-1055' 
LIMIT 1;

