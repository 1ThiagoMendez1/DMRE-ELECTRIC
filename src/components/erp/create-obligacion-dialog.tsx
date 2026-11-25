"use client";

import { useMemo, useState } from "react";
import { Plus, CreditCard, FileUp, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ObligacionFinanciera } from "@/types/sistema";
import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency } from "@/lib/utils";
import { calculateMonthlyQuota, annualEffectiveToMonthly } from "@/lib/financial-math";
import { uploadObligacionSupportAction } from "@/app/dashboard/sistema/financiera/obligaciones-documentos-actions";

interface Props { onObligacionCreated: (item: ObligacionFinanciera) => Promise<void> | void; }

export function CreateObligacionDialog({ onObligacionCreated }: Props) {
    const { toast } = useToast();
    const { cuentasBancarias } = useErp();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [entidad, setEntidad] = useState("");
    const [monto, setMonto] = useState("");
    const [tasa, setTasa] = useState("");
    const [plazo, setPlazo] = useState("");
    const [fecha, setFecha] = useState("");
    const [cuentaId, setCuentaId] = useState("");
    const [tipoCuota, setTipoCuota] = useState<"FIJA"|"VARIABLE">("FIJA");
    const [cuotaPactada, setCuotaPactada] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [support, setSupport] = useState<File | null>(null);

    const suggested = useMemo(() => {
        const P = Number(monto), ea = Number(tasa) / 100, n = Number(plazo);
        try { return calculateMonthlyQuota(P, ea, n); } catch { return null; }
    }, [monto, tasa, plazo]);

    const guardar = async () => {
        const principal = Number(monto), annual = Number(tasa) / 100, months = Number(plazo);
        const fixedQuota = cuotaPactada.trim() ? Number(cuotaPactada) : suggested;
        if (!entidad.trim() || !fecha || principal <= 0 || !Number.isFinite(principal) ||
            !Number.isInteger(months) || months < 1 || months > 360 ||
            !Number.isFinite(annual) || annual < 0 || annual > 10 || !suggested ||
            (tipoCuota === "FIJA" && (!fixedQuota || fixedQuota <= 0))) {
            toast({ variant: "destructive", title: "Revisa los datos del crédito", description: "Monto, tasa E.A., plazo y cuota deben ser válidos." }); return;
        }
        const effectiveMonthly = annualEffectiveToMonthly(annual);
        if (tipoCuota === "FIJA" && fixedQuota! <= principal * effectiveMonthly) {
            toast({ variant: "destructive", title: "Cuota insuficiente", description: "La cuota pactada debe cubrir el interés del mes y amortizar capital." }); return;
        }
        if (support && (support.size > 10_000_000 || !["application/pdf", "image/jpeg", "image/png"].includes(support.type))) {
            toast({ variant: "destructive", title: "Soporte no válido", description: "Adjunta PDF, JPG o PNG de hasta 10 MB." }); return;
        }
        setSaving(true);
        try {
            let soporteUrl: string | undefined;
            if (support) {
                const payload = new FormData(); payload.append("file", support);
                soporteUrl = await uploadObligacionSupportAction(payload);
            }
            await onObligacionCreated({
                id: `OBL-${Date.now()}`,
                tipo: "PRESTAMO",
                entidad: entidad.trim(),
                montoPrestado: principal,
                tasaInteres: annual,
                plazoMeses: months,
                saldoCapital: principal,
                valorCuota: tipoCuota === "FIJA" ? Number(fixedQuota) : suggested,
                tipoCuota,
                soporteUrl,
                observaciones: observaciones.trim(),
                estado: "ACTIVO",
                cuotasPagadas: 0,
                fechaInicio: new Date(fecha + "T12:00:00"),
                cuentaId: cuentaId || undefined
            });
            toast({ title: "Obligación registrada", description: "Se guardaron la tasa, cuota pactada y demás condiciones." });
            setOpen(false);
            setEntidad("");setMonto("");setTasa("");setPlazo("");setFecha("");setCuentaId("");
            setTipoCuota("FIJA");setCuotaPactada("");setObservaciones("");setSupport(null);
        } catch (error) {
            toast({ variant: "destructive", title: "No se pudo completar", description: error instanceof Error ? error.message : "Revise la conexión; no repita un desembolso sin conciliar la cuenta." });
        } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={v => !saving && setOpen(v)}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nueva Obligación</Button></DialogTrigger>
            <DialogContent className="w-[min(96vw,680px)] max-w-[96vw] max-h-[90dvh] overflow-y-auto">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Registrar obligación financiera</DialogTitle>
                    <DialogDescription>Registra las condiciones reales del crédito, cuota pactada y documentos de soporte.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="obl-entidad">Entidad / Acreedor *</Label><Input id="obl-entidad" value={entidad} onChange={e=>setEntidad(e.target.value)} placeholder="Banco o entidad acreedora" /></div>
                    <div className="space-y-1.5"><Label htmlFor="obl-monto">Capital desembolsado (COP) *</Label><Input id="obl-monto" type="number" min="1" step="0.01" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00" /></div>
                    <div className="space-y-1.5"><Label htmlFor="obl-tasa">Tasa efectiva anual E.A. (%) *</Label><Input id="obl-tasa" type="number" min="0" max="1000" step="0.0001" value={tasa} onChange={e=>setTasa(e.target.value)} placeholder="Ej. 15" /></div>
                    <div className="space-y-1.5"><Label htmlFor="obl-plazo">Plazo (meses) *</Label><Input id="obl-plazo" type="number" min="1" max="360" step="1" value={plazo} onChange={e=>setPlazo(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="obl-fecha">Fecha del desembolso *</Label><Input id="obl-fecha" type="date" value={fecha} onChange={e=>setFecha(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Tipo de cuota pactada *</Label>
                        <Select value={tipoCuota} onValueChange={v => setTipoCuota(v as "FIJA"|"VARIABLE")}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="FIJA">Cuota fija</SelectItem><SelectItem value="VARIABLE">Cuota variable (recalculada)</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1.5"><Label htmlFor="obl-cuota">Cuota pactada (COP)</Label><Input id="obl-cuota" type="number" min="0" step="0.01" value={tipoCuota==="VARIABLE"?(suggested ?? ""):cuotaPactada} disabled={tipoCuota==="VARIABLE"} onChange={e=>setCuotaPactada(e.target.value)} placeholder={suggested === null ? "Primero ingresa monto, tasa y plazo" : String(suggested)} />
                        <p className="text-[11px] text-muted-foreground">{suggested === null ? "Completa los valores para calcular una referencia." : `Cuota teórica: ${formatCurrency(suggested)}. ${tipoCuota==="FIJA"?"Puedes escribir la cuota del contrato.":"Se recalcula según saldo y plazo restante."}`}</p>
                    </div>
                    <div className="space-y-1.5"><Label>Cuenta receptora (si recibió el dinero)</Label>
                        <Select value={cuentaId || "none"} onValueChange={v=>setCuentaId(v==="none"?"":v)}><SelectTrigger><SelectValue placeholder="Sin cuenta receptora" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">No registrar desembolso</SelectItem>{cuentasBancarias.map(c=><SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="obl-notas">Condiciones / notas</Label><Textarea id="obl-notas" value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Ej. tasa variable por revisión semestral, seguros y comisiones..." rows={2}/></div>
                    <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="obl-soporte" className="flex items-center gap-2"><FileUp className="h-4 w-4" /> Contrato / soporte (PDF o imagen)</Label><Input id="obl-soporte" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setSupport(e.target.files?.[0] || null)} disabled={saving} /><p className="text-xs text-muted-foreground">Soporte privado, máximo 10 MB. No se publica en internet.</p></div>
                </div>
                <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0"/> La tasa se registra como efectiva anual; el cálculo convierte a tasa mensual. Si no se conoce la tasa, registra 0 y confírmala posteriormente.</p>
                <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={guardar} disabled={saving||!entidad.trim()} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Guardar obligación</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
