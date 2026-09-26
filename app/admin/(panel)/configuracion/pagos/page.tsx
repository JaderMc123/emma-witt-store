"use client";

import { useEffect, useState } from "react";
import { Badge, Field, Loading, PageHeader, Panel, Switch, useToast } from "@/components/admin/ui";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError } from "@/lib/admin";
import { PAYMENT_PROVIDERS } from "@/services/payments";
import type { PaymentMethod } from "@/types";

const SECRET_KEYS: Record<string, { key: string; label: string }[]> = {
  wompi: [
    { key: "private_key", label: "Private Key" },
    { key: "integrity_secret", label: "Integrity Secret" },
    { key: "events_secret", label: "Events Secret (webhook)" },
  ],
  mercadopago: [
    { key: "access_token", label: "Access Token" },
    { key: "webhook_secret", label: "Webhook Secret" },
  ],
};

export default function PaymentsAdmin() {
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [secretStatus, setSecretStatus] = useState<Record<string, string>>({});
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [origin, setOrigin] = useState("");

  const load = async () => {
    const supabase = browserClient();
    const [{ data }, { data: st }] = await Promise.all([supabase.from("payment_methods").select("*").order("sort_order"), supabase.rpc("payment_secret_status")]);
    setMethods((data as PaymentMethod[]) || []);
    const map: Record<string, string> = {};
    ((st as { method_id: string; key_name: string; updated_at: string }[]) || []).forEach((s) => (map[`${s.method_id}.${s.key_name}`] = s.updated_at));
    setSecretStatus(map);
  };
  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

  const patch = (id: string, p: Partial<PaymentMethod>) => setMethods((ms) => ms!.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const save = async (m: PaymentMethod) => {
    const supabase = browserClient();
    if (m.enabled && !PAYMENT_PROVIDERS[m.id].implemented) return toast("Esta pasarela aún no está integrada; guarda las claves y déjala apagada.", "error");
    const { error } = await supabase.from("payment_methods").update({ name: m.name, description: m.description, enabled: m.enabled, environment: m.environment, public_config: m.public_config }).eq("id", m.id);
    if (error) return toast(friendlyError(error.message), "error");
    for (const { key } of SECRET_KEYS[m.id] || []) {
      const v = secrets[`${m.id}.${key}`];
      if (v !== undefined && v !== "") {
        const { error: e2 } = await supabase.rpc("set_payment_secret", { p_method: m.id, p_key: key, p_value: v });
        if (e2) return toast(friendlyError(e2.message), "error");
      }
    }
    setSecrets({});
    toast(`${m.name}: guardado`);
    load();
  };

  if (!methods) return <Loading />;
  const enabledCount = methods.filter((m) => m.enabled).length;

  return (
    <>
      <PageHeader title="Pagos" eyebrow="Métodos de pago" />
      <p className="text-[14px] text-stone max-w-2xl -mt-4 mb-8 leading-relaxed">
        La tienda funciona WhatsApp-first: el cliente crea el pedido y lo confirman por WhatsApp. Puedes activar transferencia o contra entrega. Wompi y Mercado Pago ya tienen su espacio seguro para claves; se activan cuando se integre su conexión.
      </p>
      <div className="grid gap-4">
        {methods.map((m) => {
          const provider = PAYMENT_PROVIDERS[m.id];
          const gateway = m.id === "wompi" || m.id === "mercadopago";
          return (
            <Panel
              key={m.id}
              title={m.name}
              actions={
                <div className="flex gap-1.5">
                  {m.enabled ? <Badge tone="ok">Activo</Badge> : <Badge>Inactivo</Badge>}
                  {!provider.implemented ? <Badge tone="warn">Próximamente</Badge> : null}
                </div>
              }
            >
              <div className="grid gap-5">
                <Switch
                  checked={m.enabled}
                  disabled={!provider.implemented || (m.enabled && enabledCount === 1)}
                  onChange={(v) => patch(m.id, { enabled: v })}
                  label="Mostrar en el checkout"
                  description={m.enabled && enabledCount === 1 ? "Debe haber al menos un método activo." : undefined}
                />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Nombre visible" htmlFor={`${m.id}-name`}>
                    <input id={`${m.id}-name`} className="input" value={m.name} onChange={(e) => patch(m.id, { name: e.target.value })} />
                  </Field>
                  <Field label="Descripción" htmlFor={`${m.id}-desc`}>
                    <input id={`${m.id}-desc`} className="input" value={m.description || ""} onChange={(e) => patch(m.id, { description: e.target.value })} />
                  </Field>
                </div>
                {m.id === "transfer" || m.id === "cod" ? (
                  <Field label="Instrucciones para el cliente" htmlFor={`${m.id}-ins`} hint="Se muestran en la confirmación del pedido.">
                    <textarea id={`${m.id}-ins`} className="input" rows={3} value={m.public_config?.instructions || ""} onChange={(e) => patch(m.id, { public_config: { ...m.public_config, instructions: e.target.value } })} />
                  </Field>
                ) : null}
                {gateway ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field label="Entorno" htmlFor={`${m.id}-env`}>
                        <select id={`${m.id}-env`} className="input" value={m.environment} onChange={(e) => patch(m.id, { environment: e.target.value as PaymentMethod["environment"] })}>
                          <option value="sandbox">Pruebas (sandbox)</option>
                          <option value="production">Producción</option>
                        </select>
                      </Field>
                      <Field label="Public Key" htmlFor={`${m.id}-pk`} hint="Esta sí es pública.">
                        <input id={`${m.id}-pk`} className="input" value={m.public_config?.public_key || ""} onChange={(e) => patch(m.id, { public_config: { ...m.public_config, public_key: e.target.value } })} />
                      </Field>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {(SECRET_KEYS[m.id] || []).map(({ key, label }) => {
                        const k = `${m.id}.${key}`;
                        return (
                          <Field key={k} label={label} htmlFor={k} hint={secretStatus[k] ? "Configurada · nunca se muestra. Escribe para reemplazarla." : "Sin configurar."}>
                            <input id={k} type="password" autoComplete="off" className="input" placeholder={secretStatus[k] ? "••••••••••••" : ""} value={secrets[k] || ""} onChange={(e) => setSecrets((s) => ({ ...s, [k]: e.target.value }))} />
                          </Field>
                        );
                      })}
                    </div>
                    <Field label="Webhook URL" htmlFor={`${m.id}-wh`} hint="Cópiala en el panel de la pasarela cuando se active la integración.">
                      <input id={`${m.id}-wh`} className="input !bg-mist" readOnly value={`${origin}/api/payments/webhook/${m.id}`} />
                    </Field>
                  </>
                ) : null}
                <button type="button" className="btn btn-primary btn-sm justify-self-start" onClick={() => save(m)}>Guardar</button>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
