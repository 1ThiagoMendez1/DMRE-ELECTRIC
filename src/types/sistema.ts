export type UserRole = 'ADMIN' | 'ENGINEER' | 'CLIENT' | 'VIEWER';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    sidebarAccess?: string[];
    isActive?: boolean;
}

// --- SHARED / EXISTING ---
// Retaining original types to avoid breaking existing modules if they were used there.
// User said "don't modify existing", so we assume existing code relies on some of these.

export interface Cliente {
    id: string;
    codigo?: string; // New: optional or auto-generated
    nombre: string;
    documento: string; // NIT or CC
    direccion: string;
    ciudad?: string;
    correo: string;
    telefono: string;
    contactoPrincipal: string; // New
    notas?: string;
    fechaCreacion: Date;
}

export interface Material {
    id: string;
    inventarioId: string; // Link to source item
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
    categoria: CategoriaItem;
    ubicacion: UbicacionItem;
    unidad: string;
    cantidad: number; // Stock Actual
    stockMinimo: number;
    valorUnitario: number; // Precio Base / Costo
    fechaCreacion: Date;
    tipo: 'SIMPLE' | 'COMPUESTO';
    materiales?: Material[]; // Si es compuesto
    // Financials
    costoMateriales: number; // Deprecated: Use precioProveedor instead
    precioProveedor: number; // New explicit column
    margenUtilidad: number;
    valorTotal: number; // Precio Venta Sugerido
    proveedorId?: string; // Link to primary supplier
    t1: number; // Lista de precios 1
    t2: number; // Lista de precios 2
    t3: number; // Lista de precios 3
    // Extended DB fields
    nombre?: string;
    marca?: string;
    modelo?: string;
    notas?: string;
    imagenUrl?: string;
    activo?: boolean;
}

export interface CotizacionItem {
    id: string;
    inventarioId?: string;
    codigoTrabajoId?: string;
    tipo: 'PRODUCTO' | 'SERVICIO'; // New: Distinguish between simple products and work codes
    descripcion: string; // Snapshot of description
    cantidad: number;
    valorUnitario: number; // Snapshot of price
    valorTotal: number;

    // New fields for extended functionality
    descuentoValor?: number;
    descuentoPorcentaje?: number; // 0-100
    impuesto?: number; // % IVA, e.g., 19
    ocultarDetalles?: boolean; // If true, only show total for this item
    subItems?: MaterialAsociado[]; // Expanded materials for Work Codes

    // AIU & Costing Fields
    costoUnitario?: number; // Precio Proveedor
    aiuAdminPorcentaje?: number;
    aiuImprevistoPorcentaje?: number;
    aiuUtilidadPorcentaje?: number;
    ivaUtilidadPorcentaje?: number; // IVA specific to Utility portion
    // Extended
    notas?: string;
}

export type EstadoCotizacion = 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'PENDIENTE' | 'NO_APROBADA' | 'EN_EJECUCION' | 'FINALIZADA';
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
    descuentoGlobal?: number; // New: Global Discount Amount
    descuentoGlobalPorcentaje?: number; // New: Global Discount %
    impuestoGlobalPorcentaje?: number; // New: Global Tax % (e.g. 19)

    // Global AIU Defaults
    aiuAdminGlobalPorcentaje?: number;
    aiuImprevistoGlobalPorcentaje?: number;
    aiuUtilidadGlobalPorcentaje?: number;
    ivaUtilidadGlobalPorcentaje?: number;

    aiuAdmin: number;  // Calculated Amount
    aiuImprevistos: number; // Calculated Amount
    aiuUtilidad: number; // Calculated Amount
    iva: number;
    total: number;
    estado: EstadoCotizacion;
    fechaActualizacion?: Date;
    evidencia?: EvidenciaTrabajo[];
    comentarios?: ComentarioCotizacion[];

    // Job Execution Fields
    direccionProyecto?: string;
    ubicacion?: Ubicacion;
    fechaInicio?: Date;
    fechaFinEstimada?: Date;
    fechaFinReal?: Date;
    costoReal?: number;
    responsableId?: string;
    progreso?: number; // New: Percentage 0-100
    notas?: string; // New: General notes for the quotation/job
    historial?: HistorialCotizacion[]; // New: Persistent history
}

