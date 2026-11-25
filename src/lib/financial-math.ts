import { PagoObligacion } from "@/types/sistema";

export interface AmortizationRow {
    periodo: number;
    fecha: Date;
    cuota: number;
    interes: number;
    capital: number;
    saldo: number;
    isReal: boolean;
}

const roundCOP = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** El sistema guarda la tasa pactada como decimal efectivo anual (0.15 = 15% E.A.). */
export function annualEffectiveToMonthly(annualEffective: number): number {
    if (!Number.isFinite(annualEffective) || annualEffective < 0 || annualEffective > 10)
        throw new Error("Tasa E.A. inválida.");
    return Math.pow(1 + annualEffective, 1 / 12) - 1;
}

export function calculateMonthlyQuota(principal: number, annualEffective: number, months: number): number {
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isInteger(months) || months <= 0)
        throw new Error("Monto o plazo inválidos.");
    const monthly = annualEffectiveToMonthly(annualEffective);
    if (monthly === 0) return roundCOP(principal / months);
    const factor = Math.pow(1 + monthly, months);
    return roundCOP(principal * monthly * factor / (factor - 1));
}

/** Nunca permite amortización negativa ni pagar más capital del pendiente. */
export function calculatePaymentBreakdown(balance: number, annualEffective: number, amount: number, extraCapital = false) {
    if (![balance, amount].every(Number.isFinite) || balance < 0 || amount <= 0)
        throw new Error("Monto del pago o saldo inválido.");
    if (extraCapital) {
        if (amount > balance + 0.009) throw new Error("El abono supera el saldo de capital.");
        return { interes: 0, capital: roundCOP(amount), saldoRestante: roundCOP(Math.max(0, balance - amount)) };
    }
    const interest = roundCOP(balance * annualEffectiveToMonthly(annualEffective));
    if (amount <= interest) throw new Error("El pago no cubre el interés mensual pactado.");
    const capital = roundCOP(amount - interest);
    if (capital > balance + 0.009) throw new Error("El pago supera el saldo más los intereses del periodo.");
    return { interes: interest, capital, saldoRestante: roundCOP(Math.max(0, balance - capital)) };
}

export function calculateAmortizationSchedule(
    montoOriginal: number,
    tasaEfectivaAnual: number,
    plazoMesesOriginal: number,
    fechaInicio: Date,
    pagosRealizados: PagoObligacion[] = [],
    cuotaPactada?: number,
    tipoCuota: "FIJA" | "VARIABLE" = "FIJA"
): AmortizationRow[] {
    const rows: AmortizationRow[] = [];
    let currentBalance = Math.max(0, montoOriginal);
    const annualRate = Number.isFinite(tasaEfectivaAnual) ? Math.max(0, tasaEfectivaAnual) : 0;
    const monthly = annualEffectiveToMonthly(annualRate);
    const sorted = [...pagosRealizados].sort((a,b)=>new Date(a.fecha).getTime()-new Date(b.fecha).getTime());
    let projectionDate = new Date(fechaInicio);

    for (const payment of sorted) {
        const capital = Number(payment.capital || 0);
        currentBalance = Math.max(0, Number.isFinite(payment.saldoRestante) ? payment.saldoRestante : currentBalance - capital);
        projectionDate = new Date(payment.fecha);
        rows.push({
            periodo: rows.length + 1, fecha: new Date(payment.fecha), cuota: Number(payment.valor) || 0,
            interes: Number(payment.interes) || 0, capital, saldo: currentBalance, isReal: true
        });
    }
    if (currentBalance <= 0.009 || !plazoMesesOriginal) return rows;

    const defaultQuota = calculateMonthlyQuota(montoOriginal, annualRate, plazoMesesOriginal);
    let quota = cuotaPactada && cuotaPactada > 0 ? cuotaPactada : defaultQuota;
    const periodsLeft = Math.max(1, plazoMesesOriginal - rows.length);

    for (let index = 0; index < Math.min(360, periodsLeft + (tipoCuota === "FIJA" ? 120 : 0)) && currentBalance > 0.009; index++) {
        projectionDate = new Date(projectionDate.getFullYear(), projectionDate.getMonth() + 1, Math.min(projectionDate.getDate(), 28));
        const interes = roundCOP(currentBalance * monthly);
        if (tipoCuota === "VARIABLE") quota = calculateMonthlyQuota(currentBalance, annualRate, Math.max(1, periodsLeft - index));
        // Una cuota pactada menor al interés no amortiza. Dejar constancia sin simular capital negativo.
        if (quota <= interes) break;
        const cuota = Math.min(quota, roundCOP(currentBalance + interes));
        const capital = roundCOP(Math.max(0, cuota - interes));
        currentBalance = roundCOP(Math.max(0, currentBalance - capital));
        rows.push({ periodo: rows.length + 1, fecha: new Date(projectionDate), cuota, interes, capital, saldo: currentBalance, isReal: false });
    }
    return rows;
}
