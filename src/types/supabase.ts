// =============================================
// TIPOS TYPESCRIPT PARA SUPABASE - DMRE-ELECTRIC
// =============================================
// Generados manualmente basado en el schema SQL
// Para generar automáticamente usar:
// npx supabase gen types typescript --project-id default > src/types/supabase.ts
// =============================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// =============================================
// ENUMS
// =============================================
export type UserRole = 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'OPERATOR' | 'VIEWER'
export type TareaPrioridad = 'ALTA' | 'MEDIA' | 'BAJA'
export type TareaEstado = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA'
export type TrabajoEstado = 'COTIZADO' | 'APROBADO' | 'EN_EJECUCION' | 'PAUSADO' | 'FINALIZADO' | 'CANCELADO'
export type CotizacionEstado = 'BORRADOR' | 'PENDIENTE' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'EN_EJECUCION' | 'FINALIZADA'
export type CotizacionTipo = 'NORMAL' | 'SIMPLIFICADA'
export type FacturaEstado = 'BORRADOR' | 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA' | 'ANULADA'
export type CuentaTipo = 'BANCO' | 'EFECTIVO' | 'CREDITO'
export type MovimientoTipo = 'INGRESO' | 'EGRESO'
export type MovimientoCategoria = 'NOMINA' | 'PROVEEDORES' | 'SERVICIOS' | 'IMPUESTOS' | 'VENTAS' | 'ANTICIPOS' | 'OTROS'
export type InventarioCategoria = 'MATERIAL' | 'HERRAMIENTA' | 'DOTACION' | 'EPP' | 'EQUIPO'
export type InventarioUbicacion = 'BODEGA' | 'OBRA' | 'TRANSITO' | 'BAJA'
export type ProveedorCategoria = 'MATERIALES' | 'SERVICIOS' | 'MIXTO'
export type GastoVehiculoTipo = 'COMBUSTIBLE' | 'PEAJE' | 'MANTENIMIENTO' | 'PARQUEADERO' | 'LAVADO' | 'SEGURO' | 'OTROS'
export type AlertaTipo = 'STOCK_BAJO' | 'VENCIMIENTO_DOCUMENTO' | 'PAGO_PENDIENTE' | 'OTRO'
export type MovimientoInventarioTipo = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASLADO'
export type EntregaEstado = 'PENDIENTE' | 'ENTREGADO' | 'RECHAZADO'
export type EmpleadoEstado = 'ACTIVO' | 'INACTIVO' | 'LICENCIA' | 'VACACIONES' | 'RETIRADO'
export type NovedadTipo = 'HORA_EXTRA_DIURNA' | 'HORA_EXTRA_NOCTURNA' | 'HORA_EXTRA_FESTIVA' | 'RECARGO_NOCTURNO' | 'DOMINICAL' | 'PRESTAMO' | 'DESCUENTO' | 'AUXILIO' | 'AUSENCIA' | 'INCAPACIDAD' | 'LICENCIA' | 'OTRO'
export type LiquidacionTipo = 'DEFINITIVA' | 'PARCIAL' | 'VACACIONES'

