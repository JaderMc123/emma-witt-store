"use client";

import { useState } from "react";
import { Field, PageHeader, Panel, useToast } from "@/components/admin/ui";
import { browserClient } from "@/lib/supabase/browser";

export default function AccountPage() {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return toast("Usa al menos 10 caracteres", "error");
    if (pw !== pw2) return toast("Las contraseñas no coinciden", "error");
    setBusy(true);
    const { error } = await browserClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast("No se pudo cambiar la contraseña", "error");
    setPw("");
    setPw2("");
    toast("Contraseña actualizada");
  };

  return (
    <>
      <PageHeader title="Mi cuenta" />
      <Panel title="Cambiar contraseña" className="max-w-[520px]">
        <form onSubmit={save} className="grid gap-5">
          <Field label="Nueva contraseña" htmlFor="pw">
            <input id="pw" type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label="Repetir contraseña" htmlFor="pw2">
            <input id="pw2" type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
          <button className="btn btn-primary btn-sm justify-self-start" disabled={busy}>{busy ? "Guardando…" : "Actualizar contraseña"}</button>
        </form>
      </Panel>
    </>
  );
}
