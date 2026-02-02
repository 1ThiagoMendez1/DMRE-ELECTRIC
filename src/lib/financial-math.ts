
import { PagoObligacion } from "@/types/sistema";

export interface AmortizationRow {
    periodo: number;
    fecha: Date;
    cuota: number;
    interes: number;
    capital: number;
    saldo: number;
    isReal: boolean; // true if based on actual payment, false if projected
}

export function calculateAmortizationSchedule(
    montoOriginal: number,
    tasaInteresMensual: number, // e.g. 0.02 for 2%
    plazoMesesOriginal: number,
    fechaInicio: Date,
    pagosRealizados: PagoObligacion[] = []
): AmortizationRow[] {
    const rows: AmortizationRow[] = [];
    let currentBalance = montoOriginal;

    // Convert dates to timestamps for reliable sorting
    const sortedPagos = [...pagosRealizados].sort((a, b) =>
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    // 1. Process Actual History
    // We map payments to their approximate periods or just list them sequentially?
    // A robust way for simple loans is: 
    // - Iterate through sorted payments.
    // - Each payment reduces the balance at that point in time.
    // - We create "Real" rows for these.

    let lastPaymentDate = new Date(fechaInicio);

    sortedPagos.forEach((pago, index) => {
        // Simple sequential indexing for history
        rows.push({
            periodo: index + 1, // This effectively replaces "Month 1, 2..." with "Payment 1, 2..."
            fecha: new Date(pago.fecha),
            cuota: pago.valor,
            interes: pago.interes || 0,
            capital: pago.capital || 0,
            saldo: pago.saldoRestante,
            isReal: true
        });
        currentBalance = pago.saldoRestante;
        lastPaymentDate = new Date(pago.fecha);
    });

    // 2. Project Future
    // If balance is still positive, project remaining payments.
    // We assume the GOAL is to pay off the *remaining* balance.
    // Question: Do we keep the ORIGINAl quota (which reduces term) or recalculate quota (keep term)?
    // Standard "Abono a Capital" usually keeps the Quota fixed and reduces the Term.

    /* 
       Standard Formula for Quota: 
       A = P * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
       But here we have a fixed Quota (usually) and want to find 'n' (remaining periods).
       OR we continue iterating until balance <= 0 using the known 'valorCuota' if available.
       
       However, we don't have the original 'valorCuota' passed in explicitly as a param here, 
       but we can infer it or calculate a "suggested" one if we wanted to stick to original term.
       
       Let's assume the user wants to see what happens if they keep paying the *original* expected quota.
       We need to calculate what that original quota was to project it.
    */

    const calculatedOriginalQuota = montoOriginal * (
        (tasaInteresMensual * Math.pow(1 + tasaInteresMensual, plazoMesesOriginal)) /
        (Math.pow(1 + tasaInteresMensual, plazoMesesOriginal) - 1)
    );

    let projectionDate = new Date(lastPaymentDate);
    let projectedPeriod = rows.length + 1;

    // Safety break to prevent infinite loops
    const MAX_PERIODS = 360;

    while (currentBalance > 100 && projectedPeriod <= MAX_PERIODS) {
        // Advance 1 month
        projectionDate.setMonth(projectionDate.getMonth() + 1);

        const interes = currentBalance * tasaInteresMensual;
        let cuota = calculatedOriginalQuota;

        // Adjust final quota if balance is small
        if (currentBalance + interes < cuota) {
            cuota = currentBalance + interes;
        }

        const capital = cuota - interes;
        const newBalance = currentBalance - capital;

        rows.push({
            periodo: projectedPeriod,
            fecha: new Date(projectionDate),
            cuota: cuota,
            interes: interes,
            capital: capital,
            saldo: newBalance > 0 ? newBalance : 0,
            isReal: false
        });

        currentBalance = newBalance;
        projectedPeriod++;
    }

    return rows;
}