// =============================================
// DATABASE INTERFACE
// =============================================
export interface Database {
    public: {
        Tables: {
            // Control y Sistema
            profiles: {
                Row: Profile
                Insert: ProfileInsert
                Update: ProfileUpdate
            }
            roles: {
                Row: Role
                Insert: RoleInsert
                Update: RoleUpdate
            }
            agenda: {
                Row: Agenda
                Insert: AgendaInsert
                Update: AgendaUpdate
            }
            // Gestión Comercial
            clientes: {
                Row: Cliente
                Insert: ClienteInsert
                Update: ClienteUpdate
            }
            trabajos: {
                Row: Trabajo
                Insert: TrabajoInsert
                Update: TrabajoUpdate
            }
            cotizaciones: {
                Row: Cotizacion
                Insert: CotizacionInsert
                Update: CotizacionUpdate
            }
            cotizacion_items: {
                Row: CotizacionItem
                Insert: CotizacionItemInsert
                Update: CotizacionItemUpdate
            }
            facturas: {
                Row: Factura
                Insert: FacturaInsert
                Update: FacturaUpdate
            }
            // Logística e Inventarios
            proveedores: {
                Row: Proveedor
                Insert: ProveedorInsert
                Update: ProveedorUpdate
            }
            inventario: {
                Row: Inventario
                Insert: InventarioInsert
                Update: InventarioUpdate
            }
            codigos_trabajo: {
                Row: CodigoTrabajo
                Insert: CodigoTrabajoInsert
                Update: CodigoTrabajoUpdate
            }
            materiales_asociados: {
                Row: MaterialAsociado
                Insert: MaterialAsociadoInsert
                Update: MaterialAsociadoUpdate
            }
            cuentas_por_pagar: {
                Row: CuentaPorPagar
                Insert: CuentaPorPagarInsert
                Update: CuentaPorPagarUpdate
            }
            dotacion_items: {
                Row: DotacionItem
                Insert: DotacionItemInsert
                Update: DotacionItemUpdate
            }
            dotacion_variantes: {
                Row: DotacionVariante
                Insert: DotacionVarianteInsert
                Update: DotacionVarianteUpdate
            }
            vehiculos: {
                Row: Vehiculo
                Insert: VehiculoInsert
                Update: VehiculoUpdate
            }
            gastos_vehiculos: {
                Row: GastoVehiculo
                Insert: GastoVehiculoInsert
                Update: GastoVehiculoUpdate
            }
            alertas_inventario: {
                Row: AlertaInventario
                Insert: AlertaInventarioInsert
                Update: AlertaInventarioUpdate
            }
            // Financiera
            cuentas_bancarias: {
                Row: CuentaBancaria
                Insert: CuentaBancariaInsert
                Update: CuentaBancariaUpdate
            }
            movimientos_financieros: {
                Row: MovimientoFinanciero
                Insert: MovimientoFinancieroInsert
                Update: MovimientoFinancieroUpdate
            }
            obligaciones_financieras: {
                Row: ObligacionFinanciera
                Insert: ObligacionFinancieraInsert
                Update: ObligacionFinancieraUpdate
            }
            // Operaciones
            registro_obras: {
                Row: RegistroObra
                Insert: RegistroObraInsert
                Update: RegistroObraUpdate
            }
            movimientos_inventario: {
                Row: MovimientoInventario
                Insert: MovimientoInventarioInsert
                Update: MovimientoInventarioUpdate
            }
            // Talento Humano
            empleados: {
                Row: Empleado
                Insert: EmpleadoInsert
                Update: EmpleadoUpdate
            }
            novedades_nomina: {
                Row: NovedadNomina
                Insert: NovedadNominaInsert
                Update: NovedadNominaUpdate
            }
            pagos_nomina: {
                Row: PagoNomina
                Insert: PagoNominaInsert
                Update: PagoNominaUpdate
            }
            liquidaciones: {
                Row: Liquidacion
                Insert: LiquidacionInsert
                Update: LiquidacionUpdate
            }
            creditos_empleados: {
                Row: CreditoEmpleado
                Insert: CreditoEmpleadoInsert
                Update: CreditoEmpleadoUpdate
            }
            entregas_dotacion: {
                Row: EntregaDotacion
                Insert: EntregaDotacionInsert
                Update: EntregaDotacionUpdate
            }
            entrega_dotacion_items: {
                Row: EntregaDotacionItem
                Insert: EntregaDotacionItemInsert
                Update: EntregaDotacionItemUpdate
            }
        }
    }
}

// =============================================
// CONTROL Y SISTEMA
// =============================================
export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    role: UserRole
    avatar_url: string | null
    phone: string | null
    settings: Json
    created_at: string
    updated_at: string
}
export type ProfileInsert = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>> & { id: string }
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>

export interface Role {
    id: string
    name: string
    description: string | null
    permissions: Json
    created_at: string
    updated_at: string
}
export type RoleInsert = Omit<Role, 'id' | 'created_at' | 'updated_at'>
export type RoleUpdate = Partial<RoleInsert>

