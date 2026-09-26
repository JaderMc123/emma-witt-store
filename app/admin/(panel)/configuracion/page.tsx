"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Field, Loading, PageHeader, Panel, useToast } from "@/components/admin/ui";
import { Logo } from "@/components/ui/Logo";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges, uploadImage } from "@/lib/admin";
import type { StoreSettings } from "@/types";

type Key = keyof StoreSettings;

function ImageField({ label, value, onChange, folder, hint, round }: { label: string; value: string | null; onChange: (url: string | null) => void; folder: string; hint?: string; round?: boolean }) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => ref.current?.click()} className={`${round ? "h-20 w-20 rounded-full" : "h-24 w-40 rounded-[14px]"} overflow-hidden bg-mist border border-dashed border-line hover:border-ink flex items-center justify-center text-[11px] text-stone shrink-0`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : busy ? "Subiendo…" : "Subir"}
        </button>
        <div className="flex flex-col gap-1 items-start">
          <button type="button" className="text-[12px] underline underline-offset-4" onClick={() => ref.current?.click()}>{value ? "Cambiar" : "Elegir archivo"}</button>
          {value ? <button type="button" className="text-[12px] text-stone underline underline-offset-4" onClick={() => onChange(null)}>Quitar</button> : null}
          {hint ? <p className="text-[12px] text-stone">{hint}</p> : null}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            const { url } = await uploadImage(f, folder, 2000);
            onChange(url);
          } catch (err) {
            toast(friendlyError((err as Error).message), "error");
          }
          setBusy(false);
        }}
      />
    </div>
  );
}

