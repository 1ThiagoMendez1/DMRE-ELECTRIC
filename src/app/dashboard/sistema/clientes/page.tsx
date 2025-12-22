import { ClientTable } from "./client-table";
import { initialClients } from "@/lib/mock-data";

export default function ClientesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Gestión de Clientes</h1>
                <p className="text-muted-foreground">Administra la información de tus clientes y contactos.</p>
            </div>
            <ClientTable data={initialClients} />
        </div>
    );
}

