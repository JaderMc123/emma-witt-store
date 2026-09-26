"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminEmpty, Badge, ConfirmButton, Loading, PageHeader, useToast } from "@/components/admin/ui";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges } from "@/lib/admin";
import type { ProductFull } from "@/types";
import { cn, formatCOP } from "@/utils/format";

export default function ProductsAdmin() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductFull[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "activos" | "ocultos" | "demo">("todos");

  const load = useCallback(async () => {
    const { data } = await browserClient()
      .from("products")
      .select("*, category:categories(id,name,slug), images:product_images(*), variants:product_variants(*)")
      .order("created_at", { ascending: false });
    setProducts((data as ProductFull[]) || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => {
    if (!products) return [];
    const t = q.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "activos" && !p.active) return false;
      if (filter === "ocultos" && p.active) return false;
      if (filter === "demo" && !p.is_demo) return false;
      return !t || `${p.name} ${p.sku}`.toLowerCase().includes(t);
    });
  }, [products, q, filter]);

  const toggle = async (p: ProductFull, field: "active" | "featured") => {
    const { error } = await browserClient().from("products").update({ [field]: !p[field] }).eq("id", p.id);
    if (error) return toast(friendlyError(error.message), "error");
    setProducts((ps) => ps!.map((x) => (x.id === p.id ? { ...x, [field]: !p[field] } : x)));
    publishChanges();
  };

  const duplicate = async (p: ProductFull) => {
    const supabase = browserClient();
    const suffix = Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: `${p.name} (copia)`,
        slug: `${p.slug}-copia-${suffix}`.slice(0, 80),
        description: p.description,
        short_description: p.short_description,
        price: p.price,
        compare_price: p.compare_price,
        category_id: p.category_id,
        featured: false,
        active: false,
        is_demo: p.is_demo,
      })
      .select()
      .single();
    if (error || !data) return toast(friendlyError(error?.message), "error");
    if (p.images.length)
      await supabase.from("product_images").insert(p.images.map(({ url, storage_path, alt, sort_order, is_primary }) => ({ product_id: data.id, url, storage_path, alt, sort_order, is_primary })));
    if (p.variants.length)
      await supabase.from("product_variants").insert(
        p.variants.map(({ size, color, color_hex, active }) => ({ product_id: data.id, size, color, color_hex, stock: 0, active, sku: `${data.sku}-${color.slice(0, 3).toUpperCase()}-${size}` }))
      );
    toast("Producto duplicado (oculto, stock en 0)");
    load();
  };

  const remove = async (p: ProductFull) => {
    const supabase = browserClient();
    const paths = p.images.map((i) => i.storage_path).filter(Boolean) as string[];
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast(friendlyError(error.message), "error");
    for (const path of paths) {
      const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("storage_path", path);
      if (!count) await supabase.storage.from("media").remove([path]);
    }
    toast("Producto eliminado");
    setProducts((ps) => ps!.filter((x) => x.id !== p.id));
    publishChanges();
  };

  const demoCount = products?.filter((p) => p.is_demo).length || 0;

  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Productos" actions={<Link href="/admin/productos/nuevo" className="btn btn-primary btn-sm">Nuevo producto</Link>} />

      {demoCount ? (
        <div className="mb-6 rounded-[18px] border border-dashed border-[#c9b27a] bg-[#faf5ea] px-5 py-4 text-[13.5px] leading-relaxed">
          Tienes <strong className="font-medium">{demoCount} productos DEMO</strong> para visualizar la tienda. Reemplázalos o elimínalos antes de lanzar.
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input className="input sm:max-w-[320px] !min-h-[44px]" placeholder="Buscar por nombre o ID…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar productos" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["todos", "activos", "ocultos", "demo"] as const).map((f) => (
            <button key={f} type="button" className="chip !min-h-[44px] text-[12px] capitalize shrink-0" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {!products ? (
        <Loading />
      ) : !list.length ? (
        <AdminEmpty title={products.length ? "Sin resultados" : "Aún no hay productos"} action={<Link href="/admin/productos/nuevo" className="btn btn-primary btn-sm">Crear producto</Link>} />
      ) : (
        <ul className="grid gap-2.5">
          {list.map((p) => {
            const stock = p.variants.reduce((s, v) => s + (v.active ? v.stock : 0), 0);
            const img = [...p.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
            return (
              <li key={p.id} className={cn("rounded-[18px] bg-paper border border-line/70 p-3 sm:p-4 flex gap-4 items-center", !p.active && "opacity-60")}>
                <Link href={`/admin/productos/${p.id}`} className="h-[72px] w-[58px] rounded-xl bg-mist overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? <img src={img.url} alt="" className="h-full w-full object-cover" /> : null}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/productos/${p.id}`} className="text-[15px] hover:underline underline-offset-4">{p.name}</Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[12px] text-stone">
                    <span className="tabular-nums">{p.sku}</span>
                    <span>{p.category?.name || "Sin categoría"}</span>
                    <span className="tabular-nums text-ink">{formatCOP(p.price)}</span>
                    <span className={stock === 0 ? "text-danger" : undefined}>{stock} en stock</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.is_demo ? <Badge tone="warn">Demo</Badge> : null}
                    {p.featured ? <Badge tone="dark">Destacado</Badge> : null}
                    {!p.active ? <Badge>Oculto</Badge> : null}
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggle(p, "featured")}>{p.featured ? "Quitar destacado" : "Destacar"}</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggle(p, "active")}>{p.active ? "Ocultar" : "Activar"}</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => duplicate(p)}>Duplicar</button>
                  <ConfirmButton onConfirm={() => remove(p)} confirmLabel="Eliminar">Eliminar</ConfirmButton>
                </div>
                <details className="md:hidden relative">
                  <summary className="list-none h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-mist cursor-pointer" aria-label="Acciones">•••</summary>
                  <div className="absolute right-0 top-11 z-10 w-[190px] rounded-[16px] bg-paper border border-line p-1.5 shadow-lg flex flex-col">
                    <button type="button" className="btn btn-sm btn-ghost !justify-start" onClick={() => toggle(p, "featured")}>{p.featured ? "Quitar destacado" : "Destacar"}</button>
                    <button type="button" className="btn btn-sm btn-ghost !justify-start" onClick={() => toggle(p, "active")}>{p.active ? "Ocultar" : "Activar"}</button>
                    <button type="button" className="btn btn-sm btn-ghost !justify-start" onClick={() => duplicate(p)}>Duplicar</button>
                    <ConfirmButton onConfirm={() => remove(p)} confirmLabel="Eliminar">Eliminar</ConfirmButton>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
