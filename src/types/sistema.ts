export interface Cliente {
    id: string;
    nombre: string;
    documento: string;
    direccion: string;
    correo: string;
    telefono: string;
}

export interface Material {
    id: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    valorUnitario: number;
    valorTotal: number;
}

export interface InventarioItem {
    id: string;
    item: string; // Codigo o identificador visual "ITEM"
    descripcion: string;
    unidad: string;
    cantidad: number; // Existencias actuales
    tipo: 'SIMPLE' | 'COMPUESTO';

    // Para items simples
    materiales?: Material[]; // Si es simple, puede tener 1 material autogenerado o ninguno explicito si se usa la lógica simple

    // Costos y Precios
    costoMateriales: number; // Sumatoría de materiales
    margenUtilidad: number; // Por defecto 20%
    valorTotal: number; // Costo + margen
    valorUnitario: number; // Precio final unitario

    // Tarifas adicionales (segun excel)
    t1?: number;
    t2?: number;
    t3?: number;
}

export interface CotizacionItem {
    id: string;
    inventarioId: string;
    descripcion: string; // Copia de inventario o personalizada
    cantidad: number;
    valorUnitario: number;
    valorTotal: number;
}

export interface Cotizacion {
    id: string;
    numero: string; // Consecutivo
    fecha: Date;
    clienteId: string;
    cliente: Cliente; // Snapshot del cliente
    items: CotizacionItem[];
    subtotal: number;
    iva: number; // Calculado
    total: number;
    estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA';
}

export interface RegistroAnticipo {
    id: string;
    fecha: Date;
    monto: number;
    observacion?: string;
}

export interface RegistroObra {
    id: string;
    cotizacionId: string;
    cotizacion: Cotizacion;
    fechaInicio: Date;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADO';
    anticipos: RegistroAnticipo[];
    saldoPendiente: number;
    nombreObra: string;
    cliente?: string; // Nombre del cliente flat
}
