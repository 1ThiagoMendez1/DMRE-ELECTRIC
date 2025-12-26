export type UserRole = 'ADMIN' | 'ENGINEER' | 'CLIENT' | 'VIEWER';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

// --- SHARED / EXISTING ---
// Retaining original types to avoid breaking existing modules if they were used there.
// User said "don't modify existing", so we assume existing code relies on some of these.

export interface Cliente {
    id: string;
    nombre: string;
    documento: string; // NIT or CC
    direccion: string;
    correo: string;
    telefono: string;
    contactoPrincipal: string; // New
    fechaCreacion: Date;
}

export interface Material {
    id: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    valorUnitario: number; // Costo por unidad
    valorTotal: number; // Costo total del material en el item
}

export type CategoriaItem = 'MATERIAL' | 'HERRAMIENTA' | 'DOTACION' | 'EPP';
export type UbicacionItem = 'BODEGA' | 'OBRA';

export interface InventarioItem {
    id: string;
    item: string; // Código interno
    sku: string; // Código de barras/SKU
    descripcion: string;
    categoria: CategoriaItem; // New
    ubicacion: UbicacionItem; // New
    unidad: string;
    cantidad: number; // Stock Actual
    stockMinimo: number; // New
    valorUnitario: number; // Precio Base / Costo
    fechaCreacion: Date;
    tipo: 'SIMPLE' | 'COMPUESTO';
    materiales?: Material[]; // Si es compuesto
    // Financials
    costoMateriales: number; // New
    margenUtilidad: number; // New
    valorTotal: number; // Precio Venta Sugerido
    t1: number; // Lista de precios 1
    t2: number; // Lista de precios 2
    t3: number; // Lista de precios 3
}

export interface CotizacionItem {
    id: string;
    inventarioId: string;
    descripcion: string; // Snapshot of description
    cantidad: number;
    valorUnitario: number; // Snapshot of price
    valorTotal: number;
}

export type EstadoCotizacion = 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'PENDIENTE' | 'NO_APROBADA' | 'EN_EJECUCION' | 'FINALIZADA';
export type TipoOferta = 'NORMAL' | 'SIMPLIFICADA';

export interface Cotizacion {
    id: string;
    numero: string;
    tipo: TipoOferta; // New
    fecha: Date;
    clienteId: string;
    cliente: Cliente;
    descripcionTrabajo: string; // New
    items: CotizacionItem[];
    subtotal: number;
    aiuAdmin: number;  // New
    aiuImprevistos: number; // New
    aiuUtilidad: number; // New
    iva: number;
    total: number;
    estado: EstadoCotizacion;
}

// --- NEW ERP MODULES TYPES ---

// 1. FACTURACION
export type EstadoFactura = 'PENDIENTE' | 'PARCIAL' | 'CANCELADA';

export interface Factura {
    id: string; // Consecutivo DIAN opcional o interno
    cotizacionId: string;
    cotizacion: Cotizacion;
    fechaEmision: Date;
    fechaVencimiento: Date;
    valorFacturado: number;
    anticipoRecibido: number;
    retencionRenta: number;
    retencionIca: number;
    retencionIva: number;
    saldoPendiente: number;
    estado: EstadoFactura;
}

// 2. FINANCIERA
export type TipoCuenta = 'BANCO' | 'EFECTIVO' | 'CREDITO';

export interface CuentaBancaria {
    id: string;
    nombre: string;
    tipo: TipoCuenta;
    saldoActual: number;
    numeroCuenta?: string;
}

export type TipoMovimiento = 'INGRESO' | 'EGRESO';
export type CategoriaMovimiento = 'NOMINA' | 'PROVEEDORES' | 'SERVICIOS' | 'IMPUESTOS' | 'PRESTAMOS' | 'VENTAS' | 'OTROS';

export interface MovimientoFinanciero {
    id: string;
    fecha: Date;
    tipo: TipoMovimiento;
    cuentaId: string;
    cuenta: CuentaBancaria; // Relación
    categoria: CategoriaMovimiento;
    tercero: string; // Beneficiario o Pagador
    concepto: string;
    valor: number;
    ofertaId?: string; // Trazabilidad opcional
}

export interface ObligacionFinanciera {
    id: string;
    entidad: string;
    montoPrestado: number;
    tasaInteres: number; // % E.A. o M.V.
    plazoMeses: number;
    saldoCapital: number;
    valorCuota: number;
    fechaInicio: Date;
}

// 3. OPERACIONES (Inventario Movements extended)
export type TipoMovimientoInventario = 'ENTRADA' | 'SALIDA';

