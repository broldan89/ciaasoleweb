# CIAO SOLE — Arquitectura y convenciones

Este documento es la fuente de verdad del proyecto. Antes de modificar una
ruta, tabla, función o flujo de precios, revisar primero este archivo y luego
contrastar el esquema real de Supabase.

## Stack

- Next.js 16.3.2 (App Router, Turbopack)
- React 19
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS 4
- `@supabase/ssr` para clientes browser/server basados en cookies

## Esquema REAL de Supabase

Verificado contra el proyecto Supabase conectado el 2026-08-23.

| Tabla | Estado real | Columnas relevantes |
|---|---|---|
| `profiles` | vigente | `id`, `email`, `role`, `rol_solicitado`, `aprobado` |
| `orders` | vigente | `id`, `user_id`, `status`, `total`, `notas`, `created_at` |
| `items_orden` | vigente | `id`, `orden_id`, `variante_id`, `cantidad`, `precio_unitario`, `total` |
| `productos` | vigente | `id`, `nombre`, `descripcion`, `categoria`, `is_active`, `created_at` |
| `variantes_producto` | vigente | `id`, `producto_id`, `atributos`, `precio_publico`, `precio_mayorista`, `stock`, `is_active` |

**Importante:** el esquema de producción NO está completamente unificado en
inglés. `orders`/`user_id` ya están en inglés, mientras que `items_orden`,
`productos` y `variantes_producto` siguen en español. El código debe usar el
esquema real hasta que exista una migración explícita y probada para completar
la unificación.

No ejecutar `supabase/migrations/0004_unificar_nombres_ingles.sql` sobre la
base actual. Esa migración pretende renombrar tablas que todavía existen en
español y además contiene policies antiguas que no deben volver a introducirse.
Antes de una futura unificación se deberá preparar una migración nueva,
probada y coherente con el RLS actual.

## Roles

La fuente de autoridad es siempre `profiles.role`.

Valores previstos:

- `cliente`
- `mayorista`
- `admin`

Nunca usar `user_metadata.rol` ni `user_metadata.role` para autorizar acciones.
El metadata enviado durante el registro solamente sirve para expresar una
solicitud (`rol_solicitado`). El trigger crea al usuario como `cliente` y un
admin debe aprobar manualmente el acceso mayorista.

## Seguridad y RLS

La base actual utiliza `public.is_admin()` para evitar recursión en las policies
de `profiles`. La función es `SECURITY DEFINER`, `STABLE`, tiene
`search_path = public` y está limitada a usuarios autenticados.

Policies actuales verificadas:

- `profiles`: cada usuario puede leer su propio perfil; admin puede leer
  perfiles; solamente admin puede actualizar.
- `orders`: cada usuario puede leer sus propias órdenes y crear órdenes con su
  propio `user_id`; admin puede leer y actualizar todas.
- `items_orden`: un usuario puede leer/insertar items pertenecientes a sus
  propias órdenes; admin puede leer/modificar/eliminar.
- `productos`: catálogo activo público; escritura administrativa.
- `variantes_producto`: variantes activas públicas; escritura administrativa.

No crear policies administrativas que hagan `select` directo sobre
`profiles` desde otra policy. Usar `public.is_admin()`.

## Precios

`obtener_precio_variante(p_variante_id)` es la función vigente y su nombre se
mantiene por decisión del proyecto.

La función actual es `SECURITY INVOKER` y resuelve el precio según
`profiles.role`. El cliente nunca debe enviar un precio que el servidor vaya a
guardar como fuente de verdad.

## Órdenes

La tabla vigente es `orders` y la columna de usuario vigente es `user_id`.

La API `/api/ordenes` recibe solamente:

- `varianteId`
- `cantidad`
- `notas`
- `status`

El precio y total se resuelven en servidor.

Los items se persisten actualmente en `items_orden` con:

- `orden_id`
- `variante_id`
- `cantidad`
- `precio_unitario`
- `total`

## Rutas

Las rutas administrativas viven en `src/app/admin/...` sin route group entre
paréntesis. Por eso las URLs reales son:

- `/admin/dashboard`
- `/admin/productos`
- `/admin/ordenes`
- `/admin/taller`

No volver a moverlas a `src/app/(admin)/...`: `(admin)` sería un route group y
no formaría parte de la URL.

## Proxy

Next.js 16.3.2 utiliza `src/proxy.ts` con export `proxy`.

El proxy protege `/admin/*` y consulta el rol desde `profiles.role`.

## Clientes Supabase

Browser:

```ts
import { supabase } from "@/lib/supabase/client";
```

Server Components / Route Handlers:

```ts
import { createClient } from "@/lib/supabase-server";
```

No introducir un cliente paralelo basado en `createClient()` plano de
`@supabase/supabase-js` con sesión independiente en localStorage.

## Estado funcional del proyecto

Conectado a Supabase:

- `/` catálogo público
- `/login`
- `/register`
- `/cotizar`
- `/cotizar/mis-cotizaciones`
- `/api/ordenes`
- `/api/ordenes/[id]/estado`

Interfaz administrativa en proceso de integración:

- `/admin/dashboard`
- `/admin/productos`
- `/admin/ordenes`
- `/admin/taller`

Estas pantallas contienen todavía componentes visuales y/o datos de ejemplo.
El objetivo es conservar el lenguaje visual pero conectar progresivamente
cada módulo al esquema REAL descrito arriba.

## Sistema visual

La dirección estética toma como referencia el lenguaje editorial de sitios de
alta gama de control solar: mucho espacio negativo, tipografía serif para
mensajes de marca, sans-serif limpia para operación, paleta marfil/arena,
negro carbón y un acento metálico cálido.

La referencia externa es Hunter Douglas Argentina, especialmente su combinación
de producto + arquitectura + inspiración + llamado a cotizar. No se copian
componentes, textos ni identidad de marca; se toma únicamente como referencia
visual y de jerarquía de contenido.

La plataforma Ciao Sole debe mantener una identidad propia y priorizar la
cotización, la personalización, el control de precios por rol y la operación
interna.

## Migraciones

Las migraciones históricas no deben editarse después de haber sido ejecutadas.

El repositorio contiene:

- `0001_roles_seguros_y_precios.sql`
- `0002_ajustar_columna_role.sql`
- `0003_reasegurar_rls.sql`
- `0004_unificar_nombres_ingles.sql`

Sin embargo, el historial real de migraciones registrado actualmente en
Supabase contiene solamente:

- `fase_2_seguridad_roles_rls`
- `fix_rls_profiles_recursion`

Por lo tanto, las cuatro migraciones del repositorio deben considerarse
**documentación histórica/no aplicada** hasta sincronizar formalmente el
historial de migraciones. No ejecutar `0004` como si fuera una migración
pendiente.

Si se modifica el esquema real, agregar una migración nueva y verificarla
contra Supabase antes de tocar datos de producción.

## Antes de subir cambios

Ejecutar:

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

Y, para cambios de Supabase, comprobar también el esquema real y las policies
antes de modificar código que dependa de ellas.
