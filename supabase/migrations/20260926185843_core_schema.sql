-- ============ ADMIN ============
create table public.admin_users (
  email text primary key,
  role text not null default 'admin' check (role in ('owner','admin','editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt()->>'email',''))
  )
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ============ SETTINGS ============
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Emma WITT Collection',
  tagline text default 'Elegancia que camina contigo.',
  whatsapp_number text,
  email text, phone text, address text, business_hours text,
  currency text not null default 'COP',
  country text not null default 'CO',
  instagram_url text, facebook_url text, tiktok_url text,
  logo_url text, favicon_url text,
  accent_color text not null default '#C6A770',
  hero_eyebrow text, hero_title text, hero_subtitle text, hero_image_url text,
  editorial_title text, editorial_text text, editorial_image_url text,
  about_text text,
  low_stock_threshold int not null default 3 check (low_stock_threshold >= 0),
  legal_name text, nit text,
  updated_at timestamptz not null default now()
);
create trigger t_settings_upd before update on public.store_settings for each row execute function public.touch_updated_at();

-- ============ CATALOG ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence public.product_sku_seq start 1;
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique default ('EWC-' || lpad(nextval('public.product_sku_seq')::text, 3, '0')),
  name text not null check (length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  short_description text,
  price integer not null check (price >= 0),
  compare_price integer check (compare_price is null or compare_price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  featured boolean not null default false,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (active, featured);
create trigger t_products_upd before update on public.products for each row execute function public.touch_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.product_images (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  color_hex text,
  stock integer not null default 0 check (stock >= 0),
  sku text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, size, color)
);
create index on public.product_variants (product_id);

-- ============ CUSTOMERS & ORDERS ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  department text, city text,
  orders_count int not null default 0,
  total_spent bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger t_customers_upd before update on public.customers for each row execute function public.touch_updated_at();

create sequence public.order_number_seq start 1;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('EWC-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  public_token uuid not null unique default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  department text not null,
  city text not null,
  address text not null,
  neighborhood text,
  shipping_notes text,
  subtotal integer not null,
  shipping_cost integer not null default 0,
  discount integer not null default 0,
  total integer not null,
  payment_method text not null default 'whatsapp',
  payment_status text not null default 'pendiente',
  status text not null default 'pendiente'
    check (status in ('pendiente','confirmado','pagado','preparando','enviado','entregado','cancelado')),
  terms_accepted boolean not null,
  privacy_accepted boolean not null,
  accepted_at timestamptz not null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (created_at desc);
create index on public.orders (status);
create trigger t_orders_upd before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text not null,
  product_name text not null,
  size text not null,
  color text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  line_total integer not null,
  image_url text
);
create index on public.order_items (order_id);
create index on public.order_items (product_id);

create table public.order_status_history (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by text,
  changed_at timestamptz not null default now()
);
create index on public.order_status_history (order_id);

-- ============ SHIPPING / PAYMENTS ============
create table public.shipping_config (
  id int primary key default 1 check (id = 1),
  national_enabled boolean not null default true,
  national_cost integer not null default 15000 check (national_cost >= 0),
  free_shipping_enabled boolean not null default false,
  free_shipping_threshold integer not null default 300000 check (free_shipping_threshold >= 0),
  updated_at timestamptz not null default now()
);
create trigger t_ship_upd before update on public.shipping_config for each row execute function public.touch_updated_at();

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  department text,
  city text not null,
  cost integer not null check (cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index shipping_rates_city_uq on public.shipping_rates (lower(city), lower(coalesce(department,'')));

create table public.payment_methods (
  id text primary key check (id in ('whatsapp','transfer','cod','wompi','mercadopago')),
  name text not null,
  description text,
  enabled boolean not null default false,
  sort_order int not null default 0,
  environment text not null default 'sandbox' check (environment in ('sandbox','production')),
  public_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger t_pm_upd before update on public.payment_methods for each row execute function public.touch_updated_at();

-- secrets: write-only for admins, never readable through the API
create table public.payment_secrets (
  method_id text not null references public.payment_methods(id) on delete cascade,
  key_name text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (method_id, key_name)
);

-- ============ LEGAL ============
create table public.legal_pages (
  slug text primary key,
  title text not null,
  content text not null default '',
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.legal_page_versions (
  id bigserial primary key,
  slug text not null references public.legal_pages(slug) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create or replace function public.legal_version() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (old.content is distinct from new.content or old.title is distinct from new.title) then
    insert into public.legal_page_versions(slug, title, content) values (old.slug, old.title, old.content);
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger t_legal_ver before update on public.legal_pages for each row execute function public.legal_version();

-- ============ COUPONS (prepared, not yet used) ============
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent','fixed')),
  value integer not null check (value > 0),
  starts_at timestamptz, ends_at timestamptz,
  max_uses int, used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
