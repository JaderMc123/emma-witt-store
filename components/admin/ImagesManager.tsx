"use client";

import { useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges, removeStorageObject, uploadImage } from "@/lib/admin";
import type { ProductImage } from "@/types";
import { useToast } from "./ui";
import { cn } from "@/utils/format";

export function ImagesManager({ productId, productName, images, onChange }: { productId: string; productName: string; images: ProductImage[]; onChange: (imgs: ProductImage[]) => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const persistOrder = async (list: ProductImage[]) => {
    const supabase = browserClient();
    const updated = list.map((img, i) => ({ ...img, sort_order: i }));
    onChange(updated);
    await Promise.all(updated.map((img) => supabase.from("product_images").update({ sort_order: img.sort_order }).eq("id", img.id)));
    publishChanges();
  };

  const upload = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setBusy(true);
    const supabase = browserClient();
    const added: ProductImage[] = [];
    let order = sorted.length;
    for (const file of arr) {
      if (file.size > 15 * 1024 * 1024) {
        toast(`${file.name}: supera 15 MB`, "error");
        continue;
      }
      try {
        const { url, path } = await uploadImage(file, `products/${productId}`);
        const isPrimary = sorted.length === 0 && added.length === 0;
        const { data, error } = await supabase
          .from("product_images")
          .insert({ product_id: productId, url, storage_path: path, alt: productName, sort_order: order++, is_primary: isPrimary })
          .select()
          .single();
        if (error) throw error;
        added.push(data as ProductImage);
      } catch (e) {
        toast(friendlyError((e as Error).message), "error");
      }
    }
    onChange([...images, ...added]);
    setBusy(false);
    if (added.length) {
      toast(added.length === 1 ? "Imagen subida" : `${added.length} imágenes subidas`);
      publishChanges();
    }
  };

  const setPrimary = async (img: ProductImage) => {
    const supabase = browserClient();
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", img.id);
    // la principal va primero
    const rest = sorted.filter((i) => i.id !== img.id);
    await persistOrder([{ ...img, is_primary: true }, ...rest.map((i) => ({ ...i, is_primary: false }))]);
    toast("Imagen principal actualizada");
  };

  const move = (idx: number, dir: -1 | 1) => {
    const list = [...sorted];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    persistOrder(list);
  };

  const remove = async (img: ProductImage) => {
    const supabase = browserClient();
    const { error } = await supabase.from("product_images").delete().eq("id", img.id);
    if (error) return toast(friendlyError(error.message), "error");
    await removeStorageObject(img.storage_path);
    let rest = sorted.filter((i) => i.id !== img.id);
    if (img.is_primary && rest.length) {
      await supabase.from("product_images").update({ is_primary: true }).eq("id", rest[0].id);
      rest = rest.map((r, i) => ({ ...r, is_primary: i === 0 }));
    }
    onChange(rest);
    publishChanges();
    toast("Imagen eliminada");
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", dragOver && "ring-2 ring-ink/20 rounded-[18px]")}
      >
        {sorted.map((img, i) => (
          <figure key={img.id} className="group relative aspect-[4/5] rounded-[16px] overflow-hidden bg-mist">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt || ""} className="h-full w-full object-cover" />
            {img.is_primary ? <span className="absolute top-2 left-2 rounded-full bg-ink text-ivory px-2.5 py-1 text-[9.5px] tracking-[0.16em] uppercase">Principal</span> : null}
            <figcaption className="absolute inset-x-2 bottom-2 flex flex-wrap gap-1 justify-center">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-9 w-9 rounded-full bg-paper/95 text-[14px] disabled:opacity-30" aria-label="Mover antes">←</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === sorted.length - 1} className="h-9 w-9 rounded-full bg-paper/95 text-[14px] disabled:opacity-30" aria-label="Mover después">→</button>
              {!img.is_primary ? (
                <button type="button" onClick={() => setPrimary(img)} className="h-9 px-3 rounded-full bg-paper/95 text-[10px] tracking-[0.12em] uppercase">Principal</button>
              ) : null}
              <button type="button" onClick={() => remove(img)} className="h-9 w-9 rounded-full bg-paper/95 text-danger text-[15px]" aria-label="Eliminar imagen">×</button>
            </figcaption>
          </figure>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="aspect-[4/5] rounded-[16px] border border-dashed border-line hover:border-ink transition flex flex-col items-center justify-center gap-2 text-stone hover:text-ink"
        >
          <span className="text-[28px] leading-none">{busy ? "…" : "+"}</span>
          <span className="text-[11px] tracking-[0.16em] uppercase">{busy ? "Subiendo" : "Subir fotos"}</span>
        </button>
      </div>
      <p className="mt-3 text-[12px] text-stone">JPG, PNG o WebP. Se optimizan automáticamente (WebP, máx. 1600 px). Arrastra y suelta o toca “Subir fotos”.</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
    </div>
  );
}
