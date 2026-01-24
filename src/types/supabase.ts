export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            clientes: {
                Row: {
                    id: string
                    codigo: string | null
                    nombre: string
                    documento: string | null
                    direccion: string | null
                    correo: string | null
                    telefono: string | null
                    contacto_principal: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    codigo?: string | null
                    nombre: string
                    documento?: string | null
                    direccion?: string | null
                    correo?: string | null
                    telefono?: string | null
                    contacto_principal?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    codigo?: string | null
                    nombre?: string
                    documento?: string | null
                    direccion?: string | null
                    correo?: string | null
                    telefono?: string | null
                    contacto_principal?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            cotizaciones: {
                Row: {
                    id: string
                    numero: string | null
                    tipo: 'NORMAL' | 'SIMPLIFICADA' | null
                    fecha: string | null
                    cliente_id: string | null
                    descripcion_trabajo: string | null
                    subtotal: number
                    aiu_admin: number
                    aiu_imprevistos: number
                    aiu_utilidad: number
                    iva: number
                    total: number
                    estado: 'PENDIENTE' | 'APROBADA' | 'NO_APROBADA' | 'EN_EJECUCION' | 'FINALIZADA' | 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'RECHAZADA' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    numero?: string | null
                    tipo?: 'NORMAL' | 'SIMPLIFICADA' | null
                    fecha?: string | null
                    cliente_id?: string | null
                    descripcion_trabajo?: string | null
                    subtotal?: number
                    aiu_admin?: number
                    aiu_imprevistos?: number
                    aiu_utilidad?: number
                    iva?: number
                    total?: number
                    estado?: 'PENDIENTE' | 'APROBADA' | 'NO_APROBADA' | 'EN_EJECUCION' | 'FINALIZADA' | 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'RECHAZADA' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    numero?: string | null
                    tipo?: 'NORMAL' | 'SIMPLIFICADA' | null
                    fecha?: string | null
                    cliente_id?: string | null
                    descripcion_trabajo?: string | null
                    subtotal?: number
                    aiu_admin?: number
                    aiu_imprevistos?: number
                    aiu_utilidad?: number
                    iva?: number
                    total?: number
                    estado?: 'PENDIENTE' | 'APROBADA' | 'NO_APROBADA' | 'EN_EJECUCION' | 'FINALIZADA' | 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'RECHAZADA' | null
                    created_at?: string
                }
            }
            inventario: {
                Row: {
                    id: string
                    sku: string | null
                    item: string | null
                    descripcion: string
                    categoria: 'MATERIAL' | 'HERRAMIENTA' | 'DOTACION' | 'EPP' | null
                    ubicacion: 'BODEGA' | 'OBRA' | null
                    unidad: string | null
                    cantidad: number
                    stock_minimo: number
                    valor_unitario: number
                    valor_total: number | null
                    tipo: 'SIMPLE' | 'COMPUESTO' | null
                    costo_materiales: number | null
                    margen_utilidad: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    sku?: string | null
                    item?: string | null
                    descripcion: string
                    categoria?: 'MATERIAL' | 'HERRAMIENTA' | 'DOTACION' | 'EPP' | null
                    ubicacion?: 'BODEGA' | 'OBRA' | null
                    unidad?: string | null
                    cantidad?: number
                    stock_minimo?: number
                    valor_unitario?: number
                    tipo?: 'SIMPLE' | 'COMPUESTO' | null
                    costo_materiales?: number | null
                    margen_utilidad?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    sku?: string | null
                    item?: string | null
                    descripcion?: string
                    categoria?: 'MATERIAL' | 'HERRAMIENTA' | 'DOTACION' | 'EPP' | null
                    ubicacion?: 'BODEGA' | 'OBRA' | null
                    unidad?: string | null
                    cantidad?: number
                    stock_minimo?: number
                    valor_unitario?: number
                    tipo?: 'SIMPLE' | 'COMPUESTO' | null
                    costo_materiales?: number | null
                    margen_utilidad?: number | null
                    created_at?: string
                }
            }
            cotizacion_items: {
                Row: {
                    id: string
                    cotizacion_id: string | null
                    inventario_id: string | null
                    descripcion: string | null
                    cantidad: number
                    valor_unitario: number
                    valor_total: number | null
                }
                Insert: {
                    id?: string
                    cotizacion_id?: string | null
                    inventario_id?: string | null
                    descripcion?: string | null
                    cantidad?: number
                    valor_unitario?: number
                }
                Update: {
                    id?: string
                    cotizacion_id?: string | null
                    inventario_id?: string | null
                    descripcion?: string | null
                    cantidad?: number
                    valor_unitario?: number
                }
            }
            facturas: {
                Row: {
                    id: string
                    numero: string | null
                    cotizacion_id: string | null
                    fecha_emision: string | null
                    fecha_vencimiento: string | null
                    valor_facturado: number
                    anticipo_recibido: number
                    retencion_renta: number
                    retencion_ica: number
                    retencion_iva: number
                    saldo_pendiente: number
                    estado: 'PENDIENTE' | 'PARCIAL' | 'CANCELADA' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    numero?: string | null
                    cotizacion_id?: string | null
                    fecha_emision?: string | null
                    fecha_vencimiento?: string | null
                    valor_facturado?: number
                    anticipo_recibido?: number
                    retencion_renta?: number
                    retencion_ica?: number
                    retencion_iva?: number
                    saldo_pendiente?: number
                    estado?: 'PENDIENTE' | 'PARCIAL' | 'CANCELADA' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    numero?: string | null
                    cotizacion_id?: string | null
                    fecha_emision?: string | null
                    fecha_vencimiento?: string | null
                    valor_facturado?: number
                    anticipo_recibido?: number
                    retencion_renta?: number
                    retencion_ica?: number
                    retencion_iva?: number
                    saldo_pendiente?: number
                    estado?: 'PENDIENTE' | 'PARCIAL' | 'CANCELADA' | null
                    created_at?: string
                }
            }
            proveedores: {
                Row: {
                    id: string
                    nombre: string
                    nit: string | null
                    categoria: 'MATERIALES' | 'SERVICIOS' | 'MIXTO' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    nombre: string
                    nit?: string | null
                    categoria?: 'MATERIALES' | 'SERVICIOS' | 'MIXTO' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    nombre?: string
                    nit?: string | null
                    categoria?: 'MATERIALES' | 'SERVICIOS' | 'MIXTO' | null
                    created_at?: string
                }
            }
            empleados: {
                Row: {
                    id: string
                    nombre_completo: string
                    cedula: string | null
                    cargo: string | null
                    salario_base: number
                    fecha_ingreso: string | null
                    estado: 'ACTIVO' | 'INACTIVO' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    nombre_completo: string
                    cedula?: string | null
                    cargo?: string | null
                    salario_base?: number
                    fecha_ingreso?: string | null
                    estado?: 'ACTIVO' | 'INACTIVO' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    nombre_completo?: string
                    cedula?: string | null
                    cargo?: string | null
                    salario_base?: number
                    fecha_ingreso?: string | null
                    estado?: 'ACTIVO' | 'INACTIVO' | null
                    created_at?: string
                }
            }
            vehiculos: {
                Row: {
                    id: string
                    placa: string | null
                    marca_modelo: string | null
                    conductor_asignado: string | null
                    created_at: string
                }
            }
            gastos_vehiculos: {
                Row: {
                    id: string
                    vehiculo_id: string | null
                    fecha: string | null
                    tipo: 'COMBUSTIBLE' | 'PEAJE' | 'MANTENIMIENTO' | 'PARQUEADERO' | 'OTROS' | null
                    valor: number
                    proveedor: string | null
                }
            }
            novedades_nomina: {
                Row: {
                    id: string
                    empleado_id: string | null
                    fecha: string | null
                    tipo: 'HORA_EXTRA_DIURNA' | 'HORA_EXTRA_NOCTURNA' | 'FESTIVA' | 'PRESTAMO' | 'AUSENCIA' | null
                    cantidad: number
                    valor_calculado: number
                }
            }
            agenda: {
                Row: {
                    id: string
                    titulo: string
                    descripcion: string | null
                    fecha_vencimiento: string | null
                    prioridad: 'ALTA' | 'MEDIA' | 'BAJA' | null
                    estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | null
                    created_at: string
                }
            }
        }
    }
}
