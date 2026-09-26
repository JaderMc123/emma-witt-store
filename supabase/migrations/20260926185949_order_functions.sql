-- Costo de envío: gratis desde X → tarifa por ciudad → tarifa nacional
create or replace function public.resolve_shipping(p_subtotal int, p_city text, p_department text)
returns int language plpgsql stable security definer set search_path = public as $$
declare cfg public.shipping_config; v_cost int;
begin
  select * into cfg from public.shipping_config where id = 1;
  if cfg.free_shipping_enabled and p_subtotal >= cfg.free_shipping_threshold then return 0; end if;
  select r.cost into v_cost from public.shipping_rates r
   where r.active and lower(trim(r.city)) = lower(trim(coalesce(p_city,'')))
     and (r.department is null or r.department = '' or lower(trim(r.department)) = lower(trim(coalesce(p_department,''))))
   order by (r.department is not null and r.department <> '') desc limit 1;
  if v_cost is not null then return v_cost; end if;
  if cfg.national_enabled then return cfg.national_cost; end if;
  return null;
end $$;

-- Cotiza el carrito con precios/stock reales (nunca confía en el navegador)
create or replace function public.quote_cart(p_items jsonb, p_city text default null, p_department text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_lines jsonb := '[]'::jsonb; v_sub int := 0; r record; v_ship int; v_ok boolean := true;
begin
  for r in
    with req as (
      select (e->>'variant_id')::uuid as variant_id, sum(greatest(1, least(20, coalesce((e->>'quantity')::int,1)))) as qty
      from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) e
      where (e->>'variant_id') ~ '^[0-9a-f-]{36}$'
      group by 1
    )
    select req.variant_id, req.qty, v.size, v.color, v.stock, (v.active and p.active) as available,
           p.id as product_id, p.name, p.slug, p.sku, p.price,
           (select i.url from public.product_images i where i.product_id = p.id order by i.is_primary desc, i.sort_order limit 1) as image_url
    from req
    left join public.product_variants v on v.id = req.variant_id
    left join public.products p on p.id = v.product_id
  loop
    if r.product_id is null or not r.available then
      v_ok := false;
      v_lines := v_lines || jsonb_build_object('variant_id', r.variant_id, 'available', false, 'reason', 'unavailable');
    else
      if r.stock < r.qty then v_ok := false; end if;
      v_sub := v_sub + r.price * least(r.qty, r.stock);
      v_lines := v_lines || jsonb_build_object(
        'variant_id', r.variant_id, 'product_id', r.product_id, 'name', r.name, 'slug', r.slug, 'sku', r.sku,
        'size', r.size, 'color', r.color, 'unit_price', r.price, 'quantity', r.qty, 'stock', r.stock,
        'available', r.stock >= r.qty, 'reason', case when r.stock = 0 then 'sold_out' when r.stock < r.qty then 'insufficient' else null end,
        'image_url', r.image_url, 'line_total', r.price * r.qty);
    end if;
  end loop;
  v_ship := case when p_city is null or trim(p_city) = '' then null else public.resolve_shipping(v_sub, p_city, p_department) end;
  return jsonb_build_object('lines', v_lines, 'subtotal', v_sub, 'shipping_cost', v_ship,
    'total', v_sub + coalesce(v_ship,0), 'valid', v_ok and jsonb_array_length(v_lines) > 0);
end $$;

