"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminEmpty, Loading, PageHeader, Panel, StatusBadge, useToast } from "@/components/admin/ui";
import { IconWhatsApp } from "@/components/ui/Icons";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges } from "@/lib/admin";
import { ORDER_STATUSES } from "@/config/site";
import type { Order, OrderItem } from "@/types";
import { cn, formatCOP, formatDate, waLink } from "@/utils/format";
import { adminOrderWhatsAppMessage } from "@/utils/whatsapp";

type History = { id: number; status: string; changed_by: string | null; changed_at: string };
const PM_LABEL: Record<string, string> = { whatsapp: "WhatsApp", transfer: "Transferencia", cod: "Contra entrega", wompi: "Wompi", mercadopago: "Mercado Pago" };

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [storeName, setStoreName] = useState("Emma WITT Collection");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const supabase = browserClient();
    const [o, it, h, s] = await Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase.from("order_status_history").select("*").eq("order_id", id).order("changed_at", { ascending: false }),
      supabase.from("store_settings").select("store_name").eq("id", 1).maybeSingle(),
    ]);
    setOrder(o.data as Order);
    setNotes((o.data as Order | null)?.admin_notes || "");
    setItems((it.data as OrderItem[]) || []);
    setHistory((h.data as History[]) || []);
    if (s.data?.store_name) setStoreName(s.data.store_name);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (status: string) => {
    if (!order || status === order.status) return;
    setSaving(true);
    const { error } = await browserClient().from("orders").update({ status }).eq("id", order.id);
    setSaving(false);
    if (error) return toast(friendlyError(error.message), "error");
    toast(status === "cancelado" ? "Pedido cancelado · stock devuelto" : `Estado: ${status}`);
    if (status === "cancelado") publishChanges();
    load();
  };

  const saveNotes = async () => {
    if (!order) return;
    const { error } = await browserClient().from("orders").update({ admin_notes: notes.trim() || null }).eq("id", order.id);
    if (error) return toast(friendlyError(error.message), "error");
    toast("Nota guardada");
  };

  if (loading) return <Loading />;
  if (!order) return <AdminEmpty title="Pedido no encontrado" action={<Link href="/admin/pedidos" className="btn btn-primary btn-sm">Volver</Link>} />;

  const wa = waLink(
    order.customer_phone,
    adminOrderWhatsAppMessage({ storeName, orderNumber: order.order_number, customer: order.customer_name, total: order.total, items, address: order.address, city: order.city })
  );
  const locked = order.status === "cancelado";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/pedidos", label: "Pedidos" }}
        eyebrow={formatDate(order.created_at, true)}
        title={`Pedido #${order.order_number}`}
        actions={
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
            <IconWhatsApp size={16} /> Contactar por WhatsApp
          </a>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid gap-4 content-start">
          <Panel title="Estado">
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={saving || locked}
                  onClick={() => setStatus(s.value)}
                  className={cn("chip text-[12.5px]", s.value === "cancelado" && order.status !== "cancelado" && "hover:!border-danger hover:!text-danger")}
                  aria-pressed={order.status === s.value}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[12.5px] text-stone mt-4 leading-relaxed">
              {locked
                ? "Este pedido fue cancelado y su stock se devolvió al inventario."
                : "Cancelar devuelve automáticamente las unidades al stock. Las ventas cuentan desde “Confirmado”."}
            </p>
          </Panel>

          <Panel title={`Productos · ${items.reduce((s, i) => s + i.quantity, 0)}`}>
            <ul className="divide-y divide-line/70 -my-2">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4 items-center py-3.5">
                  <div className="h-[72px] w-[58px] rounded-xl bg-mist overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {i.image_url ? <img src={i.image_url} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    {i.product_id ? <Link href={`/admin/productos/${i.product_id}`} className="text-[14px] hover:underline underline-offset-4">{i.product_name}</Link> : <p className="text-[14px]">{i.product_name}</p>}
                    <p className="text-[12.5px] text-stone">{i.sku} · {i.color} · Talla {i.size}</p>
                    <p className="text-[12.5px] text-stone tabular-nums">{formatCOP(i.unit_price)} × {i.quantity}</p>
                  </div>
                  <p className="text-[14px] tabular-nums">{formatCOP(i.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-line/70 grid gap-2 text-[14px]">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatCOP(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Envío</dt><dd className="tabular-nums">{order.shipping_cost ? formatCOP(order.shipping_cost) : "Gratis"}</dd></div>
              {order.discount ? <div className="flex justify-between"><dt className="text-stone">Descuento</dt><dd className="tabular-nums">−{formatCOP(order.discount)}</dd></div> : null}
              <div className="flex justify-between text-[17px] pt-2 border-t border-line/70"><dt>Total</dt><dd className="tabular-nums">{formatCOP(order.total)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Notas internas" description="Solo visibles para el equipo.">
            <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. pagó por Nequi, envío por Servientrega guía 000…" />
            <button type="button" className="btn btn-outline btn-sm mt-3" onClick={saveNotes}>Guardar nota</button>
          </Panel>
        </div>

        <div className="grid gap-4 content-start">
          <Panel title="Cliente">
            <p className="text-[15px]">{order.customer_name}</p>
            <a href={`tel:${order.customer_phone}`} className="block text-[14px] text-stone mt-1 tabular-nums">{order.customer_phone}</a>
            {order.customer_email ? <a href={`mailto:${order.customer_email}`} className="block text-[14px] text-stone mt-0.5 break-all">{order.customer_email}</a> : null}
          </Panel>
          <Panel title="Envío">
            <p className="text-[14px] leading-relaxed">
              {order.address}
              {order.neighborhood ? <><br />Barrio {order.neighborhood}</> : null}
              <br />
              {order.city}, {order.department}
            </p>
            {order.shipping_notes ? <p className="text-[13px] text-stone mt-3">Ref: {order.shipping_notes}</p> : null}
          </Panel>
          <Panel title="Pago">
            <div className="flex items-center justify-between">
              <span className="text-[14px]">{PM_LABEL[order.payment_method] || order.payment_method}</span>
              <StatusBadge status={order.payment_status} />
            </div>
          </Panel>
          <Panel title="Historial">
            <ol className="relative border-l border-line ml-1.5 space-y-4">
              {history.map((h) => (
                <li key={h.id} className="pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-ink" />
                  <p className="text-[13.5px] capitalize">{h.status}</p>
                  <p className="text-[12px] text-stone">{formatDate(h.changed_at, true)} · {h.changed_by || "sistema"}</p>
                </li>
              ))}
            </ol>
            <p className="text-[11.5px] text-stone mt-4">Aceptó términos y privacidad: {formatDate(order.accepted_at, true)}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
