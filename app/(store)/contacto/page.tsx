import type { Metadata } from "next";
import { IconInstagram, IconWhatsApp } from "@/components/ui/Icons";
import { getSettings } from "@/services/catalog";
import { waLink } from "@/utils/format";

export const revalidate = 60;
export const metadata: Metadata = { title: "Contacto", alternates: { canonical: "/contacto" } };

export default async function ContactPage() {
  const s = await getSettings();
  const rows = [
    s.email && { k: "Email", v: s.email, href: `mailto:${s.email}` },
    s.phone && { k: "Teléfono", v: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    s.address && { k: "Dirección", v: s.address },
    s.business_hours && { k: "Horario", v: s.business_hours },
  ].filter(Boolean) as { k: string; v: string; href?: string }[];

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-8 pt-10 sm:pt-16 grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-6 slide-up">
        <p className="eyebrow mb-5">Contacto</p>
        <h1 className="display text-[52px] sm:text-[80px] leading-[0.95]">Estamos para <span className="italic text-stone">acompañarte.</span></h1>
        <p className="mt-6 text-[16px] leading-relaxed text-stone max-w-md">
          Escríbenos por WhatsApp para asesoría de tallas, disponibilidad o el estado de tu pedido.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href={waLink(s.whatsapp_number, `Hola ${s.store_name} 👋`)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <IconWhatsApp size={18} /> Escribir por WhatsApp
          </a>
          {s.instagram_url ? (
            <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <IconInstagram size={18} /> Instagram
            </a>
          ) : null}
        </div>
      </div>
      <dl className="lg:col-span-5 lg:col-start-8 self-end border-t border-line/70">
        {rows.map((r) => (
          <div key={r.k} className="py-6 border-b border-line/70 grid grid-cols-3 gap-4">
            <dt className="eyebrow pt-1">{r.k}</dt>
            <dd className="col-span-2 text-[15px]">{r.href ? <a href={r.href} className="link-underline">{r.v}</a> : r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
