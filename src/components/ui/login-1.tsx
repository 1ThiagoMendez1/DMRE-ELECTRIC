"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Eye, EyeOff,
  Fingerprint, KeyRound, LockKeyhole, Mail, ShieldCheck, Zap, Loader2,
} from "lucide-react";

export default function StartLoginOne() {
  const router = useRouter();
  const [linkError, setLinkError] = useState(false);
  useEffect(() => { setLinkError(new URLSearchParams(window.location.search).has("error")); }, []);
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"login" | "recovery">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw authError;
      // La sesión ya se almacenó en cookies antes de navegar.
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesión. Verifica tu correo y contraseña e inténtalo nuevamente.");
      setLoading(false);
    }
  };

  const handleRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/auth/actualizar-contrasena` }
      );
      if (resetError) throw resetError;
      setRecoverySent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(/rate.limit|too.many|over.email/i.test(message)
        ? "Se alcanzó el límite de correos. Inténtalo más tarde."
        : "No fue posible enviar el enlace. Comprueba tu correo e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const goTo = (next: "login" | "recovery") => {
    setMode(next);
    setError(null);
    setRecoverySent(false);
  };

  return (
    <main className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#050914] px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50"
        style={{ backgroundImage: "radial-gradient(circle at 12% 18%, rgba(18,135,175,.14), transparent 33%), radial-gradient(circle at 90% 86%, rgba(10,180,135,.10), transparent 38%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.16]"
        style={{ backgroundImage: "radial-gradient(#8aa1b7 0.6px, transparent 0.6px)", backgroundSize: "25px 25px" }} />

      <div className="relative w-full max-w-[1150px]">
        <div className="mb-5 flex items-center justify-between gap-3 px-1 text-xs text-slate-400">
          <Link href="/" className="inline-flex items-center gap-2 font-medium transition-colors hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al sitio web
          </Link>
          <span className="hidden items-center gap-2 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Acceso al sistema de gestión</span>
        </div>

        <div className="grid min-h-[625px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1321] shadow-[0_35px_100px_rgba(0,0,0,.5)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
          <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            <div className="mb-9 flex items-center gap-3">
              <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
                <Image src="/logo.png" fill sizes="56px" priority alt="Logo DMRE Electric" className="object-contain p-1.5" />
              </div>
              <div>
                <div className="text-lg font-black leading-tight tracking-[.18em] text-white">D.M.R.E</div>
                <p className="text-[10px] font-medium uppercase tracking-[.2em] text-cyan-300/85">Electric · Plataforma ERP</p>
              </div>
            </div>

            {mode === "login" ? (
              <>
                <div className="mb-7">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[.07] px-3 py-1 text-[11px] font-semibold tracking-wide text-cyan-200">
                    <Fingerprint className="h-3.5 w-3.5" /> Acceso personal
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[40px] sm:leading-[1.13]">Bienvenido de nuevo<span className="text-cyan-400">.</span></h1>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">Continúa con tus proyectos, recursos y operaciones desde un solo lugar.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="dmre-email" className="text-xs font-semibold text-slate-200">Correo electrónico</label>
                    <div className="group relative">
                      <Mail aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400" />
                      <input id="dmre-email" type="email" name="email" autoComplete="username" required
                        value={email} onChange={e => setEmail(e.target.value)} placeholder="tu.correo@empresa.com"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[.045] pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[.07] focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="dmre-password" className="text-xs font-semibold text-slate-200">Contraseña</label>
                      <button type="button" onClick={() => goTo("recovery")} className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200 hover:underline">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="group relative">
                      <LockKeyhole aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400" />
                      <input id="dmre-password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" required
                        value={password} onChange={e => setPassword(e.target.value)} placeholder="Ingresa tu contraseña"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[.045] pl-12 pr-12 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[.07] focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-60" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={showPassword} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error || linkError ? (
                    <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/[.08] px-4 py-3 text-sm text-rose-200">
                      {error || "El enlace de acceso ya no es válido. Solicita uno nuevo."}
                    </div>
                  ) : null}

                  <button type="submit" disabled={loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0cacc5] to-[#079b9f] px-5 text-sm font-bold text-white shadow-[0_8px_26px_rgba(6,182,212,.18)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1321] disabled:cursor-wait disabled:opacity-70">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Validando acceso..." : "Ingresar al panel"}
                    {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </button>
                </form>
              </>
            ) : (
              <>
                <button type="button" onClick={() => goTo("login")} className="mb-7 inline-flex w-fit items-center gap-2 text-xs text-slate-400 transition-colors hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
                </button>
                {recoverySent ? (
                  <div className="space-y-4">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <h1 className="text-3xl font-bold text-white">Revisa tu correo</h1>
                    <p className="text-sm leading-relaxed text-slate-400">Si existe una cuenta asociada a <strong className="break-all text-white">{email}</strong>, recibirás las instrucciones para recuperar el acceso.</p>
                    <button type="button" onClick={() => goTo("login")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-bold text-slate-950">Volver a ingresar <ArrowRight className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><KeyRound className="h-6 w-6" /></span>
                    <h1 className="text-3xl font-bold text-white">Recuperar acceso</h1>
                    <p className="mb-7 mt-3 text-sm leading-relaxed text-slate-400">Ingresa tu correo de la plataforma y te enviaremos las instrucciones para restablecer la contraseña.</p>
                    <form onSubmit={handleRecovery} className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="recovery-email" className="text-xs font-semibold text-slate-200">Correo de tu cuenta</label>
                        <input id="recovery-email" type="email" autoComplete="email" required value={email}
                          onChange={e => setEmail(e.target.value)} placeholder="tu.correo@empresa.com"
                          className="h-12 w-full rounded-xl border border-white/15 bg-white/[.045] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10" />
                      </div>
                      {error ? <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
                      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Enviar enlace de recuperación
                      </button>
                    </form>
                  </>
                )}
              </>
            )}

            <div className="mt-10 flex items-center gap-2 border-t border-white/[.08] pt-5 text-[11px] text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/80" />
              Acceso protegido para usuarios autorizados
            </div>
          </div>

          <div className="relative hidden min-h-[620px] overflow-hidden bg-[#06202b] lg:block">
            <Image
              src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1550&q=84"
              fill priority alt="Torres de transmisión eléctrica al atardecer"
              sizes="(max-width: 1024px) 0px, 54vw" className="object-cover object-center" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#03111c] via-[#051825]/40 to-[#061524]/20" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0c1321]/30 via-transparent to-transparent" />
            <div className="absolute left-9 right-9 top-9 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/35 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-white backdrop-blur-md">
                <Zap className="h-3.5 w-3.5 text-cyan-300" /> DMRE Electric
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                Gestión integrada <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-9 pb-12 xl:p-12">
              <div className="mb-5 h-0.5 w-12 rounded-full bg-cyan-400" />
              <p className="mb-4 max-w-[500px] text-[clamp(2rem,3vw,2.8rem)] font-bold leading-[1.15] tracking-tight text-white">
                La energía de tus proyectos, bajo control.
              </p>
              <p className="max-w-md text-sm leading-relaxed text-slate-200/85">Una experiencia centralizada para administrar la operación, coordinar equipos y tomar mejores decisiones.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["Proyectos", "Logística", "Finanzas"].map(value => (
                  <span key={value} className="rounded-full border border-white/20 bg-white/[.08] px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">{value}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-[11px] text-slate-600">© {new Date().getFullYear()} DMRE Electric · Plataforma de gestión empresarial</p>
      </div>
    </main>
  );
}
