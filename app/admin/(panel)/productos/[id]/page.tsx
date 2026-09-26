"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, Loading, PageHeader, Panel, Switch, useToast, AdminEmpty, ConfirmButton } from "@/components/admin/ui";
import { ImagesManager } from "@/components/admin/ImagesManager";
import { VariantsManager } from "@/components/admin/VariantsManager";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges } from "@/lib/admin";
import type { Category, ProductFull, ProductImage, Variant } from "@/types";
import { formatCOP, slugify } from "@/utils/format";

type Form = { name: string; slug: string; short_description: string; description: string; price: string; compare_price: string; category_id: string; featured: boolean; active: boolean };
const EMPTY: Form = { name: "", slug: "", short_description: "", description: "", price: "", compare_price: "", category_id: "", featured: false, active: true };
const digits = (s: string) => s.replace(/\D/g, "");
const money = (s: string) => (s ? Number(digits(s)).toLocaleString("es-CO") : "");

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "nuevo";
  const router = useRouter();
  const toast = useToast();
  const [product, setProduct] = useState<ProductFull | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = browserClient();
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) || []));
    if (isNew) return;
    supabase
      .from("products")
      .select("*, category:categories(id,name,slug), images:product_images(*), variants:product_variants(*)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setLoading(false);
        if (!data) return setNotFound(true);
        const p = data as ProductFull;
        setProduct(p);
        setSlugTouched(true);
        setForm({
          name: p.name,
          slug: p.slug,
          short_description: p.short_description || "",
          description: p.description || "",
          price: money(String(p.price)),
          compare_price: p.compare_price ? money(String(p.compare_price)) : "",
          category_id: p.category_id || "",
          featured: p.featured,
          active: p.active,
        });
      });
  }, [id, isNew]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const price = Number(digits(form.price));
    const compare = form.compare_price ? Number(digits(form.compare_price)) : null;
    const slug = slugify(form.slug || form.name);
    if (form.name.trim().length < 2) return toast("Escribe el nombre del producto", "error");
    if (!slug) return toast("La URL no es válida", "error");
    if (!price) return toast("Escribe el precio", "error");
    if (compare !== null && compare <= price) return toast("El precio anterior debe ser mayor al precio actual", "error");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug,
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      price,
      compare_price: compare,
      category_id: form.category_id || null,
      featured: form.featured,
      active: form.active,
      ...(isNew ? {} : product?.is_demo ? { is_demo: false } : {}),
    };
    const supabase = browserClient();
    const res = isNew
      ? await supabase.from("products").insert(payload).select().single()
      : await supabase.from("products").update(payload).eq("id", id).select().single();
    setSaving(false);
    if (res.error) return toast(friendlyError(res.error.message), "error");
    publishChanges();
    if (isNew) {
      toast("Producto creado. Ahora agrega fotos y tallas.");
      router.replace(`/admin/productos/${res.data.id}`);
    } else {
      setProduct((p) => (p ? { ...p, ...res.data } : p));
      set("slug", slug);
      toast("Cambios guardados");
    }
  };

  const remove = async () => {
    const { error } = await browserClient().from("products").delete().eq("id", id);
    if (error) return toast(friendlyError(error.message), "error");
    publishChanges();
    toast("Producto eliminado");
    router.replace("/admin/productos");
  };

  if (loading) return <Loading />;
  if (notFound) return <AdminEmpty title="Producto no encontrado" action={<Link href="/admin/productos" className="btn btn-primary btn-sm">Volver</Link>} />;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/productos", label: "Productos" }}
        eyebrow={isNew ? "Nuevo producto" : product?.sku}
        title={isNew ? "Crear producto" : form.name || "Producto"}
        actions={
          !isNew && product ? (
            <>
              {product.active ? (
                <a href={`/producto/${product.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">Ver en tienda ↗</a>
              ) : null}
              <ConfirmButton onConfirm={remove} confirmLabel="Eliminar producto" className="btn btn-sm btn-ghost text-danger">Eliminar</ConfirmButton>
            </>
          ) : null
        }
      />

      {product?.is_demo ? (
        <div className="mb-6 rounded-[18px] border border-dashed border-[#c9b27a] bg-[#faf5ea] px-5 py-4 text-[13.5px]">
          Este es un producto <strong className="font-medium">DEMO</strong>. Al guardar cambios deja de marcarse como demo.
        </div>
      ) : null}

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid gap-4 content-start">
          <Panel title="Información">
            <div className="grid gap-5">
              <Field label="Nombre" htmlFor="name">
                <input
                  id="name"
                  className="input"
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  required
                />
              </Field>
              <Field label="URL del producto" htmlFor="slug" hint={`/producto/${slugify(form.slug || form.name) || "…"}`}>
                <input id="slug" className="input" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
              </Field>
              <Field label="Descripción corta" htmlFor="short" hint="Una línea que aparece bajo el precio.">
                <input id="short" className="input" maxLength={160} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
              </Field>
              <Field label="Descripción" htmlFor="desc">
                <textarea id="desc" className="input" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </Panel>

          {!isNew && product ? (
            <>
              <Panel title="Fotos" description="La primera es la principal. Puedes reordenar, cambiar la principal o eliminar.">
                <ImagesManager productId={product.id} productName={product.name} images={product.images} onChange={(imgs: ProductImage[]) => setProduct((p) => (p ? { ...p, images: imgs } : p))} />
              </Panel>
              <Panel title="Tallas, colores y stock" description="El stock pertenece a cada variante (color + talla).">
                <VariantsManager productId={product.id} productSku={product.sku} variants={product.variants} onSaved={(v: Variant[]) => setProduct((p) => (p ? { ...p, variants: v } : p))} />
              </Panel>
            </>
          ) : (
            <Panel>
              <p className="text-[14px] text-stone">Guarda el producto para agregar fotos, tallas y stock.</p>
            </Panel>
          )}
        </div>

        <div className="grid gap-4 content-start lg:sticky lg:top-8">
          <Panel title="Precio">
            <div className="grid gap-5">
              <Field label="Precio (COP)" htmlFor="price">
                <input id="price" inputMode="numeric" className="input tabular-nums" placeholder="189.900" value={form.price} onChange={(e) => set("price", money(e.target.value))} required />
              </Field>
              <Field label="Precio anterior (opcional)" htmlFor="compare" hint="Si es mayor al precio, se muestra como oferta.">
                <input id="compare" inputMode="numeric" className="input tabular-nums" placeholder="219.900" value={form.compare_price} onChange={(e) => set("compare_price", money(e.target.value))} />
              </Field>
              {form.price ? <p className="text-[13px] text-stone">Se verá como <span className="text-ink tabular-nums">{formatCOP(Number(digits(form.price)))}</span></p> : null}
            </div>
          </Panel>
          <Panel title="Organización">
            <div className="grid gap-5">
              <Field label="Categoría" htmlFor="cat">
                <select id="cat" className="input" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (oculta)"}</option>)}
                </select>
              </Field>
              <Switch checked={form.active} onChange={(v) => set("active", v)} label="Visible en la tienda" description="Si lo apagas, el producto queda oculto." />
              <Switch checked={form.featured} onChange={(v) => set("featured", v)} label="Destacado" description="Aparece en la colección destacada del inicio." />
            </div>
          </Panel>
          <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? "Guardando…" : isNew ? "Crear producto" : "Guardar cambios"}</button>
        </div>
      </form>
    </>
  );
}
