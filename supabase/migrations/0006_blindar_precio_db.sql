-- =====================================================================
-- Migración 0006: blindar el precio a nivel de base de datos.
--
-- Hallazgo de la auditoría de seguridad (ver conversación): la API de
-- Next.js (src/app/api/ordenes/route.ts) SIEMPRE recalcula el precio
-- server-side con obtener_precio_variante() antes de insertar. Pero esa
-- protección vive solo en la API — la política RLS de INSERT sobre
-- order_items solo valida que la orden le pertenezca al usuario, no que
-- el precio sea correcto. Como NEXT_PUBLIC_SUPABASE_ANON_KEY es pública
-- por diseño, cualquiera puede saltear la API y hablarle directo a
-- Supabase con un precio inventado.
--
-- Esta migración cierra eso con un trigger: sin importar qué mande el
-- cliente (API real o alguien saltéandola), precio_unitario y total se
-- recalculan siempre del lado del servidor.
--
-- IMPORTANTE — verificar antes de correr:
-- El código de la API usa los nombres en inglés (orders, order_items,
-- product_variant_id), pero ARCHITECTURE.md documentaba (al 2026-08-23)
-- que items_orden seguía en español en la base real. Como la API en
-- inglés está en uso, asumo que ya se migró — pero confirmá con
-- `select table_name from information_schema.tables where table_name
-- in ('order_items','items_orden')` cuál existe de verdad antes de
-- correr esto, y ajustá los nombres de tabla/columna si hace falta.
-- =====================================================================

create or replace function public.forzar_precio_real_item_orden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.precio_unitario := public.obtener_precio_variante(new.product_variant_id);

  if new.precio_unitario is null then
    raise exception 'No se pudo calcular el precio para la variante %', new.product_variant_id;
  end if;

  new.total := new.precio_unitario * new.cantidad;
  return new;
end;
$$;

drop trigger if exists trg_forzar_precio_real on public.order_items;
create trigger trg_forzar_precio_real
  before insert or update on public.order_items
  for each row execute function public.forzar_precio_real_item_orden();

-- ---------------------------------------------------------------------
-- Total de la orden: recalculado siempre como suma real de sus items +
-- costo de envío, nunca confiando en el total que mande el cliente.
-- Corre DESPUÉS del insert/update de cada item (no se puede sumar los
-- items de una orden mientras el item que dispara el trigger todavía
-- no se terminó de insertar/actualizar).
-- ---------------------------------------------------------------------
create or replace function public.recalcular_total_orden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := coalesce(new.order_id, old.order_id);
  v_total_items numeric;
  v_shipping_cost numeric;
begin
  select coalesce(sum(total), 0) into v_total_items
  from public.order_items
  where order_id = v_order_id;

  select shipping_cost into v_shipping_cost
  from public.orders
  where id = v_order_id;

  update public.orders
  set total = v_total_items + coalesce(v_shipping_cost, 0)
  where id = v_order_id;

  return null; -- trigger AFTER: el valor de retorno no se usa
end;
$$;

drop trigger if exists trg_recalcular_total_orden on public.order_items;
create trigger trg_recalcular_total_orden
  after insert or update or delete on public.order_items
  for each row execute function public.recalcular_total_orden();
