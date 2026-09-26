"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminEmpty, Badge, Loading, PageHeader } from "@/components/admin/ui";
import { IconWhatsApp } from "@/components/ui/Icons";
import { browserClient } from "@/lib/supabase/browser";
import { formatCOP, formatDate, waLink } from "@/utils/format";

type Customer = { id: string; name: string; phone: string; email: string | null; city: string | null; department: string | null; orders_count: number; total_spent: number; created_at: string; updated_at: string };

export default function CustomersAdmin() {
  const [list, setList] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recientes" | "valor" | "pedidos">("recientes");

  useEffect(() => {
    browserClient().from("customers").select("*").order("updated_at", { ascending: false }).limit(1000).then(({ data }) => setList((data as Customer[]) || []));
  }, []);

  const rows = useMemo(() => {
    if (!list) return [];
    const t = q.trim().toLowerCase();
    const f = list.filter((c) => !t || `${c.name} ${c.phone} ${c.email || ""} ${c.city || ""}`.toLowerCase().includes(t));
    if (sort === "valor") return [...f].sort((a, b) => b.total_spent - a.total_spent);
    if (sort === "pedidos") return [...f].sort((a, b) => b.orders_count - a.orders_count);
    return f;
  }, [list, q, sort]);

  const exportCsv = () => {
    const header = ["Nombre", "Teléfono", "Email", "Ciudad", "Departamento", "Pedidos", "Total", "Cliente desde"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...rows.map((c) => [c.name, c.phone, c.email, c.city, c.department, c.orders_count, c.total_spent, c.created_at.slice(0, 10)])].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Clientes" eyebrow={list ? `${list.length} personas` : undefined} actions={list?.length ? <button className="btn btn-outline btn-sm" onClick={exportCsv}>Exportar CSV</button> : null} />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input className="input sm:max-w-[340px] !min-h-[44px]" placeholder="Buscar nombre, teléfono, ciudad…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar clientes" />
        <div className="flex gap-2">
          {([["recientes", "Recientes"], ["valor", "Mayor valor"], ["pedidos", "Más pedidos"]] as const).map(([k, l]) => (
            <button key={k} className="chip !min-h-[44px] text-[12px]" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>
          ))}
        </div>
      </div>
      {!list ? (
        <Loading />
      ) : !rows.length ? (
        <AdminEmpty title={list.length ? "Sin resultados" : "Aún no hay clientes"} text="Se registran automáticamente con cada pedido." />
      ) : (
        <ul className="grid gap-2.5">
          {rows.map((c) => (
            <li key={c.id} className="rounded-[18px] bg-paper border border-line/70 p-4 sm:px-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex-1 min-w-[180px]">
                <p className="text-[15px] flex items-center gap-2">{c.name} {c.orders_count > 1 ? <Badge tone="dark">Recurrente</Badge> : null}</p>
                <p className="text-[12.5px] text-stone">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
              </div>
              <p className="text-[13px] text-stone w-[140px]">{c.city || "—"}</p>
              <p className="text-[13px] w-[90px]"><span className="tabular-nums">{c.orders_count}</span> pedidos</p>
              <p className="text-[14px] tabular-nums w-[110px]">{formatCOP(c.total_spent)}</p>
              <p className="text-[12px] text-stone w-[110px]">desde {formatDate(c.created_at)}</p>
              <a href={waLink(c.phone, `Hola ${c.name.split(" ")[0]} ✨`)} target="_blank" rel="noopener noreferrer" className="h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-mist" aria-label={`WhatsApp a ${c.name}`}>
                <IconWhatsApp size={18} />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-[12px] text-stone leading-relaxed max-w-2xl">
        Privacidad: solo guardamos los datos necesarios para gestionar pedidos. Si una persona solicita consultar, corregir o eliminar sus datos (Ley 1581 de 2012), puedes editarlos o eliminarlos desde Supabase o pedir ayuda al equipo técnico.
      </p>
    </>
  );
}
