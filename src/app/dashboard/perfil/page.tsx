"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import {
  BadgeCheck, BriefcaseBusiness, Camera, Check, CircleUserRound, ImagePlus,
  KeyRound, Loader2, LockKeyhole, Mail, Phone, RefreshCw, ShieldCheck,
  Sparkles, Trash2, UserRound, CalendarDays,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useErp } from "@/components/providers/erp-provider";
import { createClient } from "@/utils/supabase/client";
import {
  getMyProfileAction, removeMyAvatarAction, saveMyProfileAction, uploadMyAvatarAction,
} from "./actions";
import type { MyProfile, MyProfilePatch } from "@/types/perfil";

const empty: MyProfilePatch = { name: "", phone: "", headline: "", bio: "" };
const roles: Record<string, string> = {
  ADMIN: "Administrador", ENGINEER: "Ingeniería", CLIENT: "Cliente", VIEWER: "Visualizador",
};
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "DM";

export default function PerfilPage() {
  const { toast } = useToast();
  const { currentUser, setCurrentUser, refreshUsers } = useErp();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [draft, setDraft] = useState<MyProfilePatch>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSecurity, setShowSecurity] = useState(false);

  const applyProfile = useCallback((next: MyProfile) => {
    setProfile(next);
    setDraft({ name: next.name, phone: next.phone, headline: next.headline, bio: next.bio });
    // Reflejar el avatar y nombre sin recargar el dashboard.
    setCurrentUser({
      id: next.id,
      name: next.name,
      email: next.email,
      role: next.role as "ADMIN" | "ENGINEER" | "CLIENT" | "VIEWER",
      avatar: next.avatar,
      sidebarAccess: currentUser?.sidebarAccess,
      isActive: next.isActive,
    });
    void refreshUsers();
  }, [currentUser?.sidebarAccess, refreshUsers, setCurrentUser]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getMyProfileAction();
      setProfile(next);
      setDraft({ name: next.name, phone: next.phone, headline: next.headline, bio: next.bio });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await saveMyProfileAction(draft);
      applyProfile(updated);
      toast({ title: "Cambios guardados", description: "Tu información personal quedó actualizada." });
    } catch (err) {
      toast({ variant: "destructive", title: "No se pudo guardar", description: err instanceof Error ? err.message : "Comprueba la conexión." });
    } finally { setSaving(false); }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3_000_000) {
      toast({ variant: "destructive", title: "Foto no compatible", description: "Usa JPG, PNG o WEBP de máximo 3 MB." });
      return;
    }
    setUploading(true);
    try {
      const payload = new FormData();
      payload.set("avatar", file);
      applyProfile(await uploadMyAvatarAction(payload));
      toast({ title: "¡Foto actualizada!", description: "Tu nueva imagen ya aparece en el sistema." });
    } catch (err) {
      toast({ variant: "destructive", title: "No se pudo cambiar la foto", description: err instanceof Error ? err.message : "Intenta otra imagen." });
    } finally { setUploading(false); }
  };

  const removeAvatar = async () => {
    if (!profile?.avatar) return;
    setRemoving(true);
    try {
      applyProfile(await removeMyAvatarAction());
      toast({ title: "Foto eliminada", description: "Ahora se mostrarán tus iniciales." });
    } catch (err) {
      toast({ variant: "destructive", title: "No se pudo eliminar", description: err instanceof Error ? err.message : "Inténtalo de nuevo." });
    } finally { setRemoving(false); }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    if (newPassword.length < 8 || newPassword !== confirmPassword || !currentPassword) {
      toast({ variant: "destructive", title: "Revisa la contraseña", description: "Indica tu clave actual, una nueva de mínimo 8 caracteres y confírmala correctamente." });
      return;
    }
    if (newPassword === currentPassword) {
      toast({ variant: "destructive", title: "Elige otra clave", description: "La nueva contraseña debe ser distinta de la anterior." });
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const verified = await supabase.auth.signInWithPassword({ email: profile.email, password: currentPassword });
      if (verified.error) throw new Error("La contraseña actual no es correcta.");
      const updated = await supabase.auth.updateUser({ password: newPassword });
      if (updated.error) throw updated.error;
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowSecurity(false);
      toast({ title: "Contraseña actualizada", description: "Tu acceso ahora utiliza la nueva clave." });
    } catch (err) {
      toast({ variant: "destructive", title: "No fue posible cambiarla", description: err instanceof Error ? err.message : "Intenta nuevamente." });
    } finally { setChangingPassword(false); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-primary">
            <Sparkles className="h-4 w-4" /> Mi espacio
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tu identidad y preferencias dentro de DMRE Electric.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/30"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" onClick={() => void load()}>Intentar de nuevo</Button>
        </CardContent></Card>
      ) : null}

      {loading && !profile ? (
        <Card><CardContent className="flex items-center gap-3 p-7 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Consultando tu información...
        </CardContent></Card>
      ) : null}

      {profile ? (<>
        <section className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-[#15334b] to-[#135c58] text-white shadow-lg">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-80 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:p-9">
            <div className="relative shrink-0">
              <Avatar className="h-28 w-28 border-4 border-white/80 bg-white/10 shadow-xl sm:h-32 sm:w-32">
                <AvatarImage src={profile.avatar || undefined} alt={`Foto de ${profile.name}`} className="object-cover" />
                <AvatarFallback className="bg-white/10 text-3xl font-bold text-white">{initials(profile.name)}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}
                aria-label="Cambiar foto de perfil" title="Cambiar foto de perfil"
                className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-60">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={upload} aria-label="Seleccionar una foto" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge className="mb-3 gap-1 border-white/20 bg-white/15 text-white hover:bg-white/20"><BadgeCheck className="h-3.5 w-3.5" /> Cuenta personal</Badge>
              <h2 className="break-words text-2xl font-bold leading-tight sm:text-3xl">{profile.name || "Mi cuenta"}</h2>
              <p className="mt-2 text-sm text-white/75">{profile.headline || roles[profile.role] || profile.role}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/75 sm:text-sm">
                <span className="inline-flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0" /> {profile.email}</span>
                {profile.phone ? <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {profile.phone}</span> : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 self-start sm:flex-col">
              <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Cambiar foto
              </Button>
              {profile.avatar ? <Button type="button" variant="ghost" size="sm" onClick={removeAvatar} disabled={removing}
                className="gap-2 text-white hover:bg-white/15 hover:text-white"><Trash2 className="h-4 w-4" /> Quitar foto</Button> : null}
              <span className="text-center text-[11px] text-white/60">JPG, PNG o WEBP · hasta 3 MB</span>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><UserRound className="h-5 w-5 text-primary" /> Información personal</CardTitle>
                <CardDescription>Estos datos se mostrarán en tu cuenta y directorio de usuarios.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={save} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="perfil-nombre">Nombre completo *</Label>
                      <Input id="perfil-nombre" autoComplete="name" required minLength={2} maxLength={90}
                        value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="perfil-telefono">Teléfono de contacto</Label>
                      <Input id="perfil-telefono" autoComplete="tel" inputMode="tel" maxLength={30}
                        placeholder="+57 300 000 0000" value={draft.phone}
                        onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="perfil-correo">Correo de acceso</Label>
                      <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="perfil-correo" value={profile.email} readOnly className="bg-muted/50 pl-9" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Por seguridad, el correo de acceso lo gestiona un administrador.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="perfil-rol">Rol dentro del sistema</Label>
                      <div className="relative"><ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="perfil-rol" value={roles[profile.role] || profile.role} readOnly className="bg-muted/50 pl-9" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Los permisos no se cambian desde el perfil.</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="mb-4 flex items-center gap-2 font-semibold"><BriefcaseBusiness className="h-5 w-5 text-primary" /> Presentación profesional</div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="perfil-cargo">Cargo o especialidad</Label>
                        <Input id="perfil-cargo" placeholder="Ej. Coordinador de obras eléctricas" maxLength={100}
                          value={draft.headline} onChange={e => setDraft(d => ({ ...d, headline: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="perfil-bio">Acerca de mí</Label>
                          <span className="text-xs tabular-nums text-muted-foreground">{draft.bio.length}/500</span>
                        </div>
                        <Textarea id="perfil-bio" rows={4} maxLength={500} placeholder="Cuéntale al equipo a qué te dedicas o en qué puedes ayudar..."
                          value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} className="resize-y" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                    <p className="text-xs text-muted-foreground">Solo tú puedes modificar tus datos personales.</p>
                    <Button type="submit" disabled={saving} className="gap-2 min-w-[150px]">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CircleUserRound className="h-5 w-5 text-primary" /> Estado de mi cuenta</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant={profile.isActive ? "secondary" : "destructive"} className="gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${profile.isActive ? "bg-emerald-500" : "bg-destructive-foreground"}`} />
                    {profile.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Acceso</span><span className="font-medium">{roles[profile.role] || profile.role}</span></div>
                <Separator />
                <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /> Miembro desde</span><span className="font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-CO", { month: "short", year: "numeric" }) : "—"}</span></div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><LockKeyhole className="h-5 w-5 text-primary" /> Seguridad</CardTitle>
                <CardDescription>Actualiza tu contraseña sin depender de un administrador.</CardDescription>
              </CardHeader>
              <CardContent>
                {!showSecurity ? (
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setShowSecurity(true)}>
                    <KeyRound className="h-4 w-4" /> Cambiar contraseña
                  </Button>
                ) : (
                  <form onSubmit={changePassword} className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="actual-pass">Contraseña actual</Label>
                      <Input id="actual-pass" type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2"><Label htmlFor="nueva-pass">Contraseña nueva</Label>
                      <Input id="nueva-pass" type="password" autoComplete="new-password" minLength={8} required placeholder="Mínimo 8 caracteres"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2"><Label htmlFor="confirm-pass">Confirmar contraseña</Label>
                      <Input id="confirm-pass" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" disabled={changingPassword} onClick={() => { setShowSecurity(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancelar</Button>
                      <Button type="submit" disabled={changingPassword} className="flex-1 gap-2">{changingPassword && <Loader2 className="h-4 w-4 animate-spin" />} Actualizar</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
            <div className="rounded-2xl border bg-muted/30 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Tu espacio, tu información</div>
              <p className="text-xs leading-relaxed text-muted-foreground">Tu foto, nombre y datos de contacto se guardan en tu cuenta. Los permisos y el rol solo los gestiona la administración de DMRE Electric.</p>
            </div>
          </div>
        </div>
      </>) : null}
    </div>
  );
}
