"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { LiquidacionNomina } from "@/types/sistema";
import { Printer, Building2 } from "lucide-react";

interface PayrollDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nomina: LiquidacionNomina | null;
}

// Colombian Payroll Constants (2024)
const SMLMV_2024 = 1300000; // Salario Mínimo
const SALUD_PORCENTAJE = 0.04; // 4% Empleado
const PENSION_PORCENTAJE = 0.04; // 4% Empleado
const FSP_PORCENTAJE = 0.01; // Fondo Solidaridad (> 4 SMLMV)

export function PayrollDetailDialog({ open, onOpenChange, nomina }: PayrollDetailDialogProps) {
    if (!nomina) return null;

    // Parse details from JSON
    let detalles = { base: 0, extras: 0, novedades: [] as any[] };
    try {
        detalles = JSON.parse(nomina.detalle);
    } catch (e) {
        detalles.base = nomina.empleado.salarioBase;
    }

    const baseSalary = detalles.base || nomina.empleado.salarioBase;

    // Calculate Colombian Deductions
    const ibc = baseSalary; // Ingreso Base de Cotización (simplified)
    const deduccionSalud = Math.round(ibc * SALUD_PORCENTAJE);
    const deduccionPension = Math.round(ibc * PENSION_PORCENTAJE);
    const deduccionFSP = ibc > (SMLMV_2024 * 4) ? Math.round(ibc * FSP_PORCENTAJE) : 0;

    // Get novedades deductions
    const novedadesDeduccion = detalles.novedades?.filter((n: any) => n.efecto === 'RESTA').reduce((acc: number, n: any) => acc + n.valor, 0) || 0;
    const novedadesAdicion = detalles.novedades?.filter((n: any) => n.efecto === 'SUMA').reduce((acc: number, n: any) => acc + n.valor, 0) || 0;

    const totalDevengado = baseSalary + novedadesAdicion;
    const totalDeducciones = deduccionSalud + deduccionPension + deduccionFSP + novedadesDeduccion;
    const netoPagar = totalDevengado - totalDeducciones;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[700px] max-h-[90vh] overflow-auto print:max-w-full print:shadow-none">
                <DialogHeader className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                DMRE ELECTRIC S.A.S
                            </DialogTitle>
                            <DialogDescription>
                                NIT: 901.XXX.XXX-X | Calle XX # XX-XX, Bogotá
                            </DialogDescription>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-bold">COMPROBANTE DE PAGO</p>
                            <p className="text-muted-foreground">Periodo: {nomina.periodo}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4 text-sm">
                    {/* Employee Info */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                        <div>
                            <p className="text-muted-foreground text-xs">EMPLEADO</p>
                            <p className="font-bold">{nomina.empleado.nombreCompleto}</p>
                            <p>C.C. {nomina.empleado.cedula}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground text-xs">CARGO</p>
                            <p>{nomina.empleado.cargo}</p>
                            <p className="text-xs text-muted-foreground">Ingreso: {new Date(nomina.empleado.fechaIngreso).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* DEVENGADOS */}
                    <div className="border rounded-md">
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 font-semibold text-green-800 dark:text-green-400">
                            DEVENGADOS
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="grid grid-cols-2">
                                <span>Salario Básico Mensual</span>
                                <span className="text-right">{formatCurrency(baseSalary)}</span>
                            </div>
                            {novedadesAdicion > 0 && (
                                <div className="grid grid-cols-2">
                                    <span>Horas Extras / Bonificaciones</span>
                                    <span className="text-right">{formatCurrency(novedadesAdicion)}</span>
                                </div>
                            )}
                            {detalles.novedades?.filter((n: any) => n.efecto === 'SUMA').map((nov: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-2 text-xs text-muted-foreground pl-4">
                                    <span>• {nov.tipo.replace(/_/g, " ")}</span>
                                    <span className="text-right">{formatCurrency(nov.valor)}</span>
                                </div>
                            ))}
                            <Separator />
                            <div className="grid grid-cols-2 font-semibold">
                                <span>TOTAL DEVENGADO</span>
                                <span className="text-right text-green-600">{formatCurrency(totalDevengado)}</span>
                            </div>
                        </div>
                    </div>

                    {/* DEDUCCIONES */}
                    <div className="border rounded-md">
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 font-semibold text-red-800 dark:text-red-400">
                            DEDUCCIONES
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="grid grid-cols-2">
                                <span>Aporte Salud (4%)</span>
                                <span className="text-right text-red-600">-{formatCurrency(deduccionSalud)}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span>Aporte Pensión (4%)</span>
                                <span className="text-right text-red-600">-{formatCurrency(deduccionPension)}</span>
                            </div>
                            {deduccionFSP > 0 && (
                                <div className="grid grid-cols-2">
                                    <span>Fondo Solidaridad Pensional (1%)</span>
                                    <span className="text-right text-red-600">-{formatCurrency(deduccionFSP)}</span>
                                </div>
                            )}
                            {novedadesDeduccion > 0 && (
                                <>
                                    <div className="grid grid-cols-2">
                                        <span>Otras Deducciones</span>
                                        <span className="text-right text-red-600">-{formatCurrency(novedadesDeduccion)}</span>
                                    </div>
                                    {detalles.novedades?.filter((n: any) => n.efecto === 'RESTA').map((nov: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-2 text-xs text-muted-foreground pl-4">
                                            <span>• {nov.tipo.replace(/_/g, " ")}</span>
                                            <span className="text-right">-{formatCurrency(nov.valor)}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                            <Separator />
                            <div className="grid grid-cols-2 font-semibold">
                                <span>TOTAL DEDUCCIONES</span>
                                <span className="text-right text-red-600">-{formatCurrency(totalDeducciones)}</span>
                            </div>
                        </div>
                    </div>

                    {/* NETO A PAGAR */}
                    <div className="border-2 border-primary rounded-md p-4 bg-primary/5">
                        <div className="grid grid-cols-2 text-xl font-bold">
                            <span>NETO A PAGAR</span>
                            <span className="text-right text-primary">{formatCurrency(netoPagar)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="grid grid-cols-2 gap-8 pt-6 border-t text-xs text-muted-foreground">
                        <div className="text-center">
                            <div className="border-t border-foreground/30 pt-2 mt-8">
                                Firma Empleador
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-foreground/30 pt-2 mt-8">
                                Firma Empleado
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pt-4 print:hidden">
                        <Button variant="outline" className="w-full" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Imprimir Desprendible
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
