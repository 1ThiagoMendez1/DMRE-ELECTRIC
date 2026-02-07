import { InventoryTable } from "./inventory-table";
import { getInventarioAction } from "./actions";
import { getCotizacionesAction } from "../cotizacion/actions";

export default async function InventarioPage() {
    const [inventario, cotizaciones] = await Promise.all([
        getInventarioAction(),
        getCotizacionesAction()
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Inventario de Materiales</h1>
                <p className="text-muted-foreground">Gestiona tus productos, precios y existencias.</p>
            </div>
            <InventoryTable data={inventario} cotizaciones={cotizaciones} />
        </div>
    );
}