-- Crea el pedido de forma atómica: valida, recalcula, bloquea y descuenta stock
create or replace function public.create_order(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  c jsonb := p->'customer'; s jsonb := p->'shipping';
  v_name text := left(trim(coalesce(c->>'name','')), 120);
  v_phone text := regexp_replace(coalesce(c->>'phone',''), '[^0-9+]', '', 'g');
  v_email text := nullif(lower(left(trim(coalesce(c->>'email','')), 160)), '');
  v_dep text := left(trim(coalesce(s->>'department','')), 80);
  v_city text := left(trim(coalesce(s->>'city','')), 80);
  v_addr text := left(trim(coalesce(s->>'address','')), 200);
  v_nb text := nullif(left(trim(coalesce(s->>'neighborhood','')), 100), '');
  v_notes text := nullif(left(trim(coalesce(s->>'notes','')), 300), '');
  v_pm text := coalesce(p->>'payment_method','whatsapp');
  v_sub int := 0; v_ship int; v_total int; v_order public.orders; v_cust uuid; r record; v_count int := 0;
begin
  if coalesce((p->>'terms_accepted')::boolean,false) is not true or coalesce((p->>'privacy_accepted')::boolean,false) is not true then
    raise exception 'TERMS_REQUIRED'; end if;
  if length(v_name) < 3 then raise exception 'INVALID_NAME'; end if;
  if length(regexp_replace(v_phone,'[^0-9]','','g')) < 7 then raise exception 'INVALID_PHONE'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'INVALID_EMAIL'; end if;
  if length(v_dep) < 2 or length(v_city) < 2 or length(v_addr) < 5 then raise exception 'INVALID_ADDRESS'; end if;
  if not exists (select 1 from public.payment_methods where id = v_pm and enabled) then raise exception 'INVALID_PAYMENT_METHOD'; end if;

  create temp table _lines on commit drop as
    select (e->>'variant_id')::uuid as variant_id, sum(greatest(1, least(20, coalesce((e->>'quantity')::int,1))))::int as qty
    from jsonb_array_elements(coalesce(p->'items','[]'::jsonb)) e
    where (e->>'variant_id') ~ '^[0-9a-f-]{36}$' group by 1;
  if (select count(*) from _lines) = 0 then raise exception 'EMPTY_CART'; end if;

  for r in select l.variant_id, l.qty, v.stock, v.active and p2.active as ok, p2.price
           from _lines l join public.product_variants v on v.id = l.variant_id
           join public.products p2 on p2.id = v.product_id
           for update of v
  loop
    v_count := v_count + 1;
    if not r.ok then raise exception 'VARIANT_UNAVAILABLE'; end if;
    if r.stock < r.qty then raise exception 'OUT_OF_STOCK'; end if;
    v_sub := v_sub + r.price * r.qty;
  end loop;
  if v_count <> (select count(*) from _lines) then raise exception 'VARIANT_UNAVAILABLE'; end if;

  v_ship := public.resolve_shipping(v_sub, v_city, v_dep);
  if v_ship is null then raise exception 'NO_SHIPPING'; end if;
  v_total := v_sub + v_ship;

  insert into public.customers(name, phone, email, department, city, orders_count, total_spent)
  values (v_name, v_phone, v_email, v_dep, v_city, 1, v_total)
  on conflict (phone) do update set name = excluded.name, email = coalesce(excluded.email, customers.email),
    department = excluded.department, city = excluded.city,
    orders_count = customers.orders_count + 1, total_spent = customers.total_spent + excluded.total_spent
  returning id into v_cust;

  insert into public.orders(customer_id, customer_name, customer_phone, customer_email, department, city, address,
    neighborhood, shipping_notes, subtotal, shipping_cost, total, payment_method, terms_accepted, privacy_accepted, accepted_at)
  values (v_cust, v_name, v_phone, v_email, v_dep, v_city, v_addr, v_nb, v_notes, v_sub, v_ship, v_total, v_pm, true, true, now())
  returning * into v_order;

  insert into public.order_items(order_id, product_id, variant_id, sku, product_name, size, color, unit_price, quantity, line_total, image_url)
  select v_order.id, p2.id, v.id, p2.sku, p2.name, v.size, v.color, p2.price, l.qty, p2.price * l.qty,
         (select i.url from public.product_images i where i.product_id = p2.id order by i.is_primary desc, i.sort_order limit 1)
  from _lines l join public.product_variants v on v.id = l.variant_id join public.products p2 on p2.id = v.product_id;

  update public.product_variants v set stock = v.stock - l.qty from _lines l where v.id = l.variant_id;
  insert into public.order_status_history(order_id, status, changed_by) values (v_order.id, 'pendiente', 'cliente');

  return jsonb_build_object('order_number', v_order.order_number, 'token', v_order.public_token, 'total', v_total);
end $$;

-- Consulta pública de un pedido solo con su token secreto
create or replace function public.get_order_public(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_number', o.order_number, 'customer_name', o.customer_name, 'city', o.city,
    'subtotal', o.subtotal, 'shipping_cost', o.shipping_cost, 'total', o.total,
    'status', o.status, 'payment_method', o.payment_method, 'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.product_name, 'sku', i.sku, 'size', i.size,
        'color', i.color, 'quantity', i.quantity, 'unit_price', i.unit_price, 'line_total', i.line_total, 'image_url', i.image_url))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o where o.public_token = p_token
$$;

