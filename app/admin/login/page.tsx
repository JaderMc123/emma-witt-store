"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { browserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = browserClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setBusy(false);
      return;
    }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("Esta cuenta no tiene acceso al panel.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="min-h-dvh grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-sand overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/demo/hero.svg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[380px] slide-up">
          <div className="flex justify-center mb-12"><Logo size="md" /></div>
          <p className="eyebrow text-center mb-3">Administración</p>
          <h1 className="display text-[40px] text-center mb-10">Bienvenida de nuevo</h1>
          <form onSubmit={submit} className="grid gap-5">
            <div>
              <label className="field-label" htmlFor="email">Correo</label>
              <input id="email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Contraseña</label>
              <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error ? <p className="text-[13px] text-danger" role="alert">{error}</p> : null}
            <button className="btn btn-primary w-full mt-2" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
          </form>
        </div>
      </div>
    </main>
  );
}
