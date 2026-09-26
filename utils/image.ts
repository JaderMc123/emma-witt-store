/** Redimensiona y convierte a WebP en el navegador antes de subir (evita imágenes gigantes). */
export async function optimizeImage(file: File, maxSize = 1600, quality = 0.82): Promise<{ blob: Blob; ext: string; type: string }> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    return { blob: file, ext, type: file.type };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
    if (!blob) throw new Error("no blob");
    return { blob, ext: "webp", type: "image/webp" };
  } catch {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    return { blob: file, ext, type: file.type };
  }
}
