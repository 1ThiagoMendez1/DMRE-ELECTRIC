"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { MyProfile, MyProfilePatch } from "@/types/perfil";

const BUCKET = "user-avatars";
const MAX_IMAGE_SIZE = 3_000_000;
const FIELDS = "id, full_name, email, phone, avatar_url, role, settings, created_at, updated_at, is_active";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("No está configurada la conexión del servidor.");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Valida el usuario de la sesión con la clave pública, nunca con la de administrador. */
async function requireSignedInUser() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Falta la configuración de autenticación.");
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // En un renderizado de servidor los tokens los renueva el middleware.
        }
      },
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
  return user;
}

function toProfile(row: Record<string, any>, email: string): MyProfile {
  const settings = row.settings && typeof row.settings === "object" && !Array.isArray(row.settings)
    ? row.settings : {};
  const details = settings.profile && typeof settings.profile === "object" && !Array.isArray(settings.profile)
    ? settings.profile : {};
  return {
    id: row.id,
    name: String(row.full_name || ""),
    email: String(email || row.email || ""),
    phone: String(row.phone || ""),
    avatar: String(row.avatar_url || ""),
    role: String(row.role || "VIEWER"),
    headline: String(details.headline || ""),
    bio: String(details.bio || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    isActive: row.is_active !== false,
  };
}

async function fetchOwnProfile(user: { id: string; email?: string; user_metadata?: Record<string, any> }) {
  const admin = getAdmin();
  const existing = await admin.from("profiles").select(FIELDS).eq("id", user.id).maybeSingle();
  if (existing.error) throw new Error("No fue posible consultar tu perfil.");
  if (existing.data) return existing.data;

  // Recupera cuentas de Auth que aún no tengan su correspondiente fila de perfil.
  const { data, error } = await admin.from("profiles").upsert({
    id: user.id,
    email: user.email || "",
    full_name: String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario"),
    role: "VIEWER",
    sidebar_access: ["dashboard"],
    is_active: true,
  }, { onConflict: "id", ignoreDuplicates: true }).select(FIELDS).maybeSingle();
  if (error) throw new Error("No fue posible crear el perfil de esta cuenta.");
  if (data) return data;
  const retry = await admin.from("profiles").select(FIELDS).eq("id", user.id).single();
  if (retry.error || !retry.data) throw new Error("No se encontró el perfil.");
  return retry.data;
}

export async function getMyProfileAction(): Promise<MyProfile> {
  const user = await requireSignedInUser();
  return toProfile(await fetchOwnProfile(user), user.email || "");
}

function assertText(value: unknown, label: string, max: number, required = false): string {
  if (typeof value !== "string") throw new Error(`El campo ${label} no es válido.`);
  const text = value.trim();
  if ((required && text.length < 2) || text.length > max) {
    throw new Error(`${label}: ${required ? "mínimo 2 caracteres, " : ""}máximo ${max}.`);
  }
  return text;
}

export async function saveMyProfileAction(input: MyProfilePatch): Promise<MyProfile> {
  const user = await requireSignedInUser();
  const name = assertText(input?.name, "Nombre", 90, true);
  const phone = assertText(input?.phone, "Teléfono", 30);
  const headline = assertText(input?.headline, "Cargo o presentación", 100);
  const bio = assertText(input?.bio, "Acerca de mí", 500);
  if (phone && !/^[+\d\s().-]+$/.test(phone)) {
    throw new Error("El teléfono contiene caracteres inválidos.");
  }

  const previous = await fetchOwnProfile(user);
  const settings = previous.settings && typeof previous.settings === "object" && !Array.isArray(previous.settings)
    ? previous.settings : {};
  const details = settings.profile && typeof settings.profile === "object" && !Array.isArray(settings.profile)
    ? settings.profile : {};

  // Actualizar exclusivamente datos personales: NUNCA aceptar role, is_active ni sidebar_access.
  const { data, error } = await getAdmin().from("profiles").update({
    full_name: name,
    phone: phone || null,
    settings: { ...settings, profile: { ...details, headline, bio } },
    updated_at: new Date().toISOString(),
  }).eq("id", user.id).select(FIELDS).single();
  if (error || !data) throw new Error("No se pudieron guardar los cambios del perfil.");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return toProfile(data, user.email || "");
}

function detectImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { mime: "image/jpeg", ext: "jpg" };
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((x, i) => bytes[i] === x))
    return { mime: "image/png", ext: "png" };
  if (bytes.length >= 12 &&
      String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  return null;
}

function previousPhotoPath(url: unknown, userId: string): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return null;
    const part = `/storage/v1/object/public/${BUCKET}/`;
    const index = parsed.pathname.indexOf(part);
    if (index < 0) return null;
    const path = decodeURIComponent(parsed.pathname.slice(index + part.length));
    return path.startsWith(`${userId}/`) && !path.includes("..") ? path : null;
  } catch { return null; }
}

export async function uploadMyAvatarAction(formData: FormData): Promise<MyProfile> {
  const user = await requireSignedInUser();
  const file = formData.get("avatar");
  if (!(file instanceof File)) throw new Error("Selecciona una imagen válida.");
  if (file.size < 20 || file.size > MAX_IMAGE_SIZE)
    throw new Error("La foto debe pesar menos de 3 MB.");
  const buffer = new Uint8Array(await file.arrayBuffer());
  const detected = detectImage(buffer);
  if (!detected || detected.mime !== file.type)
    throw new Error("La imagen debe ser JPG, PNG o WEBP válida.");

  const oldProfile = await fetchOwnProfile(user);
  const path = `${user.id}/${randomUUID()}.${detected.ext}`;
  const admin = getAdmin();
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: detected.mime, cacheControl: "3600", upsert: false,
  });
  if (uploadError) throw new Error("No se pudo subir la foto. Inténtalo nuevamente.");
  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(path);
  const { data, error } = await admin.from("profiles")
    .update({ avatar_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id).select(FIELDS).single();
  if (error || !data) {
    await admin.storage.from(BUCKET).remove([path]);
    throw new Error("La foto se subió, pero no se pudo asociar a tu perfil.");
  }
  const previous = previousPhotoPath(oldProfile.avatar_url, user.id);
  if (previous) await admin.storage.from(BUCKET).remove([previous]);
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return toProfile(data, user.email || "");
}

export async function removeMyAvatarAction(): Promise<MyProfile> {
  const user = await requireSignedInUser();
  const oldProfile = await fetchOwnProfile(user);
  const admin = getAdmin();
  const { data, error } = await admin.from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id).select(FIELDS).single();
  if (error || !data) throw new Error("No se pudo eliminar tu foto.");
  const previous = previousPhotoPath(oldProfile.avatar_url, user.id);
  if (previous) await admin.storage.from(BUCKET).remove([previous]);
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  return toProfile(data, user.email || "");
}
