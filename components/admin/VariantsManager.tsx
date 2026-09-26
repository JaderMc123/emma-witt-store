"use client";

import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges } from "@/lib/admin";
import type { Variant } from "@/types";
import { useToast } from "./ui";
import { cn } from "@/utils/format";

type Row = { id?: string; key: string; size: string; color: string; color_hex: string; stock: string; active: boolean; sku: string };

const toRow = (v: Variant): Row => ({ id: v.id, key: v.id, size: v.size, color: v.color, color_hex: v.color_hex || "#111111", stock: String(v.stock), active: v.active, sku: v.sku || "" });

function parseSizes(input: string): string[] {
  const out: string[] = [];
  for (const part of input.split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      for (let i = Math.min(a, b); i <= Math.max(a, b) && out.length < 40; i++) out.push(String(i));
    } else out.push(part.toUpperCase());
  }
  return [...new Set(out)];
}

export function VariantsManager({ productId, productSku, variants, onSaved }: { productId: string; productSku: string; variants: Variant[]; onSaved: (v: Variant[]) => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(() =>
    [...variants].sort((a, b) => a.color.localeCompare(b.color) || (Number(a.size) || 0) - (Number(b.size) || 0)).map(toRow)
  );
  const [removed, setRemoved] = useState<string[]>([]);
  const [bulk, setBulk] = useState({ sizes: "35-40", color: "", hex: "#111111", stock: "0" });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (key: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const addBulk = () => {
    const color = bulk.color.trim();
    if (!color) return toast("Escribe el nombre del color", "error");
    const sizes = parseSizes(bulk.sizes);
    if (!sizes.length) return toast("Escribe las tallas (ej. 35-40 o 35,36,37)", "error");
    const existing = new Set(rows.map((r) => `${r.color.toLowerCase()}|${r.size}`));
    const fresh = sizes
      .filter((s) => !existing.has(`${color.toLowerCase()}|${s}`))
      .map((s) => ({ key: `new-${color}-${s}-${Math.random()}`, size: s, color, color_hex: bulk.hex, stock: bulk.stock || "0", active: true, sku: "" }));
    if (!fresh.length) return toast("Esas combinaciones ya existen", "error");
    setRows((rs) => [...rs, ...fresh]);
    setDirty(true);
  };

  const removeRow = (r: Row) => {
    setRows((rs) => rs.filter((x) => x.key !== r.key));
    if (r.id) setRemoved((ids) => [...ids, r.id!]);
    setDirty(true);
  };

  const save = async () => {
    const combos = new Set<string>();
    for (const r of rows) {
      const k = `${r.color.trim().toLowerCase()}|${r.size.trim()}`;
      if (!r.size.trim() || !r.color.trim()) return toast("Cada variante necesita talla y color", "error");
      if (combos.has(k)) return toast(`Variante repetida: ${r.color} talla ${r.size}`, "error");
      combos.add(k);
      if (!/^\d+$/.test(r.stock.trim())) return toast(`Stock inválido en ${r.color} ${r.size}`, "error");
    }
    setSaving(true);
    const supabase = browserClient();
    if (removed.length) {
      const { error } = await supabase.from("product_variants").delete().in("id", removed);
      if (error) {
        setSaving(false);
        return toast(friendlyError(error.message), "error");
      }
    }
    const payload = rows.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      product_id: productId,
      size: r.size.trim(),
      color: r.color.trim(),
      color_hex: r.color_hex,
      stock: Number(r.stock),
      active: r.active,
      sku: r.sku.trim() || `${productSku}-${r.color.trim().slice(0, 3).toUpperCase()}-${r.size.trim()}`,
    }));
    const existing = payload.filter((p) => "id" in p);
    const fresh = payload.filter((p) => !("id" in p));
    const results = await Promise.all([
      existing.length ? supabase.from("product_variants").upsert(existing).select() : Promise.resolve({ data: [], error: null }),
      fresh.length ? supabase.from("product_variants").insert(fresh).select() : Promise.resolve({ data: [], error: null }),
    ]);
    setSaving(false);
    const err = results.find((r) => r.error)?.error;
    if (err) return toast(friendlyError(err.message), "error");
    const all = [...(results[0].data || []), ...(results[1].data || [])] as Variant[];
    setRows(all.sort((a, b) => a.color.localeCompare(b.color) || (Number(a.size) || 0) - (Number(b.size) || 0)).map(toRow));
    setRemoved([]);
    setDirty(false);
    onSaved(all);
    publishChanges();
    toast("Tallas y stock guardados");
  };

  const total = rows.reduce((s, r) => s + (r.active ? Number(r.stock) || 0 : 0), 0);

  return (
    <div>
      <div className="rounded-[18px] bg-mist/60 p-4 sm:p-5 grid sm:grid-cols-[1.3fr_1.2fr_auto_0.7fr_auto] gap-3 items-end">
        <div>
          <label className="field-label" htmlFor="bulk-sizes">Tallas</label>
          <input id="bulk-sizes" className="input !min-h-[44px]" value={bulk.sizes} onChange={(e) => setBulk({ ...bulk, sizes: e.target.value })} placeholder="35-40 o 35,36,37" />
        </div>
        <div>
          <label className="field-label" htmlFor="bulk-color">Color</label>
          <input id="bulk-color" className="input !min-h-[44px]" value={bulk.color} onChange={(e) => setBulk({ ...bulk, color: e.target.value })} placeholder="Negro" />
        </div>
        <div>
          <label className="field-label" htmlFor="bulk-hex">Tono</label>
          <input id="bulk-hex" type="color" className="h-[44px] w-[52px] rounded-[12px] border border-line bg-paper p-1" value={bulk.hex} onChange={(e) => setBulk({ ...bulk, hex: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="bulk-stock">Stock c/u</label>
          <input id="bulk-stock" inputMode="numeric" className="input !min-h-[44px]" value={bulk.stock} onChange={(e) => setBulk({ ...bulk, stock: e.target.value.replace(/\D/g, "") })} />
        </div>
        <button type="button" className="btn btn-outline btn-sm !min-h-[44px]" onClick={addBulk}>Agregar</button>
      </div>

      {rows.length ? (
        <div className="mt-5 overflow-x-auto -mx-1">
          <table className="w-full text-[13.5px] min-w-[560px]">
            <thead>
              <tr className="text-left text-[10.5px] tracking-[0.16em] uppercase text-stone">
                <th className="font-normal py-2 px-1">Color</th>
                <th className="font-normal py-2 px-1 w-[80px]">Talla</th>
                <th className="font-normal py-2 px-1 w-[96px]">Stock</th>
                <th className="font-normal py-2 px-1">SKU</th>
                <th className="font-normal py-2 px-1 w-[70px]">Activa</th>
                <th className="w-[44px]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={cn("border-t border-line/60", !r.active && "opacity-50")}>
                  <td className="py-2 px-1">
                    <div className="flex items-center gap-2">
                      <input type="color" aria-label="Tono" value={r.color_hex} onChange={(e) => update(r.key, { color_hex: e.target.value })} className="h-8 w-8 rounded-full border border-line bg-transparent p-0.5 shrink-0" />
                      <input aria-label="Color" className="input !min-h-[38px] !rounded-[10px] !px-3 !text-[14px]" value={r.color} onChange={(e) => update(r.key, { color: e.target.value })} />
                    </div>
                  </td>
                  <td className="py-2 px-1"><input aria-label="Talla" className="input !min-h-[38px] !rounded-[10px] !px-3 !text-[14px]" value={r.size} onChange={(e) => update(r.key, { size: e.target.value })} /></td>
                  <td className="py-2 px-1">
                    <input
                      aria-label="Stock"
                      inputMode="numeric"
                      className={cn("input !min-h-[38px] !rounded-[10px] !px-3 !text-[14px] tabular-nums", r.stock === "0" && "!text-danger")}
                      value={r.stock}
                      onChange={(e) => update(r.key, { stock: e.target.value.replace(/\D/g, "") })}
                    />
                  </td>
                  <td className="py-2 px-1"><input aria-label="SKU" className="input !min-h-[38px] !rounded-[10px] !px-3 !text-[13px]" placeholder="automático" value={r.sku} onChange={(e) => update(r.key, { sku: e.target.value })} /></td>
                  <td className="py-2 px-1 text-center"><input type="checkbox" aria-label="Activa" checked={r.active} onChange={(e) => update(r.key, { active: e.target.checked })} className="h-5 w-5 accent-[#111]" /></td>
                  <td className="py-2 px-1 text-right">
                    <button type="button" onClick={() => removeRow(r)} className="h-9 w-9 rounded-full hover:bg-mist text-danger" aria-label="Eliminar variante">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 text-[13.5px] text-stone">Agrega tallas y colores. Sin variantes activas, el producto aparece como agotado.</p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-stone">{rows.length} variantes · {total} unidades en stock</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving || !dirty}>
          {saving ? "Guardando…" : dirty ? "Guardar tallas y stock" : "Guardado"}
        </button>
      </div>
    </div>
  );
}
