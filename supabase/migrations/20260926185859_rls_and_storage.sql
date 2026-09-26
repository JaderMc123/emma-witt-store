alter table public.admin_users enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.shipping_config enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_secrets enable row level security;
alter table public.legal_pages enable row level security;
alter table public.legal_page_versions enable row level security;
alter table public.coupons enable row level security;

-- public read
create policy "public read settings" on public.store_settings for select using (true);
create policy "public read categories" on public.categories for select using (active or public.is_admin());
create policy "public read products" on public.products for select using (active or public.is_admin());
create policy "public read images" on public.product_images for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.active));
create policy "public read variants" on public.product_variants for select using (
  public.is_admin() or (active and exists (select 1 from public.products p where p.id = product_id and p.active)));
create policy "public read shipping cfg" on public.shipping_config for select using (true);
create policy "public read rates" on public.shipping_rates for select using (active or public.is_admin());
create policy "public read payment methods" on public.payment_methods for select using (enabled or public.is_admin());
create policy "public read legal" on public.legal_pages for select using (published or public.is_admin());

-- admin write
create policy "admin all settings" on public.store_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read history" on public.order_status_history for select using (public.is_admin());
create policy "admin all shipping cfg" on public.shipping_config for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all rates" on public.shipping_rates for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all payment methods" on public.payment_methods for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all legal" on public.legal_pages for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read legal versions" on public.legal_page_versions for select using (public.is_admin());
create policy "admin all coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read admins" on public.admin_users for select using (public.is_admin());
-- payment_secrets: sin políticas => inaccesible por API; se gestiona con RPC

-- ============ STORAGE ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp','image/jpeg','image/png','image/svg+xml','image/x-icon'])
on conflict (id) do nothing;

create policy "admin upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "admin update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "admin delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
