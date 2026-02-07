import { FinancieraView } from "./financiera-view";
import { getCuentasBancariasAction, getMovimientosFinancierosAction } from "./bancos-actions";

export default async function FinancieraPage() {
    const [cuentas, movimientos] = await Promise.all([
        getCuentasBancariasAction(),
        getMovimientosFinancierosAction()
    ]);

    return <FinancieraView initialCuentas={cuentas} initialMovimientos={movimientos || []} />;
}
