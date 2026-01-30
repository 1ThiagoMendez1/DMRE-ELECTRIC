"use client";

import { InventoryTable } from "./inventory-table";
import { useErp } from "@/components/providers/erp-provider";

export default function InventarioPage() {
    const { inventario } = useErp();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Inventario de Materiales</h1>
                <p className="text-muted-foreground">Gestiona tus productos, precios y existencias.</p>
            </div>
            <InventoryTable data={inventario} />
        </div>
    );
}
