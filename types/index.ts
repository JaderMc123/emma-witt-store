export type StoreSettings = {
  id: number;
  store_name: string;
  tagline: string | null;
  whatsapp_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  business_hours: string | null;
  currency: string;
  country: string;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  accent_color: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  editorial_title: string | null;
  editorial_text: string | null;
  editorial_image_url: string | null;
  about_text: string | null;
  low_stock_threshold: number;
  legal_name: string | null;
  nit: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type Variant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  color_hex: string | null;
  stock: number;
  sku: string | null;
  active: boolean;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  category_id: string | null;
  featured: boolean;
  active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductFull = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  variants: Variant[];
};

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  image: string | null;
  quantity: number;
};

export type QuoteLine = {
  variant_id: string;
  product_id?: string;
  name?: string;
  slug?: string;
  sku?: string;
  size?: string;
  color?: string;
  unit_price?: number;
  quantity?: number;
  stock?: number;
  available: boolean;
  reason: "unavailable" | "sold_out" | "insufficient" | null;
  image_url?: string | null;
  line_total?: number;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  shipping_cost: number | null;
  total: number;
  valid: boolean;
};

export type PaymentMethod = {
  id: "whatsapp" | "transfer" | "cod" | "wompi" | "mercadopago";
  name: string;
  description: string | null;
  enabled: boolean;
  sort_order: number;
  environment: "sandbox" | "production";
  public_config: Record<string, string>;
};

export type ShippingConfig = {
  id: number;
  national_enabled: boolean;
  national_cost: number;
  free_shipping_enabled: boolean;
  free_shipping_threshold: number;
};

export type ShippingRate = {
  id: string;
  department: string | null;
  city: string;
  cost: number;
  active: boolean;
};

export type LegalPage = {
  slug: string;
  title: string;
  content: string;
  published: boolean;
  updated_at: string;
};

export type OrderStatus =
  | "pendiente" | "confirmado" | "pagado" | "preparando" | "enviado" | "entregado" | "cancelado";

export type Order = {
  id: string;
  order_number: string;
  public_token: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  department: string;
  city: string;
  address: string;
  neighborhood: string | null;
  shipping_notes: string | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: OrderStatus;
  admin_notes: string | null;
  accepted_at: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  sku: string;
  product_name: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string | null;
};

export type PublicOrder = {
  order_number: string;
  customer_name: string;
  city: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  payment_method: string;
  created_at: string;
  items: { name: string; sku: string; size: string; color: string; quantity: number; unit_price: number; line_total: number; image_url: string | null }[];
};