export interface HistorialCotizacion {
    id: string;
    cotizacionId: string;
    fecha: Date;
    usuarioId?: string;
    usuarioNombre?: string;
    tipo: 'CREACION' | 'ESTADO' | 'PROGRESO' | 'EDICION' | 'NOTA' | 'ITEM_AGREGADO' | 'ITEM_OCULTO' | 'ITEM_ELIMINADO' | 'UBICACION' | 'FOTO' | 'VIDEO';
    descripcion: string;
    valorAnterior?: string;
    valorNuevo?: string;
    metadata?: Record<string, any>; // For location {lat, lng}, photos {url, type}, etc.
}

export interface Ubicacion {
    lat: number;
    lng: number;
    precision?: number;
    timestamp: number;
}

export interface EvidenciaTrabajo {
    id: string;
    fecha: Date;
    usuarioId: string;
    usuarioNombre: string;
    tipo: 'FOTO' | 'VIDEO' | 'NOTA' | 'UBICACION';
    url?: string; // URL simulada para fotos/videos
    descripcion?: string;
    ubicacion?: Ubicacion; // Georreferenciación de la evidencia
}

export interface ComentarioCotizacion {
    id: string;
    fecha: Date;
    autor: string; // "Cliente" or "DMRE"
    mensaje: string;
    leido: boolean;
}

// --- NEW ERP MODULES TYPES ---

// 1. FACTURACION
export type EstadoFactura = 'BORRADOR' | 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA' | 'ANULADA';

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
    // Extended DB fields
    numero?: string;
    trabajoId?: string;
    clienteId?: string;
    subtotal?: number;
    iva?: number;
    valorPagado?: number;
    observaciones?: string;
}

// 2. FINANCIERA
export type TipoCuenta = 'BANCO' | 'EFECTIVO' | 'CREDITO';

export interface CuentaBancaria {
    id: string;
    nombre: string;
    tipo: TipoCuenta;
    banco?: string;
    numeroCuenta?: string;
    tipoCuenta?: string; // AHORROS, CORRIENTE
    titular?: string;
    saldoInicial?: number;
    saldoActual: number;
    activa?: boolean;
    principal?: boolean;
    notas?: string;
}

export type TipoMovimiento = 'INGRESO' | 'EGRESO';
export type CategoriaMovimiento = 'NOMINA' | 'PROVEEDORES' | 'SERVICIOS' | 'IMPUESTOS' | 'PRESTAMOS' | 'VENTAS' | 'OTROS';

export interface MovimientoFinanciero {
    id: string;
    fecha: Date;
    tipo: TipoMovimiento;
    cuentaId: string;
    cuenta?: Partial<CuentaBancaria>; // Relation
    categoria: CategoriaMovimiento;
    tercero?: string;
    concepto?: string;
    descripcion?: string;
    valor: number;
    // Foreign Keys
    facturaId?: string;
    trabajoId?: string;
    cuentaPorPagarId?: string;
    // Documents
    numeroDocumento?: string;
    comprobanteUrl?: string;
    // Audit
    registradoPor?: string;
    aprobado?: boolean;
    aprobadoPor?: string;
}

export type TipoObligacion = 'PRESTAMO' | 'LEASING' | 'TARJETA_CREDITO' | 'OTRO';
export type EstadoObligacion = 'ACTIVO' | 'PAGADO' | 'MORA' | 'CANCELADO';

export interface ObligacionFinanciera {
    id: string;
    tipo?: TipoObligacion;
    entidad: string;
    descripcion?: string;
    montoPrestado: number;
    tasaInteres: number;
    plazoMeses: number;
    fechaInicio: Date;
    fechaFin?: Date;
    valorCuota: number;
    cuotasPagadas?: number;
    saldoCapital: number;
    estado?: EstadoObligacion;
    cuentaId?: string;
    observaciones?: string;
    pagos?: PagoObligacion[];
}

