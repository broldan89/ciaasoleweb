# CIAO SOLE — Arquitectura y convenciones

Este documento existe porque el proyecto se trabaja en paralelo con
varias herramientas de IA distintas (Claude, Claude Code/Cursor, Gemini,
GPT), sin un único punto de coordinación. Cada vez que una herramienta
inventa su propia convención, la siguiente rompe algo. **Este archivo es
la fuente de verdad. Cualquier herramienta que edite este repo debería
leerlo primero.**

Si vas a cambiar algo que contradiga este documento (un nombre de tabla,
una convención de rutas, el flujo de precios), actualizá este archivo en
el mismo cambio — no lo dejes desactualizado.

## Stack

- Next.js 16.3.2 (App Router, Turbopack)
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS
- Cliente único de Supabase: `@supabase/ssr` (basado en cookies, no
  localStorage) — ver sección "Cliente de Supabase" más abajo.

## Convención de nombres en la base de datos: INGLÉS

Decisión final (2026-08-23): todas las tablas y columnas de negocio usan
inglés. Esto reemplaza los nombres en español usados en versiones
anteriores del proyecto.

**Excepciones explícitas — estas dos quedan como están, no se traducen:**
- Tabla `profiles` (ya está en inglés/neutro)
- Función SQL `obtener_precio_variante()` (nombre en español, decisión
  del usuario — el nombre de la función y de su parámetro
  `p_variante_id` NO cambian, aunque internamente consulte
  `product_variants`)

### Esquema real (estado al 2026-08-23)

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | `id`, `email`, `role`, `rol_solicitado`, `aprobado` | El rol NUNCA se lee de `user_metadata` — siempre de esta tabla, protegida por RLS |
| `orders` | `id`, `user_id`, `status`, `total`, `notas`, `created_at` | Ya renombrada desde `ordenes`/`usuario_id` |
| `order_items` | `id`, `order_id`, `product_variant_id`, `cantidad`, `precio_unitario`, `total` | Renombrada desde `items_orden` en la migración `0004` |
| `products` | `id`, `nombre`, `descripcion`, `is_active` | Renombrada desde `productos` en la migración `0004` |
| `product_variants` | `id`, `product_id`, `atributos`, `precio_publico`, `precio_mayorista` | Renombrada desde `variantes_producto` en la migración `0004` |
| `variantes_publico` (vista) | `id`, `product_id`, `atributos`, `precio_publico` | Vista pública SIN `precio_mayorista` — es lo único que el catálogo público debe consultar directo |

**Antes de asumir un nombre de tabla o columna, revisá esta tabla.** Si
hacés un cambio de esquema, actualizá esta tabla en el mismo commit.

## Modelo de roles y seguridad

- El rol de cada usuario vive en `profiles.role` (`cliente` / `mayorista`
  / `admin`), protegido por RLS. **Nunca** se lee ni se escribe desde
  `user_metadata` de Supabase Auth — ese campo lo puede editar el propio
  usuario desde el navegador, así que no sirve como fuente de autoridad.
- Un usuario nuevo siempre arranca en `role = 'cliente'`. Si pidió
  "mayorista" al registrarse, queda en `profiles.rol_solicitado =
  'mayorista'` con `aprobado = false` — un admin lo aprueba a mano
  cambiando `role` y `aprobado` directo en la tabla (todavía no hay
  botón en el panel para esto, es un pendiente).
- El precio que ve cada usuario (público vs. mayorista) se resuelve
  **siempre en el servidor**, vía la función `obtener_precio_variante()`
  — nunca se traen ambos precios juntos al cliente. El catálogo público
  consulta la vista `variantes_publico` (sin `precio_mayorista`) para
  mostrar atributos, y pide el precio real vía RPC.
- El total de una orden se recalcula **siempre en el servidor**
  (`/api/ordenes`, POST) a partir de `varianteId` + `cantidad`. El
  navegador nunca manda un precio ni un total que se guarde tal cual —
  eso sería trivial de falsificar con las devtools.

## Rutas — ¡ojo con los route groups!

Next.js App Router: una carpeta entre paréntesis, como `(admin)`, es un
**route group** — agrupa layouts pero **no aparece en la URL**. Esto ya
causó un bug real: durante un tiempo el panel admin vivía en
`src/app/(admin)/dashboard/page.tsx`, que en realidad respondía en
`/dashboard` (sin `/admin`), mientras que todo el resto del código
(el middleware, los redirects de login, los links del navbar) asumía
`/admin/dashboard`. Como consecuencia, la protección de rutas admin
nunca se activaba de verdad.

