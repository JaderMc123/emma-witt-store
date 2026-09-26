"use client";

import { useEffect, useState } from "react";
import { ConfirmButton, Field, Loading, PageHeader, Panel, Switch, useToast } from "@/components/admin/ui";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges } from "@/lib/admin";
import { DEPARTMENTS } from "@/config/site";
import type { ShippingConfig, ShippingRate } from "@/types";
import { formatCOP } from "@/utils/format";

const digits = (s: string) => Number(s.replace(/\D/g, "") || 0);

export default function ShippingAdmin() {
  const toast = useToast();
  const [cfg, setCfg] = useState<ShippingConfig | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [draft, setDraft] = useState({ city: "", department: "", cost: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const supabase = browserClient();
    const [c, r] = await Promise.all([supabase.from("shipping_config").select("*").eq("id", 1).maybeSingle(), supabase.from("shipping_rates").select("*").order("city")]);
    setCfg(c.data as ShippingConfig);
    setRates((r.data as ShippingRate[]) || []);
  };
  useEffect(() => {
    load();
  }, []);

  const saveCfg = async () => {
    if (!cfg) return;
    setSaving(true);
    const { error } = await browserClient().from("shipping_config").update({
      national_enabled: cfg.national_enabled,
      national_cost: cfg.national_cost,
      free_shipping_enabled: cfg.free_shipping_enabled,
      free_shipping_threshold: cfg.free_shipping_threshold,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast(friendlyError(error.message), "error");
    toast("Configuración de envíos guardada");
    publishChanges();
  };

  const addRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.city.trim()) return toast("Escribe la ciudad", "error");
    const { error } = await browserClient().from("shipping_rates").insert({ city: draft.city.trim(), department: draft.department || null, cost: digits(draft.cost) });
    if (error) return toast(friendlyError(error.message), "error");
    setDraft({ city: "", department: "", cost: "" });
    toast("Tarifa agregada");
    load();
  };

  const patchRate = async (r: ShippingRate, patch: Partial<ShippingRate>) => {
    setRates((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
    const { error } = await browserClient().from("shipping_rates").update(patch).eq("id", r.id);
    if (error) toast(friendlyError(error.message), "error");
  };

  const removeRate = async (r: ShippingRate) => {
    const { error } = await browserClient().from("shipping_rates").delete().eq("id", r.id);
    if (error) return toast(friendlyError(error.message), "error");
    setRates((rs) => rs.filter((x) => x.id !== r.id));
  };

  if (!cfg) return <Loading />;

  return (
    <>
      <PageHeader title="Envíos" eyebrow="Tarifas y envío gratis" />
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="Reglas generales" description="Orden de cálculo: envío gratis → tarifa de la ciudad → tarifa nacional.">
          <div className="grid gap-6">
            <Switch checked={cfg.free_shipping_enabled} onChange={(v) => setCfg({ ...cfg, free_shipping_enabled: v })} label="Envío gratis desde un monto" />
            {cfg.free_shipping_enabled ? (
              <Field label="Envío gratis desde (COP)" htmlFor="free" hint={cfg.free_shipping_threshold === 0 ? "Con $0 todos los envíos son gratis." : undefined}>
                <input id="free" inputMode="numeric" className="input tabular-nums" value={cfg.free_shipping_threshold.toLocaleString("es-CO")} onChange={(e) => setCfg({ ...cfg, free_shipping_threshold: digits(e.target.value) })} />
              </Field>
            ) : null}
            <Switch checked={cfg.national_enabled} onChange={(v) => setCfg({ ...cfg, national_enabled: v })} label="Envío nacional" description="Para ciudades sin tarifa propia. Si lo apagas, solo se envía a las ciudades listadas." />
            {cfg.national_enabled ? (
              <Field label="Tarifa nacional (COP)" htmlFor="nat">
                <input id="nat" inputMode="numeric" className="input tabular-nums" value={cfg.national_cost.toLocaleString("es-CO")} onChange={(e) => setCfg({ ...cfg, national_cost: digits(e.target.value) })} />
              </Field>
            ) : null}
            <button className="btn btn-primary btn-sm justify-self-start" onClick={saveCfg} disabled={saving}>{saving ? "Guardando…" : "Guardar reglas"}</button>
          </div>
        </Panel>

        <Panel title="Tarifas por ciudad" description="Los cambios en la lista se guardan al instante.">
          <form onSubmit={addRate} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_110px_auto] gap-2 items-end mb-5">
            <input className="input !min-h-[44px]" placeholder="Ciudad" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} aria-label="Ciudad" />
            <select className="input !min-h-[44px]" value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} aria-label="Departamento">
              <option value="">Cualquier depto.</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input className="input !min-h-[44px] tabular-nums" inputMode="numeric" placeholder="Costo" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: e.target.value.replace(/\D/g, "") })} aria-label="Costo" />
            <button className="btn btn-outline btn-sm !min-h-[44px]">Agregar</button>
          </form>
          {rates.length ? (
            <ul className="divide-y divide-line/70">
              {rates.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px]">{r.city}</p>
                    <p className="text-[12px] text-stone">{r.department || "Cualquier departamento"}</p>
                  </div>
                  <input
                    aria-label={`Costo ${r.city}`}
                    inputMode="numeric"
                    className="input !min-h-[38px] !w-[110px] !rounded-[10px] !px-3 !text-[14px] tabular-nums"
                    defaultValue={r.cost.toLocaleString("es-CO")}
                    onBlur={(e) => digits(e.target.value) !== r.cost && patchRate(r, { cost: digits(e.target.value) })}
                  />
                  <input type="checkbox" aria-label="Activa" checked={r.active} onChange={(e) => patchRate(r, { active: e.target.checked })} className="h-5 w-5 accent-[#111]" />
                  <ConfirmButton onConfirm={() => removeRate(r)} confirmLabel="Eliminar">×</ConfirmButton>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13.5px] text-stone">Sin tarifas por ciudad: se usa la tarifa nacional ({formatCOP(cfg.national_cost)}).</p>
          )}
        </Panel>
      </div>
    </>
  );
}