export interface PagoObligacion {
    id: string;
    fecha: Date;
    valor: number;
    interes?: number;
    capital?: number;
    saldoRestante: number;
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
    // Extended DB fields
    codigo?: string;
    direccion?: string;
    ciudad?: string;
    telefono?: string;
    contacto?: string;
    calificacion?: number;
    activo?: boolean;
    notas?: string;
}

export interface PagoCuentaPorPagar {
    id: string;
    cuentaPorPagarId: string;
    fecha: Date;
    valor: number;
    metodoPago?: string;
    cuentaBancariaId?: string;
    nota?: string;
    referenciaBancaria?: string;
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
    pagos?: PagoCuentaPorPagar[];
    ofertaId?: string; // Costeo
    ordenCompraId?: string; // Link to PO
    // Extended DB fields
    fechaVencimiento?: Date;
    estado?: string;
    observaciones?: string;
}

export type EstadoOrdenCompra = 'PENDIENTE' | 'ENVIADA' | 'PARCIAL' | 'RECIBIDA' | 'CANCELADA';

export interface DetalleCompra {
    id: string;
    ordenCompraId: string;
    inventarioId: string;
    descripcion: string;
    cantidad: number;
    valorUnitario: number; // Historical price
    subtotal: number;
    recibido: number; // Quantity received so far
}

export interface OrdenCompra {
    id: string;
    numero: string; // OC-001
    proveedorId: string;
    proveedor: Proveedor;
    fechaEmision: Date;
    fechaEntregaEstimada?: Date;
    items: DetalleCompra[];
    subtotal: number;
    impuestos: number;
    total: number;
    estado: EstadoOrdenCompra;
    observaciones?: string;
}

// 5. ACTIVOS
export type EstadoVehiculo = 'OPERATIVO' | 'MANTENIMIENTO' | 'INACTIVO';

export interface Vehiculo {
    id: string;
    placa: string;
    marcaModelo: string;
    conductorAsignado: string;
    vencimientoSoat: Date;
    vencimientoTecnomecanica: Date;
    vencimientoSeguro: Date;
    estado: EstadoVehiculo;
    kilometrajeActual: number;
    ano: number;
    color: string;
    fechaRegistro?: Date;
    // Extended DB fields
    tipo?: string;
    marca?: string;
    modelo?: string;
    conductorId?: string;
    vencimientoLicenciaTransito?: Date;
    observaciones?: string;
    archivos?: { name: string; url: string; category?: string; date: Date }[];
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
    galones?: number;
    precioPorGalon?: number;
    soporteUrl?: string; // Receipt URL (already exists in DB as comprobante_url)
    observacion?: string;
    // Extended DB fields
    descripcion?: string;
    numeroFactura?: string;
    responsableId?: string;
    observaciones?: string;
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
    // Extended DB fields
    codigo?: string;
    tipoDocumento?: string;
    fechaNacimiento?: Date;
    genero?: string;
    direccion?: string;
    ciudad?: string;
    telefono?: string;
    correo?: string;
    contactoEmergencia?: string;
    telefonoEmergencia?: string;
    area?: string;
    tipoContrato?: string;
    fechaRetiro?: Date;
    auxilioTransporte?: boolean;
    eps?: string;
    arl?: string;
    fondoPensiones?: string;
    cajaCompensacion?: string;
    banco?: string;
    tipoCuentaBanco?: string;
    numeroCuentaBanco?: string;
    fotoUrl?: string;
    observaciones?: string;
    archivos?: { name: string; url: string; date: Date; type: string }[];
}

export type TipoNovedad = 'HORA_EXTRA_DIURNA' | 'HORA_EXTRA_NOCTURNA' | 'FESTIVA' | 'PRESTAMO' | 'AUSENCIA';

