"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminEmpty, Loading, PageHeader, StatusBadge } from "@/components/admin/ui";
import { browserClient } from "@/lib/supabase/browser";
import { ORDER_STATUSES } from "@/config/site";
import type { Order } from "@/types";
import { formatCOP, formatDate } from "@/utils/format";

const PAGE = 30;

function OrdersInner() {
  const router = useRouter();
  const params = useSearchParams();
  const estado = params.get("estado") || "";
  const [q, setQ] = useState(params.get("q") || "");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let query = browserClient().from("orders").select("*").order("created_at", { ascending: false }).limit(limit + 1);
    if (estado) query = query.eq("status", estado);
    const term = (params.get("q") || "").trim();
    if (term) {
      const safe = term.replace(/[,%()]/g, " ");
      query = query.or(`order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%,city.ilike.%${safe}%`);
    }
    query.then(({ data }) => {
      const list = (data as Order[]) || [];
      setHasMore(list.length > limit);
      setOrders(list.slice(0, limit));
    });
  }, [estado, params, limit]);

  const go = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    router.replace(`/admin/pedidos?${next.toString()}`);
  };

  return (
    <>
      <PageHeader title="Pedidos" />
      <div className="flex flex-col gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); go({ q }); }} className="sm:max-w-[380px]">
          <input className="input !min-h-[44px]" placeholder="Buscar por #pedido, nombre, teléfono o ciudad" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedidos" />
        </form>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button className="chip !min-h-[40px] text-[12px] shrink-0" aria-pressed={!estado} onClick={() => go({ estado: "" })}>Todos</button>
          {ORDER_STATUSES.map((s) => (
            <button key={s.value} className="chip !min-h-[40px] text-[12px] shrink-0" aria-pressed={estado === s.value} onClick={() => go({ estado: s.value })}>{s.label}</button>
          ))}
        </div>
      </div>

      {!orders ? (
        <Loading />
      ) : !orders.length ? (
        <AdminEmpty title="No hay pedidos aquí" text={estado || params.get("q") ? "Prueba con otro filtro." : "Cuando una clienta compre, verás su pedido aquí."} />
      ) : (
        <>
          <div className="rounded-[22px] bg-paper border border-line/70 overflow-hidden">
            <ul className="divide-y divide-line/70">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[120px_1fr_140px_110px_110px] gap-x-4 gap-y-1 items-center px-4 sm:px-6 py-4 hover:bg-mist/50 transition">
                    <span className="text-[14px] tabular-nums">#{o.order_number}</span>
                    <span className="sm:hidden justify-self-end"><StatusBadge status={o.status} /></span>
                    <span className="min-w-0">
                      <span className="block text-[14px] truncate">{o.customer_name}</span>
                      <span className="block text-[12px] text-stone truncate">{o.city} · {o.customer_phone}</span>
                    </span>
                    <span className="text-[12px] text-stone sm:text-[13px]">{formatDate(o.created_at, true)}</span>
                    <span className="hidden sm:block"><StatusBadge status={o.status} /></span>
                    <span className="text-[14px] tabular-nums sm:text-right">{formatCOP(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {hasMore ? (
            <div className="mt-6 text-center">
              <button className="btn btn-outline btn-sm" onClick={() => setLimit((l) => l + PAGE)}>Cargar más</button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

export default function OrdersAdmin() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdersInner />
    </Suspense>
  );
}
