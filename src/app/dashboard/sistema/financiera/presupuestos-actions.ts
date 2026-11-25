"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function financeClient() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: values => {
            try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        }}}
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.is_anonymous) throw new Error("Debes iniciar sesión.");
    const { data: profile } = await supabase.from("profiles")
        .select("role,sidebar_access,is_active").eq("id",user.id).single();
    if (!profile || profile.is_active === false ||
       (profile.role !== "ADMIN" && !profile.sidebar_access?.includes("financiera")))
       throw new Error("No tienes acceso al análisis financiero.");
    return { supabase, user };
}

export async function getPresupuestosProyectoAction(): Promise<Record<string, number>> {
    const { supabase } = await financeClient();
    const { data, error } = await supabase.from("presupuestos_proyecto")
        .select("cotizacion_id,valor_presupuestado");
    if (error) {
        if (error.code === "42P01" || error.code === "PGRST205")
            throw new Error("Falta aplicar la migración de presupuestos de proyecto.");
        throw new Error("No fue posible consultar los presupuestos.");
    }
    return Object.fromEntries((data || []).map(row=>[row.cotizacion_id, Number(row.valor_presupuestado)]));
}

export async function savePresupuestoProyectoAction(cotizacionId: string, valor: number): Promise<number> {
    const { supabase, user } = await financeClient();
    if (!/^[0-9a-f-]{36}$/i.test(cotizacionId) || !Number.isFinite(valor) || valor < 0)
        throw new Error("Oferta o presupuesto inválido.");
    const { error } = await supabase.from("presupuestos_proyecto")
        .upsert({ cotizacion_id: cotizacionId, valor_presupuestado: Math.round(valor*100)/100,
            actualizado_por: user.id, updated_at: new Date().toISOString() }, { onConflict: "cotizacion_id" });
    if (error) {
        if (error.code === "42P01" || error.code === "PGRST205")
            throw new Error("Falta aplicar la migración de presupuestos de proyecto.");
        throw new Error("No se pudo guardar el presupuesto. Verifica tus permisos.");
    }
    revalidatePath("/dashboard/sistema/financiera");
    return Math.round(valor*100)/100;
}