export default function SettingsAdmin() {
  const toast = useToast();
  const [s, setS] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    browserClient().from("store_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setS(data as StoreSettings));
  }, []);

  const set = (k: Key, v: unknown) => setS((prev) => (prev ? { ...prev, [k]: v } : prev));
  const text = (k: Key, props: Record<string, unknown> = {}) => (
    <input id={k} className="input" value={(s?.[k] as string) || ""} onChange={(e) => set(k, e.target.value || null)} {...props} />
  );

  const save = async () => {
    if (!s) return;
    if (s.whatsapp_number && s.whatsapp_number.replace(/\D/g, "").length < 10) return toast("Revisa el número de WhatsApp (ej. 300 123 4567)", "error");
    setSaving(true);
    const { id, ...rest } = s;
    void id;
    const { error } = await browserClient().from("store_settings").update({ ...rest, store_name: rest.store_name || "Emma WITT Collection" }).eq("id", 1);
    setSaving(false);
    if (error) return toast(friendlyError(error.message), "error");
    toast("Configuración guardada");
    publishChanges();
  };

  if (!s) return <Loading />;

  return (
    <>
      <PageHeader title="Configuración" eyebrow="Tienda" actions={<button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>} />

      {!s.whatsapp_number ? (
        <div className="mb-6 rounded-[18px] border border-dashed border-[#c9b27a] bg-[#faf5ea] px-5 py-4 text-[13.5px]">
          <strong className="font-medium">Configura tu número de WhatsApp</strong> para que los pedidos y botones lleguen a tu chat.
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="Marca">
          <div className="grid gap-5">
            <Field label="Nombre de la tienda" htmlFor="store_name">{text("store_name")}</Field>
            <Field label="Frase de marca" htmlFor="tagline">{text("tagline")}</Field>
            <ImageField label="Logo" value={s.logo_url} onChange={(v) => set("logo_url", v)} folder="brand" hint="PNG/SVG con fondo transparente. Si no subes uno, se usa el logotipo tipográfico." />
            {!s.logo_url ? <div className="rounded-[14px] bg-ivory border border-line/70 py-5 flex justify-center"><Logo /></div> : null}
            <ImageField label="Favicon" value={s.favicon_url} onChange={(v) => set("favicon_url", v)} folder="brand" round hint="Cuadrado, 512×512 px." />
            <Field label="Color de acento" htmlFor="accent_color" hint="Se usa en detalles puntuales (ofertas, stock bajo).">
              <div className="flex gap-3 items-center">
                <input type="color" value={s.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="h-[52px] w-[60px] rounded-[14px] border border-line bg-paper p-1" aria-label="Color de acento" />
                <input id="accent_color" className="input" value={s.accent_color} onChange={(e) => set("accent_color", e.target.value)} />
              </div>
            </Field>
          </div>
        </Panel>

        <Panel title="Contacto y redes">
          <div className="grid gap-5">
            <Field label="WhatsApp de la tienda" htmlFor="whatsapp_number" hint="Número colombiano de 10 dígitos o con indicativo (57…).">{text("whatsapp_number", { inputMode: "tel", placeholder: "300 123 4567" })}</Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Email" htmlFor="email">{text("email", { type: "email" })}</Field>
              <Field label="Teléfono" htmlFor="phone">{text("phone", { inputMode: "tel" })}</Field>
            </div>
            <Field label="Dirección" htmlFor="address">{text("address")}</Field>
            <Field label="Horario de atención" htmlFor="business_hours">{text("business_hours")}</Field>
            <Field label="Instagram" htmlFor="instagram_url">{text("instagram_url", { placeholder: "https://instagram.com/…" })}</Field>
            <Field label="Facebook" htmlFor="facebook_url" hint="Déjalo vacío para ocultarlo.">{text("facebook_url")}</Field>
            <Field label="TikTok" htmlFor="tiktok_url" hint="Déjalo vacío para ocultarlo.">{text("tiktok_url")}</Field>
          </div>
        </Panel>

        <Panel title="Inicio · Portada">
          <div className="grid gap-5">
            <ImageField label="Imagen principal" value={s.hero_image_url} onChange={(v) => set("hero_image_url", v)} folder="home" hint="Vertical, mínimo 1200 px de alto." />
            <Field label="Antetítulo" htmlFor="hero_eyebrow">{text("hero_eyebrow")}</Field>
            <Field label="Título" htmlFor="hero_title">{text("hero_title")}</Field>
            <Field label="Subtítulo" htmlFor="hero_subtitle">
              <textarea id="hero_subtitle" className="input" rows={2} value={s.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value || null)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Inicio · Editorial y Nosotros">
          <div className="grid gap-5">
            <ImageField label="Imagen editorial" value={s.editorial_image_url} onChange={(v) => set("editorial_image_url", v)} folder="home" />
            <Field label="Título editorial" htmlFor="editorial_title">{text("editorial_title")}</Field>
            <Field label="Texto editorial" htmlFor="editorial_text">
              <textarea id="editorial_text" className="input" rows={3} value={s.editorial_text || ""} onChange={(e) => set("editorial_text", e.target.value || null)} />
            </Field>
            <Field label="Texto de Nosotros" htmlFor="about_text">
              <textarea id="about_text" className="input" rows={5} value={s.about_text || ""} onChange={(e) => set("about_text", e.target.value || null)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Datos legales" description="Reemplazan los textos entre corchetes en las políticas.">
          <div className="grid gap-5">
            <Field label="Nombre legal de la empresa" htmlFor="legal_name">{text("legal_name")}</Field>
            <Field label="NIT" htmlFor="nit">{text("nit")}</Field>
            <p className="text-[12.5px] text-stone">También se usan dirección, email y teléfono de “Contacto”. <Link href="/admin/legal" className="underline underline-offset-4">Editar políticas →</Link></p>
          </div>
        </Panel>

        <Panel title="Tienda">
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Moneda" htmlFor="currency">{text("currency")}</Field>
              <Field label="País" htmlFor="country">{text("country")}</Field>
            </div>
            <Field label="Umbral “Últimas unidades”" htmlFor="low_stock_threshold" hint="Con este stock o menos se muestra “Últimas unidades”; con 0, “Agotado”.">
              <input id="low_stock_threshold" inputMode="numeric" className="input" value={s.low_stock_threshold} onChange={(e) => set("low_stock_threshold", Number(e.target.value.replace(/\D/g, "") || 0))} />
            </Field>
            <p className="text-[12.5px] text-stone">
              <Link href="/admin/envios" className="underline underline-offset-4">Envíos →</Link> · <Link href="/admin/configuracion/pagos" className="underline underline-offset-4">Métodos de pago →</Link>
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
      </div>
    </>
  );
}