**Ya está corregido**: las rutas admin viven en `src/app/admin/...`
(sin paréntesis), así que `/admin/dashboard`, `/admin/productos`,
`/admin/ordenes` y `/admin/taller` son URLs reales. **No lo vuelvas a
envolver en paréntesis.**

## Middleware / Proxy

Next.js 16.3.2 renombró la convención: el archivo se llama
**`src/proxy.ts`** (no `middleware.ts`), y exporta una función llamada
**`proxy`** (no `middleware`). Si usás una versión de Next más vieja
como referencia mental, vas a "corregir" esto al revés — ya pasó en esta
misma sesión. El build tira una advertencia clara si el nombre está mal.

`src/proxy.ts` hace tres cosas:
1. Si no hay sesión y la ruta no es `/login` ni `/register`, redirige a
   `/login`.
2. Si hay sesión y la ruta es `/login` o `/register`, redirige a
   `/cotizar/mis-cotizaciones`.
3. Si la ruta empieza con `/admin`, chequea `profiles.role` y si no es
   `admin` (ni `administrador`), redirige afuera.

## Cliente de Supabase

Hay un solo cliente de navegador válido: **`@/lib/supabase/client`**
(usa `createBrowserClient` de `@supabase/ssr`, sesión en cookies). Para
Server Components y Route Handlers, usar **`@/lib/supabase-server`**
(usa `createServerClient`, también basado en cookies, lee la sesión de
las cookies de la request).

**No debe existir** un cliente basado en `createClient()` plano de
`@supabase/supabase-js` con sesión en `localStorage` — esto ya causó un
bug real (páginas que no veían la sesión que sí veían el login/middleware,
porque localStorage y cookies no se sincronizan solos). Si ves un
archivo así, es un resto viejo: hay que migrar sus imports al cliente
único y borrarlo.

## Estado de conexión de las páginas (importante, para no confundirse)

Al 2026-08-23, estas páginas del panel admin son **interfaz visual sin
conexión real a Supabase** — todo lo que muestran (números del
dashboard, órdenes, productos) es data de ejemplo hardcodeada en el
componente:

- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/productos/page.tsx`
- `src/app/admin/ordenes/page.tsx`
- `src/app/admin/taller/page.tsx`

Están muy bien encaminadas visualmente (línea editorial, inspirada en
hunterdouglas.com.ar), pero **antes de darlas por terminadas hay que
conectarlas** a `products`, `product_variants`, `orders` y
`order_items` según corresponda, usando el cliente único de Supabase y
respetando que los precios/totales se calculan en servidor.

Lo que SÍ está conectado de verdad:
- `/api/ordenes` (POST) — crea una orden con precio recalculado server-side
- `/api/ordenes/[id]/estado` (PATCH) — cambia el estado de una orden
- `/cotizar/mis-cotizaciones` — lee `orders` + `order_items` reales
- `(public)/page.tsx` (home) y `login`/`register` — conectados

## Migraciones SQL

Viven en `supabase/migrations/`, en orden numérico. **No se borran** —
aunque ya estén aplicadas en producción, quedan como documentación y
para poder reconstruir el esquema desde cero si hace falta. Si cambiás
el esquema, agregás una migración nueva con el próximo número, nunca
edites una vieja que ya se corrió.

Historial:
- `0001` — tabla `profiles`, RLS inicial, función de precios, primera
  versión de RLS sobre `ordenes`/`items_orden`/`productos`/`variantes_producto`
- `0002` — adapta todo a la columna real `role` (no `rol`)
- `0003` — hace robustas las migraciones anteriores (idempotencia)
- `0004` — renombra `items_orden`→`order_items`, `productos`→`products`,
  `variantes_producto`→`product_variants`, y actualiza toda la RLS y la
  función de precios a los nombres nuevos. **Este es el estado final
  vigente.**

## Antes de tocar este repo con otra herramienta

1. Leé este archivo entero.
2. Antes de asumir un nombre de tabla/columna, buscalo en el código real
   (`grep -rn '.from("' src`), no confíes en lo que dice un chat viejo.
3. Si vas a renombrar algo en Supabase, hacelo vía una migración nueva
   en `supabase/migrations/`, nunca solo a mano en el dashboard sin
   dejar rastro — si lo hacés a mano igual, actualizá este documento.
4. Corré `npx tsc --noEmit`, `npx eslint .` y `npx next build` antes de
   pushear. Si algo no compila, no lo subas.
5. Si tocás `src/proxy.ts`, el navbar, o cualquier chequeo de rol —
   fijate que TODO el código relevante use la misma fuente
   (`profiles.role`, nunca `user_metadata`).
