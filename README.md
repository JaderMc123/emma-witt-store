# Emma WITT Collection — Tienda online

Tienda de calzado femenino, WhatsApp-first, con panel de administración.
**Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Vercel** — costo $0/mes en planes gratuitos.

## Qué incluye

**Tienda** — Inicio editorial, catálogo con filtros (categoría, talla, color, precio, disponibilidad) y orden, página de producto con variantes color/talla y stock real (Disponible · Últimas unidades · Agotado), “Comprar por WhatsApp”, compartir (WhatsApp, copiar enlace, nativo), bolsa de compras sin registro, checkout sin cuenta, confirmación de pedido con “Continuar por WhatsApp”, centro legal, banner de cookies, SEO (metadata, Open Graph, sitemap, robots, datos estructurados de producto).

**Admin (`/admin`)** — Dashboard (ventas hoy/semana/mes, pendientes, recientes, más vendidos, stock bajo), productos (crear, editar, duplicar, ocultar, destacar, eliminar, fotos con orden y principal, variantes y stock), categorías, pedidos (estados con historial, cancelación devuelve stock, WhatsApp al cliente), clientes (exportar CSV), ventas (ticket promedio, tallas, colores, ciudades), envíos, pagos, legal (editor con versiones) y configuración general.

## Arquitectura

```
app/            Rutas (tienda en app/(store), admin en app/admin)
components/     UI reutilizable (store/, admin/, ui/)
config/         Constantes del sitio
hooks/          Carrito, cookies, cotización, animaciones
lib/            Clientes de Supabase y utilidades del admin
services/       Lectura del catálogo y capa de pagos (PaymentProvider)
types/          Tipos compartidos
utils/          Formato COP, WhatsApp, markdown, imágenes
supabase/       Migraciones SQL y seed
```

### Seguridad
- **RLS en todas las tablas.** El público solo lee catálogo activo; no puede leer pedidos, clientes ni modificar nada.
- **Pedidos vía función `create_order`** (Postgres, `security definer`): recalcula precios, stock, subtotal, envío y total en el servidor, bloquea las filas de stock y descuenta de forma atómica. El precio enviado por el navegador nunca se usa.
- **Admin protegido** por middleware + verificación `is_admin()` (tabla `admin_users`).
- **Secretos de pasarelas** en `payment_secrets` sin políticas de lectura: solo se escriben mediante RPC y jamás llegan al navegador.

### Pagos
`services/payments` define la interfaz `PaymentProvider`. Hoy: WhatsApp (por defecto), transferencia y contra entrega. Wompi y Mercado Pago tienen su configuración, claves y URL de webhook listas en `/admin/configuracion/pagos`; para activarlos se implementa su `nextStep` + el webhook en `app/api/payments/webhook/[provider]`, sin tocar carrito, checkout ni pedidos.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa la anon key
npm run dev                   # http://localhost:3000
```

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (segura en el navegador gracias a RLS) |
| `NEXT_PUBLIC_SITE_URL` | Opcional: dominio final para SEO. En Vercel se detecta solo |

El número de WhatsApp, envíos, pagos, textos y políticas **no** van en variables: se editan desde `/admin`.
No se usa `SUPABASE_SERVICE_ROLE_KEY`.

## Supabase

El proyecto ya está creado y migrado (`tienda-calzado-ropa`, región São Paulo). Para recrearlo en otro proyecto:
1. Ejecuta en orden los archivos de `supabase/migrations/` y luego `supabase/seed.sql` (SQL Editor o `supabase db push`).
2. Crea el usuario administrador en **Authentication → Users** y agrega su email a `admin_users`.
3. En **Authentication → URL Configuration**, pon la URL del sitio.

## Deploy en Vercel

1. vercel.com → **Add New… → Project** → importa este repositorio.
2. Framework: Next.js (automático). **Deploy**.
3. (Opcional) agrega las variables de entorno de arriba y tu dominio.

Cada `git push` a `main` publica automáticamente.

## Antes de lanzar
- [ ] Configurar WhatsApp, email y redes en `/admin/configuracion`.
- [ ] Reemplazar los productos **DEMO** por productos reales con fotos.
- [ ] Completar nombre legal, NIT y dirección, y revisar las políticas con un asesor legal.
- [ ] Cambiar la contraseña temporal en `/admin/cuenta`.
