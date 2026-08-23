-- =====================================================================
-- Migración 0004: completa la unificación de nombres a inglés.
--
-- Estado real de la base al momento de escribir esto (confirmado con
-- el usuario):
--   - profiles            -> SIN CAMBIOS (queda en inglés/neutro tal cual)
--   - ordenes  -> orders  -> YA RENOMBRADA (incluye usuario_id -> user_id)
--   - items_orden         -> PENDIENTE, esta migración la renombra
--   - productos           -> PENDIENTE, esta migración la renombra
--   - variantes_producto  -> PENDIENTE, esta migración la renombra
--   - obtener_precio_variante() -> SIN CAMBIOS de nombre (decisión
--     explícita del usuario), pero su cuerpo SÍ debe actualizarse para
--     apuntar a product_variants en vez de variantes_producto.
--
-- Todo escrito de forma idempotente (chequea existencia antes de
-- renombrar) para poder re-correr esto sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Renombrar tablas (solo si todavía existen con el nombre viejo)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'items_orden') then
    alter table public.items_orden rename to order_items;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'productos') then
    alter table public.productos rename to products;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'variantes_producto') then
    alter table public.variantes_producto rename to product_variants;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. Renombrar columnas (solo si todavía tienen el nombre viejo)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='orden_id') then
    alter table public.order_items rename column orden_id to order_id;
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='variante_id') then
    alter table public.order_items rename column variante_id to product_variant_id;
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='product_variants' and column_name='producto_id') then
    alter table public.product_variants rename column producto_id to product_id;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Actualizar el cuerpo de obtener_precio_variante() para que
--    apunte a product_variants. El NOMBRE de la función y de su
--    parámetro quedan igual (así el código de la app no necesita
--    tocarse) — solo cambia la tabla que consulta por dentro.
-- ---------------------------------------------------------------------
create or replace function public.obtener_precio_variante(p_variante_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := 'anonimo';
  v_precio numeric;
begin
  if auth.uid() is not null then
    select role into v_role
    from public.profiles
    where id = auth.uid() and aprobado = true;

    v_role := coalesce(v_role, 'cliente');
  end if;

  if v_role in ('mayorista', 'admin') then
    select precio_mayorista into v_precio from public.product_variants where id = p_variante_id;
  else
    select precio_publico into v_precio from public.product_variants where id = p_variante_id;
  end if;

  return v_precio;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Vista pública del catálogo, actualizada al nuevo nombre de tabla
-- ---------------------------------------------------------------------
drop view if exists public.variantes_publico;
create or replace view public.variantes_publico as
select id, product_id, atributos, precio_publico
from public.product_variants;

grant select on public.variantes_publico to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. RLS: recrear todas las policies con los nombres nuevos
-- ---------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "productos_select_publico" on public.products;
create policy "products_select_publico"
  on public.products for select
  using (is_active = true);

drop policy if exists "variantes_select_solo_admin" on public.product_variants;
create policy "product_variants_select_solo_admin"
  on public.product_variants for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "productos_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "variantes_admin_insert" on public.product_variants;
create policy "product_variants_admin_insert"
  on public.product_variants for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "ordenes_select_propia_o_admin" on public.orders;
create policy "orders_select_propia_o_admin"
  on public.orders for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "ordenes_insert_propia" on public.orders;
create policy "orders_insert_propia"
  on public.orders for insert
  with check (user_id = auth.uid());

drop policy if exists "ordenes_update_solo_admin" on public.orders;
create policy "orders_update_solo_admin"
  on public.orders for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "items_orden_select_propio_o_admin" on public.order_items;
create policy "order_items_select_propio_o_admin"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

drop policy if exists "items_orden_insert_propio" on public.order_items;
create policy "order_items_insert_propio"
  on public.order_items for insert
  with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 6. Verificación
-- ---------------------------------------------------------------------
-- select table_name from information_schema.tables where table_schema = 'public';
