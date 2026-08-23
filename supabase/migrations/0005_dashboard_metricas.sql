-- =====================================================================
-- Migración 0005: separa el estado comercial del estado de producción
-- y agrega historial de etapas, como base para el Dashboard.
--
-- Contexto: `orders.status` venía usándose para dos cosas distintas al
-- mismo tiempo — el pipeline comercial (cotizacion/borrador/aprobada/
-- facturada, que es lo único que /api/ordenes/[id]/estado sabe escribir)
-- y el pipeline de taller (pendiente/en_proceso/produccion/lista, que es
-- lo único que /admin/taller sabe leer y escribir). Ningún estado de un
-- pipeline es válido para el otro, así que hoy conviven sin comunicarse.
--
-- Esta migración separa ambas cosas en dos columnas y agrega una tabla
-- de eventos para poder medir tiempos por etapa (cuello de botella real
-- de taller), que es lo que necesita el Dashboard para ser útil y no
-- solo decorativo.
--
-- IMPORTANTE (igual que 0004): esta migración documenta el modelo
-- deseado, pero NO se ejecuta automáticamente. Antes de correrla contra
-- Supabase hay que:
--   1. Confirmar el esquema real vigente (puede haber cambiado).
--   2. Decidir junto con /admin/ordenes, /admin/taller y /api/ordenes/*
--      qué valores de `status` existen hoy en producción, para no dejar
--      filas con un status que ya no sea válido bajo el nuevo constraint.
--   3. Actualizar ese código para leer/escribir las columnas nuevas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Pipeline comercial: valores válidos de orders.status
-- ---------------------------------------------------------------------
-- cotizacion    -> el cliente armó un presupuesto, todavía sin confirmar
-- pendiente_pago -> pasó medidas/telas/aprobación, espera pago
-- pagada        -> pago confirmado por la pasarela (Mercado Pago) —
--                  a partir de acá la orden existe como tal en /admin/ordenes
-- cancelada
-- facturada     -> post-venta, ya facturada
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'orders_status_check'
  ) then
    alter table public.orders
      add constraint orders_status_check
      check (status in ('cotizacion', 'pendiente_pago', 'pagada', 'cancelada', 'facturada'))
      not valid;
  end if;
exception when others then
  null;
end $$;

-- ---------------------------------------------------------------------
-- 2. Pipeline de producción: columna nueva, independiente de status
-- ---------------------------------------------------------------------
-- Solo tiene sentido una vez que orders.status = 'pagada'. La actualiza
-- el personal de taller, no ventas.
alter table public.orders
  add column if not exists production_status text;

do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'orders_production_status_check'
  ) then
    alter table public.orders
      add constraint orders_production_status_check
      check (
        production_status is null
        or production_status in (
          'pendiente',
          'en_preparacion',
          'en_produccion',
          'control_calidad',
          'lista_despacho',
          'entregada'
        )
      )
      not valid;
  end if;
exception when others then
  null;
end $$;

-- ---------------------------------------------------------------------
-- 3. Historial de etapas de producción
-- ---------------------------------------------------------------------
-- Guarda cada cambio de production_status con quién y cuándo, para poder
-- calcular tiempo promedio por etapa y detectar dónde se traba el taller.
-- El estado "actual" sigue viviendo en orders.production_status para no
-- tener que hacer un join solo para saber en qué etapa está una orden;
-- esta tabla es el historial, no la fuente de verdad del estado actual.
create table if not exists public.production_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  production_status text not null check (
    production_status in (
      'pendiente',
      'en_preparacion',
      'en_produccion',
      'control_calidad',
      'lista_despacho',
      'entregada'
    )
  ),
  changed_by uuid references public.profiles(id),
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists production_events_order_id_idx
  on public.production_events(order_id);

alter table public.production_events enable row level security;

drop policy if exists "production_events_select_staff" on public.production_events;
create policy "production_events_select_staff"
  on public.production_events for select
  to authenticated
  using (public.is_admin());

drop policy if exists "production_events_insert_staff" on public.production_events;
create policy "production_events_insert_staff"
  on public.production_events for insert
  to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Nota para cuando se conecte production_status a un trigger
-- ---------------------------------------------------------------------
-- Queda pendiente (no forma parte de esta migración) crear un trigger
-- que, al insertar un production_event, actualice automáticamente
-- orders.production_status con el último valor. Por ahora esa
-- sincronización debe hacerla la aplicación en el mismo request.