export interface Agenda {
    id: string
    titulo: string
    descripcion: string | null
    fecha_vencimiento: string | null
    hora: string | null
    asignado_a: string | null
    creado_por: string | null
    prioridad: TareaPrioridad
    estado: TareaEstado
    etiquetas: string[] | null
    recordatorio: boolean
    created_at: string
    updated_at: string
}
export type AgendaInsert = Omit<Agenda, 'id' | 'created_at' | 'updated_at'>
export type AgendaUpdate = Partial<AgendaInsert>

// =============================================
// GESTIÓN COMERCIAL
// =============================================
export interface Cliente {
    id: string
    codigo: string | null
    nombre: string
    tipo_documento: string | null
    documento: string | null
    direccion: string | null
    ciudad: string | null
    correo: string | null
    telefono: string | null
    contacto_principal: string | null
    notas: string | null
    activo: boolean
    created_at: string
    updated_at: string
}
export type ClienteInsert = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>
export type ClienteUpdate = Partial<ClienteInsert>

export interface Trabajo {
    id: string
    codigo: string | null
    nombre: string
    cliente_id: string | null
    descripcion: string | null
    ubicacion: string | null
    direccion: string | null
    fecha_inicio: string | null
    fecha_fin_estimada: string | null
    fecha_fin_real: string | null
    estado: TrabajoEstado
    presupuesto: number
    costo_real: number
    responsable_id: string | null
    notas: string | null
    created_at: string
    updated_at: string
}
export type TrabajoInsert = Omit<Trabajo, 'id' | 'created_at' | 'updated_at'>
export type TrabajoUpdate = Partial<TrabajoInsert>

export interface Cotizacion {
    id: string
    numero: string | null
    tipo: CotizacionTipo
    fecha: string
    fecha_validez: string | null
    cliente_id: string | null
    trabajo_id: string | null
    descripcion_trabajo: string | null
    condiciones: string | null
    subtotal: number
    aiu_admin: number
    aiu_imprevistos: number
    aiu_utilidad: number
    valor_aiu: number
    iva_porcentaje: number
    iva: number
    total: number
    estado: CotizacionEstado
    creado_por: string | null
    aprobado_por: string | null
    fecha_aprobacion: string | null
    created_at: string
    updated_at: string
}
export type CotizacionInsert = Omit<Cotizacion, 'id' | 'created_at' | 'updated_at'>
export type CotizacionUpdate = Partial<CotizacionInsert>

export interface CotizacionItem {
    id: string
    cotizacion_id: string
    inventario_id: string | null
    codigo_trabajo_id: string | null
    item_numero: number | null
    descripcion: string
    unidad: string
    cantidad: number
    valor_unitario: number
    valor_total: number
    notas: string | null
    created_at: string
}
export type CotizacionItemInsert = Omit<CotizacionItem, 'id' | 'valor_total' | 'created_at'>
export type CotizacionItemUpdate = Partial<CotizacionItemInsert>