export interface MovimientoInventario {
    id: string;
    fecha: Date;
    tipo: TipoMovimientoInventario;
    articuloId: string;
    articulo: InventarioItem;
    cantidad: number;
    responsableId: string; // Empleado
    proyectoId?: string; // Oferta
}

// 4. SUMINISTRO
export type CategoriaProveedor = 'MATERIALES' | 'SERVICIOS' | 'MIXTO';

export interface Proveedor {
    id: string;
    nombre: string;
    nit: string;
    categoria: CategoriaProveedor;
    datosBancarios: string;
    correo: string;
}

export interface CuentaPorPagar {
    id: string;
    proveedorId: string;
    proveedor: Proveedor;
    numeroFacturaProveedor: string;
    fecha: Date;
    concepto: string;
    valorTotal: number;
    valorPagado: number;
    saldoPendiente: number;
    ofertaId?: string; // Costeo
}

// 5. ACTIVOS
export interface Vehiculo {
    id: string;
    placa: string;
    marcaModelo: string;
    conductorAsignado: string;
    vencimientoSoat: Date;
    vencimientoTecnomecanica: Date;
    vencimientoSeguro: Date;
}

export type TipoGastoVehiculo = 'COMBUSTIBLE' | 'PEAJE' | 'MANTENIMIENTO' | 'PARQUEADERO' | 'OTROS';

export interface GastoVehiculo {
    id: string;
    fecha: Date;
    vehiculoId: string;
    vehiculo: Vehiculo;
    tipo: TipoGastoVehiculo;
    kilometraje: number;
    valor: number;
    proveedor: string;
}

// 6. TALENTO HUMANO
export type EstadoEmpleado = 'ACTIVO' | 'INACTIVO';

export interface Empleado {
    id: string;
    nombreCompleto: string;
    cedula: string;
    cargo: string;
    salarioBase: number;
    fechaIngreso: Date;
    estado: EstadoEmpleado;
}

export type TipoNovedad = 'HORA_EXTRA_DIURNA' | 'HORA_EXTRA_NOCTURNA' | 'FESTIVA' | 'PRESTAMO' | 'AUSENCIA';

export interface NovedadNomina {
    id: string;
    empleadoId: string;
    fecha: Date;
    tipo: TipoNovedad;
    cantidad: number; // Horas o Valor
    valorCalculado: number;
}

export interface LiquidacionNomina {
    id: string;
    periodo: string; // "2024-01-Q1"
    empleadoId: string;
    empleado: Empleado;
    totalDevengado: number;
    totalDeducido: number;
    netoPagar: number;
    detalle: string; // JSON stringify data
}

// LEGACY / EXISTING REGISTROS (To keep compatibility if needed)
export interface Anticipo {
    id: string;
    fecha: Date;
    monto: number;
    observacion: string;
}

export interface RegistroObra {
    id: string;
    cotizacionId: string;
    cotizacion: Cotizacion;
    fechaInicio: Date;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADO';
    anticipos: Anticipo[];
    saldoPendiente: number;
    nombreObra: string;
    cliente: string;
    valorTotal: number;
}

// 7. DOTACIÓN
export interface DotacionItem {
    id: string;
    descripcion: string;
    talla: string;
    cantidadDisponible: number;
}

export interface EntregaDotacion {
    id: string;
    fecha: Date;
    empleadoId: string;
    empleado: Empleado;
    items: {
        dotacionId: string;
        descripcion: string;
        cantidad: number;
    }[];
    observacion: string;
}

// 8. CRÉDITOS
export interface CreditoEmpleado {
    id: string;
    empleadoId: string;
    empleado: Empleado;
    montoPrestado: number;
    plazoMeses: number;
    cuotaMensual: number;
    saldoPendiente: number;
    fechaOtorgado: Date;
    estado: 'ACTIVO' | 'PAGADO';
}

// 9. AGENDA
export type PrioridadTarea = 'ALTA' | 'MEDIA' | 'BAJA';
export type EstadoTarea = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA';

export interface TareaAgenda {
    id: string;
    titulo: string;
    descripcion: string;
    fechaVencimiento: Date;
    asignadoA?: string;
    prioridad: PrioridadTarea;
    estado: EstadoTarea;
}


// 10. ROLES Y PERMISOS
export interface Permission {
    id: string;
    modulo: string; // 'comercial', 'financiera', 'operaciones', etc.
    accion: 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar';
}

export interface Role {
    id: string;
    nombre: string;
    descripcion: string;
    permisos: Permission[];
    color: string; // For badge display
    isSystemRole: boolean; // Cannot be deleted if true
}

