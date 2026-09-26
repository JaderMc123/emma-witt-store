import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCheck, IconWhatsApp } from "@/components/ui/Icons";
import { freshClient } from "@/lib/supabase/public";
import { getSettings } from "@/services/catalog";
import { getProvider } from "@/services/payments";
import type { PaymentMethod, PublicOrder } from "@/types";
import { formatCOP, formatDate, waLink } from "@/utils/format";
import { orderWhatsAppMessage } from "@/utils/whatsapp";
import { ORDER_STATUSES } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const client = freshClient();
  const [orderRes, settings] = await Promise.all([
    valid ? client.rpc("get_order_public", { p_token: id }) : Promise.resolve({ data: null }),
    getSettings(),
  ]);
  const order = orderRes.data as PublicOrder | null;

  if (!order) {
    return (
      <EmptyState
        eyebrow="Pedido"
        title="No encontramos este pedido."
        text="Revisa el enlace o escríbenos por WhatsApp con tu número de pedido."
        cta="Volver a la tienda"
        href="/"
      />
    );
  }

  const { data: pm } = await client.from("payment_methods").select("*").eq("id", order.payment_method).maybeSingle();
  const step = pm ? await getProvider(order.payment_method).nextStep(pm as PaymentMethod, { orderNumber: order.order_number, total: order.total, token: id }) : { kind: "whatsapp" as const };
  const wa = waLink(settings.whatsapp_number, orderWhatsAppMessage({ storeName: settings.store_name, orderNumber: order.order_number, customer: order.customer_name, total: order.total }));
  const statusLabel = ORDER_STATUSES.find((s) => s.value === order.status)?.label || order.status;

  return (
    <div className="mx-auto max-w-[760px] px-4 sm:px-8 pt-14 sm:pt-20">
      <div className="text-center slide-up">
        <span className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-ink">
          <IconCheck size={26} />
        </span>
        <p className="eyebrow mb-4">Pedido recibido</p>
        <h1 className="display text-[40px] sm:text-[58px]">Gracias por comprar en {settings.store_name}.</h1>
        <div className="mt-8 inline-flex flex-col sm:flex-row gap-2 sm:gap-8 text-[13px] tracking-[0.14em] uppercase">
          <span>Pedido <strong className="font-medium">#{order.order_number}</strong></span>
          <span>Total <strong className="font-medium tabular-nums">{formatCOP(order.total)}</strong></span>
        </div>
      </div>

      {step.kind === "instructions" ? (
        <div className="mt-10 rounded-[22px] bg-sand/60 p-6 text-center">
          <p className="eyebrow !text-ink mb-3">{step.title}</p>
          <p className="text-[14px] leading-relaxed whitespace-pre-line">{step.body}</p>
        </div>
      ) : null}

      <div className="mt-10 text-center">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full sm:w-auto sm:min-w-[320px]">
          <IconWhatsApp size={18} /> Continuar por WhatsApp
        </a>
        <p className="mt-4 text-[13px] text-stone">Confirmaremos disponibilidad, pago y envío contigo.</p>
      </div>

      <section className="mt-16 rounded-[24px] bg-paper border border-line/70 p-6 sm:p-8">
        <div className="flex justify-between items-baseline mb-6">
          <p className="eyebrow !text-ink">Resumen</p>
          <p className="text-[12px] text-stone">{formatDate(order.created_at, true)} · {statusLabel}</p>
        </div>
        <ul className="space-y-4">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex gap-4 items-center">
              <div className="h-[72px] w-[58px] rounded-xl bg-mist overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {i.image_url ? <img src={i.image_url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px]">{i.name}</p>
                <p className="text-[12px] text-stone">{i.color} · Talla {i.size} · × {i.quantity} · <span className="tabular-nums">{i.sku}</span></p>
              </div>
              <p className="text-[14px] tabular-nums">{formatCOP(i.line_total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 pt-5 border-t border-line/70 space-y-2.5 text-[14px]">
          <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatCOP(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone">Envío a {order.city}</dt><dd className="tabular-nums">{order.shipping_cost === 0 ? "Gratis" : formatCOP(order.shipping_cost)}</dd></div>
          <div className="flex justify-between pt-3 border-t border-line/70 text-[16px]"><dt>Total</dt><dd className="tabular-nums">{formatCOP(order.total)}</dd></div>
        </dl>
      </section>

      <p className="mt-10 text-center">
        <Link href="/catalogo" className="text-[11.5px] tracking-[0.2em] uppercase link-underline">Seguir explorando</Link>
      </p>
    </div>
  );
}
