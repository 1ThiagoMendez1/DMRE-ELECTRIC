"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const BUCKET = "cotizaciones_docs"; // Depósito privado ya utilizado por el sistema.
const MAX_BYTES = 10_000_000;

async function financeUser() {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const session = createServerClient(url, anon, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: changes => {
                try { changes.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
            }
        }
    });
    const { data: { user }, error } = await session.auth.getUser();
    if (error || !user || user.is_anonymous) throw new Error("Sesión expirada.");
    const { data: profile, error: accessError } = await session.from("profiles")
        .select("role,sidebar_access,is_active").eq("id", user.id).single();
    if (accessError || !profile || profile.is_active === false ||
        (profile.role !== "ADMIN" && !profile.sidebar_access?.includes("financiera"))) {
        throw new Error("No tienes permisos para gestionar documentos financieros.");
    }
    return user;
}

function adminStorage() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) throw new Error("No está configurado el servicio de documentos.");
    return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }).storage.from(BUCKET);
}

export async function uploadObligacionSupportAction(data: FormData) {
    const user = await financeUser();
    const file = data.get("file");
    if (!(file instanceof File) || file.size < 16 || file.size > MAX_BYTES)
        throw new Error("Selecciona un soporte de máximo 10 MB.");
    const raw = new Uint8Array(await file.arrayBuffer());
    const pdf = raw.length > 5 && String.fromCharCode(...raw.slice(0, 5)) === "%PDF-";
    const jpg = raw[0] === 255 && raw[1] === 216 && raw[2] === 255;
    const png = [137,80,78,71,13,10,26,10].every((v,i)=>raw[i]===v);
    const formats = pdf ? { ext: "pdf", mime: "application/pdf" } :
        jpg ? { ext: "jpg", mime: "image/jpeg" } :
        png ? { ext: "png", mime: "image/png" } : null;
    if (!formats) throw new Error("El soporte debe ser un PDF, JPG o PNG válido.");
    const path = `obligaciones/${user.id}/${randomUUID()}.${formats.ext}`;
    const { error } = await adminStorage().upload(path, raw, { contentType: formats.mime, upsert: false });
    if (error) throw new Error("No se pudo adjuntar el documento. Revise el almacenamiento privado.");
    return path;
}

export async function getObligacionSupportUrlAction(path: string) {
    await financeUser();
    if (!/^obligaciones\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(pdf|jpg|png)$/.test(path))
        throw new Error("Ruta del documento inválida.");
    const { data, error } = await adminStorage().createSignedUrl(path, 60);
    if (error || !data?.signedUrl) throw new Error("No fue posible acceder al documento.");
    return data.signedUrl;
}
