"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminEmpty, Badge, ConfirmButton, Field, Loading, PageHeader, Panel, Switch, useToast } from "@/components/admin/ui";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges, uploadImage } from "@/lib/admin";
import type { Category } from "@/types";
import { slugify } from "@/utils/format";

type Edit = { id?: string; name: string; slug: string; description: string; image_url: string; active: boolean };
const EMPTY: Edit = { name: "", slug: "", description: "", image_url: "", active: true };

export default function CategoriesAdmin() {
  const toast = useToast();
  const [cats, setCats] = useState<(Category & { count: number })[] | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const supabase = browserClient();
    const [{ data }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("category_id"),
    ]);
    const counts = new Map<string, number>();
    (prods || []).forEach((p: { category_id: string | null }) => p.category_id && counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1));
    setCats(((data as Category[]) || []).map((c) => ({ ...c, count: counts.get(c.id) || 0 })));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const slug = slugify(edit.slug || edit.name);
    if (!edit.name.trim() || !slug) return toast("Escribe el nombre", "error");
    setBusy(true);
    const payload = { name: edit.name.trim(), slug, description: edit.description.trim() || null, image_url: edit.image_url || null, active: edit.active };
    const supabase = browserClient();
    const res = edit.id
      ? await supabase.from("categories").update(payload).eq("id", edit.id)
      : await supabase.from("categories").insert({ ...payload, sort_order: (cats?.length || 0) + 1 });
    setBusy(false);
    if (res.error) return toast(friendlyError(res.error.message), "error");
    toast(edit.id ? "Categoría actualizada" : "Categoría creada");
    setEdit(null);
    load();
    publishChanges();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    if (!cats) return;
    const list = [...cats];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    setCats(list);
    const supabase = browserClient();
    await Promise.all(list.map((c, i) => supabase.from("categories").update({ sort_order: i + 1 }).eq("id", c.id)));
    publishChanges();
  };

  const toggle = async (c: Category) => {
    const { error } = await browserClient().from("categories").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast(friendlyError(error.message), "error");
    load();
    publishChanges();
  };

  const remove = async (c: Category & { count: number }) => {
    const { error } = await browserClient().from("categories").delete().eq("id", c.id);
    if (error) return toast(friendlyError(error.message), "error");
    toast(c.count ? `Categoría eliminada; ${c.count} productos quedaron sin categoría` : "Categoría eliminada");
    load();
    publishChanges();
  };

  const onImage = async (file?: File) => {
    if (!file || !edit) return;
    setBusy(true);
    try {
      const { url } = await uploadImage(file, "categories", 800);
      setEdit({ ...edit, image_url: url });
    } catch (e) {
      toast(friendlyError((e as Error).message), "error");
    }
    setBusy(false);
  };

  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Categorías" actions={<button className="btn btn-primary btn-sm" onClick={() => setEdit({ ...EMPTY })}>Nueva categoría</button>} />

      {edit ? (
        <Panel title={edit.id ? "Editar categoría" : "Nueva categoría"} className="mb-6">
          <form onSubmit={save} className="grid sm:grid-cols-[140px_1fr] gap-6">
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} className="h-[140px] w-[140px] rounded-full overflow-hidden bg-mist border border-dashed border-line hover:border-ink flex items-center justify-center text-[11px] tracking-[0.14em] uppercase text-stone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {edit.image_url ? <img src={edit.image_url} alt="" className="h-full w-full object-cover" /> : busy ? "Subiendo…" : "Imagen"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onImage(e.target.files?.[0])} />
              {edit.image_url ? <button type="button" className="mt-2 text-[12px] text-stone underline" onClick={() => setEdit({ ...edit, image_url: "" })}>Quitar imagen</button> : null}
            </div>
            <div className="grid gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Nombre" htmlFor="cname">
                  <input id="cname" className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value, slug: edit.id ? edit.slug : slugify(e.target.value) })} required />
                </Field>
                <Field label="URL" htmlFor="cslug" hint={`/categoria/${slugify(edit.slug || edit.name) || "…"}`}>
                  <input id="cslug" className="input" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} />
                </Field>
              </div>
              <Field label="Descripción" htmlFor="cdesc">
                <input id="cdesc" className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </Field>
              <Switch checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Visible en la tienda" />
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "…" : "Guardar"}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>Cancelar</button>
              </div>
            </div>
          </form>
        </Panel>
      ) : null}

      {!cats ? (
        <Loading />
      ) : !cats.length ? (
        <AdminEmpty title="Sin categorías" text="Crea la primera para organizar tu catálogo." />
      ) : (
        <ul className="grid gap-2.5">
          {cats.map((c, i) => (
            <li key={c.id} className="rounded-[18px] bg-paper border border-line/70 p-3 sm:p-4 flex items-center gap-4">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-7 w-7 rounded-full hover:bg-mist disabled:opacity-20" aria-label="Subir">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="h-7 w-7 rounded-full hover:bg-mist disabled:opacity-20" aria-label="Bajar">↓</button>
              </div>
              <div className="h-14 w-14 rounded-full overflow-hidden bg-mist shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px]">{c.name}</p>
                <p className="text-[12px] text-stone truncate">/categoria/{c.slug} · {c.count} productos</p>
              </div>
              {!c.active ? <Badge>Oculta</Badge> : null}
              <div className="flex items-center gap-1">
                <button type="button" className="btn btn-sm btn-ghost hidden sm:inline-flex" onClick={() => toggle(c)}>{c.active ? "Ocultar" : "Activar"}</button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEdit({ id: c.id, name: c.name, slug: c.slug, description: c.description || "", image_url: c.image_url || "", active: c.active })}>Editar</button>
                <ConfirmButton onConfirm={() => remove(c)} confirmLabel="Eliminar">×</ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
