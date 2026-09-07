# CIAO SOLE — Arquitectura y convenciones

Este documento es la fuente de verdad del proyecto. Antes de modificar una ruta, tabla, función o flujo de precios, revisar primero este archivo y luego contrastar el esquema real de Supabase.

## Stack

- Next.js 16.3.2 (App Router, Turbopack)
- React 19
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS 4
- `@supabase/ssr` para clientes browser/server basados en cookies

## Esquema REAL de Supabase

Verificado contra el proyecto Supabase conectado.

| Tabla | Estado real | Columnas relevantes |
|---|---|---|
| `profiles` | vigente | `id`, `email`, `role`, `rol_solicitado`, `aprobado`, `created_at` |
| `orders` | vigente | `id`, `user_id`, `status`, `total`, `notas`, `created_at`, `codigo_postal`, `shipping_method_id`, `shipping_cost` |
| `items_orden` | vigente | `id`, `orden_id`, `variante_id`, `cantidad`, `precio_unitario`, `total`, medidas y orientación |
| `productos` | vigente | `id`, `nombre`, `descripcion`, `categoria`, `is_active`, `created_at` |
| `variantes_producto` | vigente | `id`, `producto_id`, `atributos`, `precio_publico`, `precio_mayorista`, `stock`, `is_active`, `tela_id` |
| `telas` | vigente | `id`, `nombre`, `ancho_fabrica_mm`, `apaisable`, `is_active` |
| `shipping_methods` | vigente | `id`, `nombre`, `proveedor`, `descripcion`, `is_active` |
| `shipping_rates` | vigente | rangos de código postal, costo y método |

**Importante:** el esquema de producción NO está completamente unificado en inglés. `orders`/`user_id` están en inglés, mientras que `items_orden`, `productos` y `variantes_producto` siguen en español. El código debe usar el esquema real hasta que exista una migración explícita y probada.

No ejecutar `supabase/migrations/0004_unificar_nombres_ingles.sql` sobre la base actual. Esa migración es histórica y no debe volver a introducir `order_items` ni nombres antiguos.

## Roles

La fuente de autoridad es siempre `profiles.role`.

Valores previstos:

- `cliente`
- `mayorista`
- `admin`

Nunca usar `user_metadata.rol` ni `user_metadata.role` para autorizar acciones. `rol_solicitado` expresa una solicitud de cambio de rol; la autoridad real sigue siendo `profiles.role`.

## Seguridad y RLS

La base utiliza `public.is_admin()` para las policies administrativas que necesitan evitar recursión sobre `profiles`. La autorización de datos debe seguir descansando en RLS, incluso cuando una ruta esté protegida por el Proxy.

Policies actuales relevantes:

- `profiles`: cada usuario puede leer su propio perfil; admin puede leer perfiles; solamente admin puede actualizar.
- `orders`: cada usuario puede leer sus propias órdenes y crear órdenes con su propio `user_id`; admin puede leer y actualizar todas.
- `items_orden`: un usuario puede leer/insertar items pertenecientes a sus propias órdenes; admin puede leer/modificar/eliminar.
- `productos`: catálogo activo público; escritura administrativa.
- `variantes_producto`: variantes activas públicas; escritura administrativa.

No crear policies administrativas que hagan `select` directo sobre `profiles` desde otra policy. Usar `public.is_admin()`.

## Precios

`obtener_precio_variante(p_variante_id)` es la función vigente. El servidor determina el precio según `profiles.role`; el cliente nunca debe ser la fuente de verdad del precio persistido.

## Motor de fabricación y consumo

El motor de cotización separa cuatro etapas:

```text
medida del cliente
      ↓
medida de fabricación
      ↓
orientaciones posibles
      ↓
consumo optimizado
```

`calcularMedidasFabricacion()` concentra las reglas actuales del Roller. Los valores de descuento de ancho, adicional de alto y descuento de caño están centralizados en `REGLAS_FABRICACION_ROLLER` porque todavía deben validarse contra la ficha técnica definitiva de producción.

`calcularConsumoTela()` nunca pide una decisión de orientación al cliente. Evalúa automáticamente:

- orientación `normal`
- orientación `apaisada`, solamente cuando `telas.apaisable = true`

Cada orientación compara el ancho requerido contra `telas.ancho_fabrica_mm`. Si existen varias alternativas válidas, se elige la de menor consumo lineal. Si ninguna entra, el resultado conserva las evaluaciones y el motivo de rechazo de cada orientación.

La interfaz muestra la orientación elegida como resultado del motor; no existe un botón manual de “verificar fabricación”. La API y el POST de `/api/ordenes` vuelven a ejecutar el mismo motor en servidor antes de persistir.

Por ahora `ancho_fabrica_mm` representa el ancho disponible utilizado por el motor. No agregar una noción de “ancho útil” adicional hasta contar con una regla de producción confirmada; los 3 cm de descuento actuales pertenecen a la regla de fabricación de la pieza.

## Órdenes y cotización

La tabla vigente es `orders` y la columna de usuario vigente es `user_id`.

`/api/ordenes` recibe:

- `items[].varianteId`
- `items[].cantidad`
- `items[].anchoCm`
- `items[].altoCm`
- `notas`
- `codigoPostal`
- `shippingMethodId`
- `status`

El servidor vuelve a calcular fabricación, consumo, precio, envío y total.

Los items se persisten en `items_orden` con `orden_id`, `variante_id`, cantidad, precio, total y datos de fabricación.

## Arquitectura de rutas

### Público

El grupo `src/app/(public)/` contiene las rutas públicas. El nombre `(public)` no forma parte de la URL.

- `/`
- `/login`
- `/register`
- `/cotizar`

`/cotizar` es el **único cotizador**. Toda la construcción de una nueva solicitud ocurre allí: selección de productos y variantes, cantidades, medidas, fabricación, código postal, envío, observaciones y confirmación.

La selección de productos se muestra dentro del propio cotizador. Agregar una variante la incorpora inmediatamente al proyecto; no se necesita volver al catálogo de la home para continuar.

El código postal dispara automáticamente la consulta de tarifas después de ingresar un valor válido. La primera opción disponible se selecciona inicialmente y el usuario puede cambiarla.

### Área privada de cliente/mayorista

Las rutas autenticadas viven en `src/app/panel/`:

- `/panel` — resumen de cuenta y actividad
- `/panel/cotizaciones` — historial de cotizaciones enviadas/borradores
- `/panel/pedidos` — pedidos aprobados/facturados
- `/panel/ordenes/[id]` — detalle y seguimiento de un proyecto

El panel **no arma cotizaciones nuevas** y no participa del proceso de cotización. Para iniciar una nueva cotización se vuelve siempre a `/cotizar`.

La antigua ruta `/cotizar/mis-cotizaciones` se conserva solamente como compatibilidad de URL y redirige a `/panel/cotizaciones`.

### Administración

Las rutas administrativas viven en `src/app/admin/...` sin route group entre paréntesis. Las URLs reales son:

- `/admin/dashboard`
- `/admin/productos`
- `/admin/ordenes`
- `/admin/taller`
- `/admin/telas`

Solo `profiles.role = 'admin'` puede acceder.

## Navegación

Para usuarios no autenticados:

- Inicio
- Cotizar
- Ingresar
- Crear cuenta

Para usuarios autenticados no administradores:

- Inicio
- Cotizar
- Mi cuenta → `/panel`
- Salir

Para administradores se mantiene además el acceso a `/admin/dashboard`.

## Proxy

Next.js 16.3.2 utiliza `src/proxy.ts` con export `proxy`.

El Proxy no debe proteger todo el sitio. Las rutas públicas deben seguir siendo accesibles sin sesión.

El Proxy protege únicamente:

- `/panel/*` — requiere sesión
- `/admin/*` — requiere sesión y `profiles.role = 'admin'`

Las APIs quedan fuera del matcher del Proxy y realizan su propia autenticación/autorización.

Además existe una segunda barrera en `src/app/panel/layout.tsx`, que verifica la sesión antes de renderizar el área privada.

## Clientes Supabase

Browser:

```ts
import { supabase } from "@/lib/supabase/client";
```

Server Components / Route Handlers:

```ts
import { createClient } from "@/lib/supabase-server";
```

No introducir un cliente paralelo con sesión independiente en `localStorage`.

## Estado funcional

Conectado a Supabase:

- `/` catálogo público
- `/login`
- `/register`
- `/cotizar`
- `/panel`
- `/panel/cotizaciones`
- `/panel/pedidos`
- `/panel/ordenes/[id]`
- `/api/ordenes`
- `/api/ordenes/[id]/estado`

Interfaz administrativa en proceso de integración:

- `/admin/dashboard`
- `/admin/productos`
- `/admin/ordenes`
- `/admin/taller`
- `/admin/telas`

Estas pantallas contienen todavía componentes visuales y/o datos de ejemplo. El objetivo es conservar el lenguaje visual pero conectar progresivamente cada módulo al esquema real.

## Seguimiento de entrega

El panel ya separa el detalle del proyecto del proceso de cotización, pero el esquema actual de `orders` todavía no contiene número de tracking, transportista ni estado de despacho.

No inventar esos datos en frontend. Antes de mostrar tracking real se deberá definir y aplicar una migración explícita para el modelo de entrega.

## Sistema visual

La dirección estética toma como referencia el lenguaje editorial de sitios de alta gama de control solar: mucho espacio negativo, tipografía serif para mensajes de marca, sans-serif limpia para operación, paleta marfil/arena, negro carbón y un acento metálico cálido.

La plataforma Ciao Sole debe mantener una identidad propia y priorizar la cotización, la personalización, el control de precios por rol y la operación interna.

## Migraciones

Las migraciones históricas no deben editarse después de haber sido ejecutadas.

Si se modifica el esquema real, agregar una migración nueva y verificarla contra Supabase antes de tocar datos de producción.

## Antes de subir cambios

Ejecutar:

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

Y, para cambios de Supabase, comprobar también el esquema real y las policies antes de modificar código que dependa de ellas.
