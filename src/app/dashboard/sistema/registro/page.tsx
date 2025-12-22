import { RegistroTable } from "./registro-table";
import { initialRegistros } from "@/lib/mock-data";

export default function RegistroPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Registro de Obras</h1>
                <p className="text-muted-foreground">Control de trabajos, anticipos y saldos pendientes.</p>
            </div>
            <RegistroTable data={initialRegistros} />
        </div>
    );
}
