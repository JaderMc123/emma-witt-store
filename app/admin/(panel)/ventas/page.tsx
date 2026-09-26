"use client";

import { useEffect, useMemo, useState } from "react";
import { Loading, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { BarChart } from "@/components/admin/BarChart";
import { browserClient } from "@/lib/supabase/browser";
import { SOLD_STATUSES } from "@/config/site";
import { formatCOP } from "@/utils/format";

type Row = { id: string; total: number; status: string; city: string; created_at: string; customer_id: string | null; order_items: { product_name: string; sku: string; size: string; color: string; quantity: number; line_total: number }[] };

function Ranking({ title, data, money = false }: { title: string; data: [string, number][]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <Panel title={title}>
      {data.length ? (
        <ul className="space-y-3">
          {data.map(([k, v]) => (
            <li key={k}>
              <div className="flex justify-between text-[13.5px] mb-1.5">
                <span className="truncate pr-3">{k}</span>
                <span className="tabular-nums text-stone">{money ? formatCOP(v) : v}</span>
              </div>
              <div className="h-1.5 rounded-full bg-mist overflow-hidden">
                <div className="h-full rounded-full bg-ink" style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13.5px] text-stone">Sin datos en este periodo.</p>
      )}
    </Panel>
  );
}

export default function SalesAdmin() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    setRows(null);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    browserClient()
      .from("orders")
      .select("id,total,status,city,created_at,customer_id,order_items(product_name,sku,size,color,quantity,line_total)")
      .gte("created_at", since)
      .order("created_at")
      .limit(5000)
      .then(({ data }) => setRows((data as Row[]) || []));
  }, [days]);

  const s = useMemo(() => {
    if (!rows) return null;
    const sold = rows.filter((r) => SOLD_STATUSES.includes(r.status));
    const revenue = sold.reduce((a, r) => a + r.total, 0);
    const tally = (fn: (r: Row) => [string, number][]) => {
      const m = new Map<string, number>();
      sold.forEach((r) => fn(r).forEach(([k, v]) => m.set(k, (m.get(k) || 0) + v)));
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    };
    const byDay = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * 86400000).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" }), 0);
    sold.forEach((r) => {
      const k = new Date(r.created_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" });
      if (byDay.has(k)) byDay.set(k, (byDay.get(k) || 0) + r.total);
    });
    const customers = new Map<string, number>();
    sold.forEach((r) => r.customer_id && customers.set(r.customer_id, (customers.get(r.customer_id) || 0) + 1));
    return {
      revenue,
      count: sold.length,
      avg: sold.length ? Math.round(revenue / sold.length) : 0,
      cancelled: rows.filter((r) => r.status === "cancelado").length,
      pending: rows.filter((r) => r.status === "pendiente").length,
      recurring: [...customers.values()].filter((n) => n > 1).length,
      daily: [...byDay.entries()].map(([label, value]) => ({ label, value })),
      products: tally((r) => r.order_items.map((i) => [i.product_name, i.quantity])),
      sizes: tally((r) => r.order_items.map((i) => [`Talla ${i.size}`, i.quantity])),
      colors: tally((r) => r.order_items.map((i) => [i.color, i.quantity])),
      cities: tally((r) => [[r.city, r.total]]),
    };
  }, [rows, days]);

  return (
    <>
      <PageHeader
        title="Ventas"
        actions={
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button key={d} className="chip !min-h-[40px] text-[12px]" aria-pressed={days === d} onClick={() => setDays(d)}>{d} días</button>
            ))}
          </div>
        }
      />
      {!s ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Stat label="Ventas" value={formatCOP(s.revenue)} sub={`${s.count} pedidos`} />
            <Stat label="Ticket promedio" value={formatCOP(s.avg)} />
            <Stat label="Clientes recurrentes" value={s.recurring} />
            <Stat label="Cancelados" value={s.cancelled} sub={`${s.pending} pendientes`} />
          </div>
          <Panel title="Ventas por día" className="mt-4">
            <BarChart data={s.daily} />
          </Panel>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Ranking title="Productos más vendidos (unidades)" data={s.products} />
            <Ranking title="Ciudades (ventas)" data={s.cities} money />
            <Ranking title="Tallas más vendidas" data={s.sizes} />
            <Ranking title="Colores más vendidos" data={s.colors} />
          </div>
        </>
      )}
    </>
  );
}
