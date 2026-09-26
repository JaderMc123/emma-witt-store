"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEmpty, Loading, PageHeader, Panel, Stat, StatusBadge } from "@/components/admin/ui";
import { BarChart } from "@/components/admin/BarChart";
import { browserClient } from "@/lib/supabase/browser";
import { formatCOP, formatDate } from "@/utils/format";

type Dash = {
  sales_today: number; sales_week: number; sales_month: number; orders_month: number;
  pending_count: number; pending_value: number;
  daily: { day: string; total: number }[];
  recent_orders: { id: string; order_number: string; customer_name: string; city: string; total: number; status: string; created_at: string }[];
  top_products: { name: string; sku: string; units: number; revenue: number }[];
  low_stock: { product_id: string; name: string; sku: string; size: string; color: string; stock: number }[];
};

export default function Dashboard() {
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    browserClient().rpc("admin_dashboard").then(({ data, error }) => (error ? setErr(true) : setD(data as Dash)));
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  if (err) return <AdminEmpty title="No pudimos cargar el dashboard." text="Recarga la página en un momento." />;
  if (!d) return <Loading />;

  return (
    <>
      <PageHeader eyebrow={new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })} title={greet} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Ventas hoy" value={formatCOP(d.sales_today)} />
        <Stat label="Esta semana" value={formatCOP(d.sales_week)} />
        <Stat label="Este mes" value={formatCOP(d.sales_month)} sub={`${d.orders_month} pedidos`} />
        <Link href="/admin/pedidos?estado=pendiente" className="block">
          <Stat label="Pendientes" value={d.pending_count} sub={d.pending_count ? `${formatCOP(d.pending_value)} por confirmar →` : "Todo al día"} />
        </Link>
      </div>

      <Panel title="Últimos 14 días" description="Pedidos confirmados, pagados, en preparación, enviados o entregados." className="mt-4">
        <BarChart data={d.daily.map((x) => ({ label: new Date(x.day + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" }), value: Number(x.total) }))} />
      </Panel>

      <div className="grid lg:grid-cols-5 gap-4 mt-4">
        <Panel title="Pedidos recientes" className="lg:col-span-3" actions={<Link href="/admin/pedidos" className="text-[11px] tracking-[0.16em] uppercase link-underline">Ver todos</Link>}>
          {d.recent_orders.length ? (
            <ul className="divide-y divide-line/70 -my-2">
              {d.recent_orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-4 py-3.5 hover:opacity-70 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] truncate">{o.customer_name}</p>
                      <p className="text-[12px] text-stone">#{o.order_number} · {o.city} · {formatDate(o.created_at, true)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                    <span className="text-[14px] tabular-nums w-[92px] text-right">{formatCOP(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty title="Aún no hay pedidos" text="Aparecerán aquí en cuanto una clienta compre." />
          )}
        </Panel>

        <div className="lg:col-span-2 grid gap-4 content-start">
          <Panel title="Más vendidos · 30 días">
            {d.top_products.length ? (
              <ol className="space-y-3.5">
                {d.top_products.map((p, i) => (
                  <li key={p.sku} className="flex items-center gap-3">
                    <span className="display italic text-[22px] text-stone w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] truncate">{p.name}</p>
                      <p className="text-[12px] text-stone">{p.sku} · {p.units} und.</p>
                    </div>
                    <span className="text-[13px] tabular-nums">{formatCOP(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13.5px] text-stone">Sin ventas en los últimos 30 días.</p>
            )}
          </Panel>
          <Panel title="Stock bajo">
            {d.low_stock.length ? (
              <ul className="space-y-3">
                {d.low_stock.map((s, i) => (
                  <li key={i}>
                    <Link href={`/admin/productos/${s.product_id}`} className="flex items-center gap-3 hover:opacity-70">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] truncate">{s.name}</p>
                        <p className="text-[12px] text-stone">{s.color} · Talla {s.size}</p>
                      </div>
                      <span className={s.stock === 0 ? "text-[12px] text-danger" : "text-[12px] text-[#7a5b1e]"}>{s.stock === 0 ? "Agotado" : `${s.stock} und.`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-stone">Todo el inventario está en buen nivel.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