export interface Factura {
    id: string
    numero: string | null
    cotizacion_id: string | null
    trabajo_id: string | null
    cliente_id: string | null
    fecha_emision: string
    fecha_vencimiento: string | null
    subtotal: number
    iva: number
    valor_total: number
    anticipo_recibido: number
    retencion_fuente: number
    retencion_ica: number
    retencion_iva: number
    valor_pagado: number
    saldo_pendiente: number
    estado: FacturaEstado
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type FacturaInsert = Omit<Factura, 'id' | 'created_at' | 'updated_at'>
export type FacturaUpdate = Partial<FacturaInsert>

// =============================================
// LOGÍSTICA E INVENTARIOS
// =============================================
export interface Proveedor {
    id: string
    codigo: string | null
    nombre: string
    nit: string | null
    categoria: ProveedorCategoria
    direccion: string | null
    ciudad: string | null
    correo: string | null
    telefono: string | null
    contacto: string | null
    datos_bancarios: Json
    calificacion: number
    activo: boolean
    notas: string | null
    created_at: string
    updated_at: string
}
export type ProveedorInsert = Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>
export type ProveedorUpdate = Partial<ProveedorInsert>

export interface Inventario {
    id: string
    sku: string | null
    codigo: string | null
    nombre: string
    descripcion: string | null
    categoria: InventarioCategoria
    ubicacion: InventarioUbicacion
    unidad: string
    cantidad: number
    stock_minimo: number
    stock_maximo: number | null
    valor_unitario: number
    valor_total: number
    proveedor_id: string | null
    marca: string | null
    modelo: string | null
    imagen_url: string | null
    activo: boolean
    created_at: string
    updated_at: string
}
export type InventarioInsert = Omit<Inventario, 'id' | 'valor_total' | 'created_at' | 'updated_at'>
export type InventarioUpdate = Partial<InventarioInsert>

export interface CodigoTrabajo {
    id: string
    codigo: string
    nombre: string
    descripcion: string | null
    unidad: string
    mano_de_obra: number
    costo_materiales: number
    otros_costos: number
    costo_total: number
    precio_venta: number
    margen: number
    activo: boolean
    created_at: string
    updated_at: string
}
export type CodigoTrabajoInsert = Omit<CodigoTrabajo, 'id' | 'created_at' | 'updated_at'>
export type CodigoTrabajoUpdate = Partial<CodigoTrabajoInsert>

export interface MaterialAsociado {
    id: string
    codigo_trabajo_id: string
    inventario_id: string | null
    nombre: string | null
    descripcion: string | null
    unidad: string
    cantidad: number
    valor_unitario: number
    valor_total: number
    created_at: string
}
export type MaterialAsociadoInsert = Omit<MaterialAsociado, 'id' | 'valor_total' | 'created_at'>
export type MaterialAsociadoUpdate = Partial<MaterialAsociadoInsert>

export interface CuentaPorPagar {
    id: string
    proveedor_id: string
    numero_factura: string | null
    fecha_factura: string | null
    fecha_vencimiento: string | null
    concepto: string | null
    trabajo_id: string | null
    valor_total: number
    valor_pagado: number
    saldo_pendiente: number
    estado: FacturaEstado
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type CuentaPorPagarInsert = Omit<CuentaPorPagar, 'id' | 'saldo_pendiente' | 'created_at' | 'updated_at'>
export type CuentaPorPagarUpdate = Partial<CuentaPorPagarInsert>

export interface DotacionItem {
    id: string
    codigo: string | null
    descripcion: string
    categoria: string
    genero: string
    activo: boolean
    created_at: string
    updated_at: string
}
export type DotacionItemInsert = Omit<DotacionItem, 'id' | 'created_at' | 'updated_at'>
export type DotacionItemUpdate = Partial<DotacionItemInsert>

export interface DotacionVariante {
    id: string
    dotacion_id: string
    talla: string | null
    color: string | null
    cantidad_disponible: number
    cantidad_minima: number
    valor_unitario: number
    created_at: string
    updated_at: string
}
export type DotacionVarianteInsert = Omit<DotacionVariante, 'id' | 'created_at' | 'updated_at'>
export type DotacionVarianteUpdate = Partial<DotacionVarianteInsert>

export interface Vehiculo {
    id: string
    placa: string
    tipo: string | null
    marca: string | null
    modelo: string | null
    anno: number | null
    color: string | null
    conductor_asignado: string | null
    conductor_id: string | null
    vencimiento_soat: string | null
    vencimiento_tecnomecanica: string | null
    vencimiento_seguro: string | null
    vencimiento_licencia_transito: string | null
    kilometraje_actual: number
    estado: string
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type VehiculoInsert = Omit<Vehiculo, 'id' | 'created_at' | 'updated_at'>
export type VehiculoUpdate = Partial<VehiculoInsert>

export interface GastoVehiculo {
    id: string
    vehiculo_id: string
    fecha: string
    tipo: GastoVehiculoTipo
    descripcion: string | null
    kilometraje: number | null
    valor: number
    proveedor: string | null
    numero_factura: string | null
    responsable_id: string | null
    observaciones: string | null
    created_at: string
}
export type GastoVehiculoInsert = Omit<GastoVehiculo, 'id' | 'created_at'>
export type GastoVehiculoUpdate = Partial<GastoVehiculoInsert>

export interface AlertaInventario {
    id: string
    tipo: AlertaTipo
    entidad: string
    entidad_id: string | null
    mensaje: string
    umbral: number | null
    valor_actual: number | null
    activa: boolean
    leida: boolean
    fecha_generacion: string
    created_at: string
}
export type AlertaInventarioInsert = Omit<AlertaInventario, 'id' | 'created_at'>
export type AlertaInventarioUpdate = Partial<AlertaInventarioInsert>

// =============================================
// FINANCIERA
// =============================================
export interface CuentaBancaria {
    id: string
    nombre: string
    tipo: CuentaTipo
    banco: string | null
    numero_cuenta: string | null
    tipo_cuenta: string | null
    titular: string | null
    saldo_inicial: number
    saldo_actual: number
    activa: boolean
    principal: boolean
    notas: string | null
    created_at: string
    updated_at: string
}
export type CuentaBancariaInsert = Omit<CuentaBancaria, 'id' | 'created_at' | 'updated_at'>
export type CuentaBancariaUpdate = Partial<CuentaBancariaInsert>

export interface MovimientoFinanciero {
    id: string
    fecha: string
    tipo: MovimientoTipo
    cuenta_id: string | null
    categoria: MovimientoCategoria
    tercero: string | null
    concepto: string
    descripcion: string | null
    valor: number
    factura_id: string | null
    trabajo_id: string | null
    cuenta_por_pagar_id: string | null
    numero_documento: string | null
    comprobante_url: string | null
    registrado_por: string | null
    aprobado: boolean
    aprobado_por: string | null
    created_at: string
    updated_at: string
}
export type MovimientoFinancieroInsert = Omit<MovimientoFinanciero, 'id' | 'created_at' | 'updated_at'>
export type MovimientoFinancieroUpdate = Partial<MovimientoFinancieroInsert>

export interface ObligacionFinanciera {
    id: string
    tipo: string
    entidad: string
    descripcion: string | null
    monto_original: number
    tasa_interes: number
    plazo_meses: number | null
    fecha_inicio: string | null
    fecha_fin: string | null
    valor_cuota: number
    cuotas_pagadas: number
    saldo_capital: number | null
    estado: string
    cuenta_id: string | null
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type ObligacionFinancieraInsert = Omit<ObligacionFinanciera, 'id' | 'created_at' | 'updated_at'>
export type ObligacionFinancieraUpdate = Partial<ObligacionFinancieraInsert>

// =============================================
// OPERACIONES
// =============================================
export interface RegistroObra {
    id: string
    trabajo_id: string
    fecha: string
    descripcion: string
    tipo_actividad: string | null
    avance_porcentaje: number
    horas_trabajadas: number | null
    personal_cantidad: number | null
    clima: string | null
    condiciones: string | null
    materiales_usados: Json
    incidentes: string | null
    responsable_id: string | null
    fotos: string[] | null
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type RegistroObraInsert = Omit<RegistroObra, 'id' | 'created_at' | 'updated_at'>
export type RegistroObraUpdate = Partial<RegistroObraInsert>

export interface MovimientoInventario {
    id: string
    inventario_id: string
    tipo: MovimientoInventarioTipo
    cantidad: number
    cantidad_anterior: number | null
    cantidad_nueva: number | null
    trabajo_id: string | null
    origen: string | null
    destino: string | null
    numero_documento: string | null
    fecha: string
    responsable_id: string | null
    observacion: string | null
    created_at: string
}
export type MovimientoInventarioInsert = Omit<MovimientoInventario, 'id' | 'created_at'>
export type MovimientoInventarioUpdate = Partial<MovimientoInventarioInsert>

// =============================================
// TALENTO HUMANO
// =============================================
export interface Empleado {
    id: string
    codigo: string | null
    nombre_completo: string
    cedula: string | null
    tipo_documento: string
    fecha_nacimiento: string | null
    genero: string | null
    direccion: string | null
    ciudad: string | null
    telefono: string | null
    correo: string | null
    contacto_emergencia: string | null
    telefono_emergencia: string | null
    cargo: string | null
    area: string | null
    tipo_contrato: string
    fecha_ingreso: string | null
    fecha_retiro: string | null
    salario_base: number
    auxilio_transporte: boolean
    eps: string | null
    arl: string | null
    fondo_pensiones: string | null
    caja_compensacion: string | null
    banco: string | null
    tipo_cuenta_banco: string | null
    numero_cuenta_banco: string | null
    estado: EmpleadoEstado
    user_id: string | null
    foto_url: string | null
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type EmpleadoInsert = Omit<Empleado, 'id' | 'created_at' | 'updated_at'>
export type EmpleadoUpdate = Partial<EmpleadoInsert>

export interface NovedadNomina {
    id: string
    empleado_id: string
    periodo: string | null
    fecha: string
    tipo: NovedadTipo
    descripcion: string | null
    cantidad: number
    valor_unitario: number
    valor_total: number
    es_deduccion: boolean
    aprobada: boolean
    aprobado_por: string | null
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type NovedadNominaInsert = Omit<NovedadNomina, 'id' | 'created_at' | 'updated_at'>
export type NovedadNominaUpdate = Partial<NovedadNominaInsert>

export interface PagoNomina {
    id: string
    empleado_id: string
    periodo: string
    fecha_pago: string | null
    salario_base: number
    auxilio_transporte: number
    horas_extras: number
    recargos: number
    comisiones: number
    bonificaciones: number
    otros_devengados: number
    total_devengado: number
    salud: number
    pension: number
    fondo_solidaridad: number
    retencion_fuente: number
    prestamos: number
    otros_descuentos: number
    total_deducido: number
    neto_pagar: number
    estado: string
    pagado: boolean
    fecha_real_pago: string | null
    cuenta_id: string | null
    detalles: Json
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type PagoNominaInsert = Omit<PagoNomina, 'id' | 'created_at' | 'updated_at'>
export type PagoNominaUpdate = Partial<PagoNominaInsert>

export interface Liquidacion {
    id: string
    empleado_id: string
    tipo: LiquidacionTipo
    fecha_liquidacion: string
    fecha_inicio_periodo: string | null
    fecha_fin_periodo: string | null
    dias_trabajados: number
    salario_promedio: number
    cesantias: number
    intereses_cesantias: number
    prima: number
    vacaciones: number
    indemnizacion: number
    otros_conceptos: number
    total_liquidacion: number
    deducciones: number
    neto_pagar: number
    estado: string
    pagada: boolean
    fecha_pago: string | null
    detalles: Json
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type LiquidacionInsert = Omit<Liquidacion, 'id' | 'created_at' | 'updated_at'>
export type LiquidacionUpdate = Partial<LiquidacionInsert>

export interface CreditoEmpleado {
    id: string
    empleado_id: string
    tipo: string
    concepto: string | null
    monto_solicitado: number
    monto_aprobado: number | null
    plazo_meses: number | null
    cuota_mensual: number
    cuotas_pagadas: number
    saldo_pendiente: number | null
    fecha_solicitud: string
    fecha_aprobacion: string | null
    fecha_inicio_descuento: string | null
    estado: string
    aprobado_por: string | null
    observaciones: string | null
    created_at: string
    updated_at: string
}
export type CreditoEmpleadoInsert = Omit<CreditoEmpleado, 'id' | 'created_at' | 'updated_at'>
export type CreditoEmpleadoUpdate = Partial<CreditoEmpleadoInsert>

export interface EntregaDotacion {
    id: string
    empleado_id: string
    fecha: string
    estado: EntregaEstado
    fecha_entrega: string | null
    fecha_aceptacion: string | null
    entregado_por: string | null
    observaciones: string | null
    firma_url: string | null
    created_at: string
    updated_at: string
}
export type EntregaDotacionInsert = Omit<EntregaDotacion, 'id' | 'created_at' | 'updated_at'>
export type EntregaDotacionUpdate = Partial<EntregaDotacionInsert>

export interface EntregaDotacionItem {
    id: string
    entrega_id: string
    dotacion_id: string | null
    variante_id: string | null
    cantidad: number
    talla: string | null
    color: string | null
    observacion: string | null
    created_at: string
}
export type EntregaDotacionItemInsert = Omit<EntregaDotacionItem, 'id' | 'created_at'>
export type EntregaDotacionItemUpdate = Partial<EntregaDotacionItemInsert>
