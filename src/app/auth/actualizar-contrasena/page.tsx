"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [sending, setSending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setAuthorized(Boolean(user));
      setReady(true);
    }).catch(() => {
      if (active) { setAuthorized(false); setReady(true); }
    });
    return () => { active = false; };
  }, [supabase]);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Utiliza una contraseña de al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSending(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setCompleted(true);
      setPassword("");
      setConfirm("");
      await supabase.auth.signOut();
    } catch {
      setError("No se pudo cambiar la contraseña. Solicita un nuevo enlace e inténtalo nuevamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#050914] px-4 py-8 text-slate-100"
      style={{ backgroundImage: "radial-gradient(circle at 10% 20%, rgba(10,180,210,.12), transparent 38%), radial-gradient(circle at 90% 80%, rgba(14,165,132,.09), transparent 40%)" }}>
      <div className="w-full max-w-[480px] rounded-[28px] border border-white/10 bg-[#0c1321] p-7 shadow-2xl sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5"><Image src="/logo.png" fill sizes="48px" alt="DMRE Electric" className="object-contain p-1" /></div>
          <div><p className="font-extrabold tracking-[.18em]">D.M.R.E</p><p className="text-[10px] uppercase tracking-widest text-cyan-300">Seguridad de cuenta</p></div>
        </div>

        {!ready ? (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-300"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> Comprobando el enlace...</div>
        ) : completed ? (
          <div className="space-y-5">
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="h-7 w-7" /></span>
            <h1 className="text-2xl font-bold">Contraseña actualizada</h1>
            <p className="text-sm text-slate-400">Ya puedes ingresar con tu nueva contraseña.</p>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-xl bg-cyan-500 font-bold text-slate-950 transition hover:bg-cyan-400">Ir a inicio de sesión</Link>
          </div>
        ) : !authorized ? (
          <div className="space-y-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-300"><ShieldCheck className="h-6 w-6" /></span>
            <h1 className="text-2xl font-bold">Enlace vencido o inválido</h1>
            <p className="text-sm leading-relaxed text-slate-400">Por seguridad, necesitas un enlace de recuperación válido para cambiar la contraseña.</p>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-xl bg-cyan-500 font-semibold text-slate-950">Solicitar otro enlace</Link>
          </div>
        ) : (
          <>
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-cyan-500/10 text-cyan-300"><KeyRound className="h-6 w-6" /></span>
            <h1 className="text-2xl font-bold">Define una nueva contraseña</h1>
            <p className="mb-7 mt-2 text-sm leading-relaxed text-slate-400">Elige una clave segura para continuar utilizando tu cuenta DMRE.</p>
            <form onSubmit={updatePassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="new-pass" className="text-xs font-semibold text-slate-200">Nueva contraseña</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input id="new-pass" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres"
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-11 pr-12 text-sm text-white outline-none focus:border-cyan-400" />
                  <button type="button" onClick={() => setShow(v => !v)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-slate-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-pass" className="text-xs font-semibold text-slate-200">Confirmar contraseña</label>
                <input id="confirm-pass" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Repite tu nueva clave"
                  className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-400" />
              </div>
              {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
              <button type="submit" disabled={sending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar nueva contraseña
              </button>
            </form>
          </>
        )}
        <p className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-500"><ShieldCheck className="h-4 w-4" /> Recuperación protegida de cuenta</p>
      </div>
    </main>
  );
}