export interface NovedadNomina {
    id: string;
    empleadoId: string;
    empleado?: Empleado; // Optional because in some views we might just have the ID
    fecha: Date;
    tipo: TipoNovedad;
    cantidad: number; // Horas o Valor
    valorUnitario: number; // Valor por hora/día
    valorCalculado?: number;
    efecto?: 'SUMA' | 'RESTA';
    // Extended DB fields
    valorTotal?: number;
    estado?: string;
    observaciones?: string; // Renamed from observacion to match DB
    descripcion?: string; // Added as per DB schema
}

export interface LiquidacionNomina {
    id: string;
    periodo: string; // "2024-01-Q1"
    empleadoId: string;
    empleado: Empleado;
    totalDevengado: number;
    totalDeducido: number;
    netoPagar: number;
    estado: 'PENDIENTE' | 'PAGADO';
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
export interface DotacionVariant {
    id: string;
    talla: string;
    color: string;
    cantidadDisponible: number;
}

export interface DotacionItem {
    id: string;
    descripcion: string;
    categoria: 'UNIFORME' | 'EPP' | 'HERRAMIENTA';
    genero: 'HOMBRE' | 'MUJER' | 'UNISEX';
    variantes: DotacionVariant[];
    stockMinimo?: number;
    fechaVencimiento?: Date;
    // Extended DB fields
    codigo?: string;
    activo?: boolean;
    // Legacy fields for frontend compatibility
    talla?: string;
    color?: string;
    cantidadDisponible?: number;
}

export interface EntregaDotacionItem {
    dotacionId: string;
    varianteId: string;
    descripcion: string;
    detalle: string; // "Talla M - Color Azul"
    cantidad: number;
}

export type EstadoEntregaDotacion = 'ASIGNADO' | 'ACEPTADO' | 'ENTREGADO' | 'RECHAZADO' | 'DEVUELTO';

export interface EntregaDotacion {
    id: string;
    fecha: Date;                    // Fecha de asignación
    empleadoId: string;
    empleado: Empleado;
    items: EntregaDotacionItem[];
    estado: EstadoEntregaDotacion;
    usuarioAsigna?: string;         // Quien asignó
    fechaAceptacion?: Date;         // Cuando el empleado aceptó
    usuarioConfirma?: string;       // Quien confirmó entrega
    fechaEntrega?: Date;            // Cuando se hizo la entrega física
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
    estado: 'ACTIVO' | 'PAGADO' | 'PENDIENTE';
    // Extended DB fields
    tipo?: string;
    concepto?: string;
    montoSolicitado?: number;
    cuotasPagadas?: number;
    fechaSolicitud?: Date;
    fechaInicioDescuento?: Date;
    observaciones?: string;
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
    // Extended DB fields
    hora?: string;
    asignadoNombre?: string; // For UI display
    creadoPor?: string;
    etiquetas?: string[];
    recordatorio?: boolean;
}


// 10. ROLES Y PERMISOS
// 10. ROLES Y PERMISOS
export interface Permission {
    id: string;
    name: string;
    module: string;
    description?: string;
}

export interface RolePermission {
    id: string; // Pivot ID
    roleId?: string; // If using roles table
    roleName: string; // If using string enum roles
    permissionId: string;
    permission: Permission;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: RolePermission[];
    isActive?: boolean; // New from profile update
}

// 11. CÓDIGOS DE TRABAJO
export interface MaterialAsociado {
    id: string;
    inventarioId?: string; // Reference to InventarioItem
    subCodigoId?: string; // Reference to another CodigoTrabajo (Nested APU)
    nombre: string;
    cantidad: number;
    valorUnitario: number;
}

export interface CodigoTrabajo {
    id: string;
    codigo: string; // COD-001
    nombre: string;
    descripcion: string;
    manoDeObra: number;
    valorManoObra?: number; // Alias for consistency with new components
    materiales: MaterialAsociado[];
    costoTotalMateriales: number;
    costoTotal: number; // manoDeObra + costoTotalMateriales
    fechaCreacion: Date;
}
