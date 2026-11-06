"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCotizacionesAction } from "@/app/dashboard/sistema/cotizacion/actions";
import { getFacturasAction } from "@/app/dashboard/sistema/financiera/actions";
import { getInventarioAction } from "@/app/dashboard/sistema/inventario/actions";
import { getClientsAction } from "@/app/dashboard/sistema/clientes/actions";

/**
 * Prioridad de inicio: cargar únicamente los datos del panel,
 * sin esperar los módulos de contabilidad, nómina, flota y logística.
 */
export async function getDashboardDataAction() {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error("La autenticación no está configurada.");
    const client = createServerClient(url, anon, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (values) => {
                try {
                    values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch { /* Middleware gestiona la sesión al renderizar. */ }
            },
        },
    });
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) throw new Error("Debes iniciar sesión para consultar el dashboard.");
    const [cotizaciones, facturas, inventario, clientes] = await Promise.all([
        getCotizacionesAction(),
        getFacturasAction(),
        getInventarioAction(),
        getClientsAction(),
    ]);
    return { cotizaciones, facturas, inventario, clientes };
}
