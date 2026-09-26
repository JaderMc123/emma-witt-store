import { publicClient } from "@/lib/supabase/public";
import type { Category, LegalPage, PaymentMethod, ProductFull, ShippingConfig, StoreSettings } from "@/types";

const PRODUCT_SELECT =
  "*, category:categories(id,name,slug), images:product_images(*), variants:product_variants(*)";

function normalize(p: ProductFull): ProductFull {
  return {
    ...p,
    images: [...(p.images || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order),
    variants: [...(p.variants || [])].filter((v) => v.active),
  };
}

const FALLBACK_SETTINGS: StoreSettings = {
  id: 1, store_name: "Emma WITT Collection", tagline: "Elegancia que camina contigo.", whatsapp_number: null,
  email: null, phone: null, address: null, business_hours: null, currency: "COP", country: "CO",
  instagram_url: null, facebook_url: null, tiktok_url: null, logo_url: null, favicon_url: null,
  accent_color: "#C6A770", hero_eyebrow: null, hero_title: null, hero_subtitle: null, hero_image_url: null,
  editorial_title: null, editorial_text: null, editorial_image_url: null, about_text: null,
  low_stock_threshold: 3, legal_name: null, nit: null,
};

export async function getSettings(): Promise<StoreSettings> {
  const { data } = await publicClient().from("store_settings").select("*").eq("id", 1).maybeSingle();
  return (data as StoreSettings) || FALLBACK_SETTINGS;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await publicClient().from("categories").select("*").eq("active", true).order("sort_order");
  return (data as Category[]) || [];
}

export async function getCategory(slug: string): Promise<Category | null> {
  const { data } = await publicClient().from("categories").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  return (data as Category) || null;
}

export async function getProducts(): Promise<ProductFull[]> {
  const { data } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false });
  return ((data as ProductFull[]) || []).map(normalize);
}

export async function getProduct(slug: string): Promise<ProductFull | null> {
  const { data } = await publicClient().from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("active", true).maybeSingle();
  return data ? normalize(data as ProductFull) : null;
}

export async function getShippingConfig(): Promise<ShippingConfig | null> {
  const { data } = await publicClient().from("shipping_config").select("*").eq("id", 1).maybeSingle();
  return (data as ShippingConfig) || null;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await publicClient().from("payment_methods").select("*").eq("enabled", true).order("sort_order");
  return (data as PaymentMethod[]) || [];
}

export async function getLegalPage(slug: string): Promise<LegalPage | null> {
  const { data } = await publicClient().from("legal_pages").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  return (data as LegalPage) || null;
}
