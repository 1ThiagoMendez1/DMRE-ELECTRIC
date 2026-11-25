import type { CategoriaMovimiento } from "@/types/sistema";

/** Listado acordado en la revisión de Financiera, con compatibilidad para movimientos existentes. */
export const FINANCE_CATEGORIES: { value: CategoriaMovimiento; label: string }[] = [
    {value:"VENTAS",label:"Ventas"},
    {value:"NOMINA",label:"Nómina"},
    {value:"PROVEEDORES",label:"Proveedores"},
    {value:"SEGUROS_POLIZAS",label:"Seguros y pólizas"},
    {value:"MAQUINARIA_EQUIPOS",label:"Maquinaria y equipos"},
    {value:"HERRAMIENTA",label:"Herramienta"},
    {value:"MATERIALES",label:"Materiales"},
    {value:"SERVICIOS",label:"Servicios"},
    {value:"MANO_OBRA",label:"Mano de obra"},
    {value:"TRANSPORTE",label:"Transporte"},
    {value:"ADMINISTRACION",label:"Administración / Oficina"},
    {value:"CAJA_MENOR",label:"Caja menor"},
    {value:"IMPREVISTOS",label:"Imprevistos"},
    {value:"IMPUESTOS",label:"Impuestos"},
    {value:"SUMINISTRO",label:"Suministro"},
    {value:"INSTALACION",label:"Instalación"},
    {value:"PRESTAMOS",label:"Préstamos"},
    {value:"OTROS",label:"Otros"},
];

export const FINANCE_DB_CATEGORIES = new Set<string>([
    "VENTAS","NOMINA","PROVEEDORES","SERVICIOS","IMPUESTOS","PRESTAMOS","INSTALACION","SUMINISTRO","OTROS"
]);

export function financeCategoryLabel(value: string | undefined): string {
    return FINANCE_CATEGORIES.find(c=>c.value===value)?.label || value || "Sin categoría";
}