-- Cambios de estado: historial + devolución de stock al cancelar
create or replace function public.order_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'cancelado' then raise exception 'ORDER_CANCELLED_LOCKED'; end if;
    if new.status = 'cancelado' then
      update public.product_variants v set stock = v.stock + i.quantity
        from public.order_items i where i.order_id = new.id and i.variant_id = v.id;
    end if;
    if new.status = 'pagado' then new.payment_status := 'pagado'; end if;
    insert into public.order_status_history(order_id, status, changed_by)
      values (new.id, new.status, coalesce(auth.jwt()->>'email','sistema'));
  end if;
  return new;
end $$;
create trigger t_order_status before update on public.orders for each row execute function public.order_status_change();

-- Dashboard
create or replace function public.admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare tz text := 'America/Bogota'; today timestamptz; wk timestamptz; mo timestamptz; thr int;
  sold text[] := array['confirmado','pagado','preparando','enviado','entregado'];
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  today := date_trunc('day', now() at time zone tz) at time zone tz;
  wk := date_trunc('week', now() at time zone tz) at time zone tz;
  mo := date_trunc('month', now() at time zone tz) at time zone tz;
  select low_stock_threshold into thr from public.store_settings where id = 1;
  return jsonb_build_object(
    'sales_today', (select coalesce(sum(total),0) from orders where status = any(sold) and created_at >= today),
    'sales_week', (select coalesce(sum(total),0) from orders where status = any(sold) and created_at >= wk),
    'sales_month', (select coalesce(sum(total),0) from orders where status = any(sold) and created_at >= mo),
    'orders_month', (select count(*) from orders where status = any(sold) and created_at >= mo),
    'pending_count', (select count(*) from orders where status = 'pendiente'),
    'pending_value', (select coalesce(sum(total),0) from orders where status = 'pendiente'),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'total', coalesce(t,0)) order by d),'[]'::jsonb)
              from generate_series((now() at time zone tz)::date - 13, (now() at time zone tz)::date, '1 day') d
              left join (select (created_at at time zone tz)::date as day, sum(total) t from orders
                         where status = any(sold) and created_at >= now() - interval '15 days' group by 1) x on x.day = d),
    'recent_orders', (select coalesce(jsonb_agg(o),'[]'::jsonb) from (
        select id, order_number, customer_name, city, total, status, created_at from orders order by created_at desc limit 6) o),
    'top_products', (select coalesce(jsonb_agg(t),'[]'::jsonb) from (
        select i.product_name as name, i.sku, sum(i.quantity) as units, sum(i.line_total) as revenue
        from order_items i join orders o on o.id = i.order_id
        where o.status = any(sold) and o.created_at >= now() - interval '30 days'
        group by 1,2 order by units desc limit 5) t),
    'low_stock', (select coalesce(jsonb_agg(l),'[]'::jsonb) from (
        select p.id as product_id, p.name, p.sku, v.size, v.color, v.stock
        from product_variants v join products p on p.id = v.product_id
        where v.active and p.active and v.stock <= thr order by v.stock, p.name limit 8) l)
  );
end $$;

-- Secretos de pago: solo escritura para administradores
create or replace function public.set_payment_secret(p_method text, p_key text, p_value text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_key not in ('private_key','integrity_secret','events_secret','access_token','webhook_secret') then raise exception 'INVALID_KEY'; end if;
  if coalesce(trim(p_value),'') = '' then
    delete from public.payment_secrets where method_id = p_method and key_name = p_key;
  else
    insert into public.payment_secrets(method_id, key_name, value) values (p_method, p_key, trim(p_value))
    on conflict (method_id, key_name) do update set value = excluded.value, updated_at = now();
  end if;
end $$;

create or replace function public.payment_secret_status()
returns table(method_id text, key_name text, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return query select s.method_id, s.key_name, s.updated_at from public.payment_secrets s;
end $$;

revoke execute on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.quote_cart(jsonb, text, text) to anon, authenticated;
grant execute on function public.get_order_public(uuid) to anon, authenticated;
revoke execute on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;
revoke execute on function public.set_payment_secret(text,text,text) from public, anon;
grant execute on function public.set_payment_secret(text,text,text) to authenticated;
revoke execute on function public.payment_secret_status() from public, anon;
grant execute on function public.payment_secret_status() to authenticated;
revoke execute on function public.resolve_shipping(int,text,text) from public, anon, authenticated;
