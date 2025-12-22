import { InventoryTable } from "./inventory-table";
import { initialInventory } from "@/lib/mock-data";

export default function InventarioPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Inventario de Materiales</h1>
                <p className="text-muted-foreground">Gestiona tus productos, precios y existencias.</p>
            </div>
            <InventoryTable data={initialInventory} />
        </div>
    );
}
