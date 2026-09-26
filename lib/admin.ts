"use client";

import { browserClient } from "@/lib/supabase/browser";
import { optimizeImage } from "@/utils/image";

/** Refresca el caché de la tienda para que los cambios se vean al instante. */
export async function publishChanges() {
  try {
    await fetch("/api/revalidate", { method: "POST" });
  } catch {
    /* la tienda se actualiza sola en ≤60 s */
  }
}

export async function uploadImage(file: File, folder: string, maxSize = 1600) {
  const { blob, ext, type } = await optimizeImage(file, maxSize);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = browserClient();
  const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeStorageObject(path: string | null | undefined) {
  if (!path) return;
  const supabase = browserClient();
  // No borrar el archivo si otra imagen (p. ej. un producto duplicado) aún lo usa.
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("storage_path", path);
  if ((count || 0) > 0) return;
  await supabase.storage.from("media").remove([path]);
}

export function friendlyError(message?: string) {
  if (!message) return "Algo no salió como esperábamos. Intenta de nuevo.";
  if (message.includes("duplicate key") && message.includes("slug")) return "Ya existe un elemento con esa URL (slug). Usa otra.";
  if (message.includes("duplicate key")) return "Ese valor ya existe. Usa uno diferente.";
  if (message.includes("violates check constraint")) return "Algún valor no es válido (revisa precios, stock o la URL).";
  if (message.includes("ORDER_CANCELLED_LOCKED")) return "Un pedido cancelado no puede cambiar de estado.";
  if (message.includes("row-level security") || message.includes("FORBIDDEN")) return "No tienes permisos para esta acción.";
  return "Algo no salió como esperábamos. Intenta de nuevo.";
}
