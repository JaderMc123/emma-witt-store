-- Datos iniciales. Los productos marcados is_demo = true son DEMO: reemplázalos antes de lanzar.
insert into public.store_settings (id) values (1) on conflict do nothing;
insert into public.shipping_config (id, national_enabled, national_cost, free_shipping_enabled, free_shipping_threshold)
values (1, true, 18000, true, 300000) on conflict do nothing;
insert into public.shipping_rates (department, city, cost) values
('Atlántico','Barranquilla',10000),('Bolívar','Cartagena',15000),('Bogotá D.C.','Bogotá',18000) on conflict do nothing;
insert into public.payment_methods (id, name, description, enabled, sort_order) values
('whatsapp','Confirmar por WhatsApp','Creamos tu pedido y terminamos la confirmación y el pago contigo por WhatsApp.', true, 1),
('transfer','Transferencia bancaria','Te enviamos los datos de pago al confirmar tu pedido.', false, 2),
('cod','Pago contra entrega','Pagas al recibir tu pedido.', false, 3),
('wompi','Wompi','Tarjetas, PSE y Nequi.', false, 4),
('mercadopago','Mercado Pago','Tarjetas y medios locales.', false, 5) on conflict do nothing;
-- Categorías, páginas legales y productos DEMO se crearon con datos de ejemplo; ver el panel /admin.
-- Para dar acceso de administrador a otra persona (debe existir en Auth):
-- insert into public.admin_users(email, role) values ('correo@ejemplo.com', 'admin');
