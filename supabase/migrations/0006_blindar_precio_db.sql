-- =====================================================================
-- Migración 0006: blindar precios y totales a nivel de base de datos.
--
-- La API recalcula los precios server-side, pero la base también debe
-- impedir que un cliente escriba precio_unitario o total manipulados
-- directamente contra Supabase.
--
-- Esquema real:
--   orders
--   items_orden
--   items_orden.variante_id
--   items_orden.orden_id
-- =====================================================================

create or replace function public.forzar_precio_real_item_orden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.precio_unitario :=
    public.obtener_precio_variante(new.variante_id);

  if new.precio_unitario is null then
    raise exception
      'No se pudo calcular el precio para la variante %',
      new.variante_id;
  end if;

  new.total := new.precio_unitario * new.cantidad;

  return new;
end;
$$;

drop trigger if exists trg_forzar_precio_real on public.items_orden;

create trigger trg_forzar_precio_real
before insert or update
on public.items_orden
for each row
execute function public.forzar_precio_real_item_orden();


-- ---------------------------------------------------------------------
-- Recalcular total de la orden después de modificar sus items.
--
-- total = suma(items_orden.total) + shipping_cost
-- ---------------------------------------------------------------------

create or replace function public.recalcular_total_orden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden_id uuid;
  v_total_items numeric;
  v_shipping_cost numeric;
begin
  v_orden_id := coalesce(new.orden_id, old.orden_id);

  select coalesce(sum(total), 0)
  into v_total_items
  from public.items_orden
  where orden_id = v_orden_id;

  select coalesce(shipping_cost, 0)
  into v_shipping_cost
  from public.orders
  where id = v_orden_id;

  update public.orders
  set total = v_total_items + v_shipping_cost
  where id = v_orden_id;

  return null;
end;
$$;

drop trigger if exists trg_recalcular_total_orden
on public.items_orden;

create trigger trg_recalcular_total_orden
after insert or update or delete
on public.items_orden
for each row
execute function public.recalcular_total_orden();
