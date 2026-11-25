"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// El presupuesto se guarda en un atributo adicional del JSONB opciones_pdf.
// Así conserva su valor propio sin alterar el precio de venta de la cotización
// y sin requerir una migración de tablas de producción.
const BUDGET_FIELD = "dmrePresupuestoProyectoCOP";

async function financeUser() {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error("Supabase no está configurado.");
    const supabase = createServerClient(url, anon, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: values => { try { values.forEach(({name,value,options})=>cookieStore.set(name,value,options)); } catch {} }
        }
    });
    const {data:{user},error} = await supabase.auth.getUser();
    if (error || !user || user.is_anonymous) throw new Error("Tu sesión expiró.");
    const {data: profile,error:accessError} = await supabase.from("profiles")
        .select("role,sidebar_access,is_active").eq("id",user.id).single();
    if (accessError || !profile || profile.is_active === false ||
        (profile.role !== "ADMIN" && !profile.sidebar_access?.includes("financiera")))
        throw new Error("No tienes permisos de análisis financiero.");
    return user;
}

function adminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Servicio de finanzas no configurado.");
    return createAdminClient(url, key, {auth:{autoRefreshToken:false,persistSession:false}});
}

function extractBudget(options: unknown): number | undefined {
    if (!options || typeof options !== "object" || Array.isArray(options)) return undefined;
    const value = (options as Record<string,unknown>)[BUDGET_FIELD];
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export async function getPresupuestosProyectoAction(): Promise<Record<string,number>> {
    await financeUser();
    const admin = adminClient();
    const budgets: Record<string,number> = {};
    for(let offset=0; offset < 50000; offset += 500) {
        const {data,error} = await admin.from("cotizaciones")
            .select("id,opciones_pdf").order("id").range(offset,offset+499);
        if(error) throw new Error("No se pudo consultar los presupuestos.");
        for(const row of data || []) {
            const amount = extractBudget(row.opciones_pdf);
            if(amount !== undefined) budgets[row.id] = amount;
        }
        if(!data || data.length < 500) break;
    }
    return budgets;
}

export async function savePresupuestoProyectoAction(cotizacionId:string, valor:number):Promise<number> {
    await financeUser();
    if (!/^[a-f0-9-]{36}$/i.test(cotizacionId) || !Number.isFinite(valor) || valor < 0 || valor > 1e15)
        throw new Error("Oferta o presupuesto inválido.");
    const amount = Math.round(valor * 100) / 100;
    const admin = adminClient();
    const {data:current,error:readError} = await admin.from("cotizaciones")
        .select("id,opciones_pdf,updated_at").eq("id",cotizacionId).single();
    if(readError || !current) throw new Error("No se encontró la oferta.");
    const previous = current.opciones_pdf && typeof current.opciones_pdf === "object" && !Array.isArray(current.opciones_pdf)
        ? current.opciones_pdf : {};
    // Comprobación optimista: no sobreescribir modificaciones simultáneas a la oferta.
    const {data:updated,error} = await admin.from("cotizaciones")
        .update({opciones_pdf:{...previous,[BUDGET_FIELD]:amount}})
        .eq("id",cotizacionId).eq("updated_at",current.updated_at)
        .select("id").maybeSingle();
    if(error || !updated) throw new Error("La oferta cambió mientras guardabas el presupuesto. Actualiza y vuelve a intentarlo.");
    revalidatePath("/dashboard/sistema/financiera");
    return amount;
}
