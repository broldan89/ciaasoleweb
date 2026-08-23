-- =====================================================================
-- Migración 0003: corrige que 0002 no era segura de re-ejecutar.
--
-- La línea `alter table profiles add constraint profiles_rol_solicitado_check`
-- de 0002 no tenía protección contra "ya existe" (a diferencia de las
-- columnas, que sí usaban IF NOT EXISTS). Si 0002 se corrió más de una
-- vez, esa línea fallaba y abortaba todo el resto del script en esa
-- ejecución — incluida la re-creación de políticas RLS. Esta migración:
--   1. Hace ese constraint idempotente de verdad (igual que ya se hacía
--      con profiles_role_check).
--   2. Vuelve a asegurar (drop + create) TODAS las policies de profiles,
--      productos, variantes_producto, ordenes e items_orden, por las
--      dudas de que alguna haya quedado sin recrear.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Constraint idempotente
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'profiles_rol_solicitado_check'
  ) then
    alter table public.profiles
      add constraint profiles_rol_solicitado_check
      check (rol_solicitado in ('cliente', 'mayorista'))
      not valid;
  end if;
exception when others then
  null;
end $$;

-- ---------------------------------------------------------------------
-- 2. Re-asegurar RLS de profiles (por si quedó sin recrear en un run
--    fallido de 0002)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_propio_o_admin" on public.profiles;
create policy "profiles_select_propio_o_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "profiles_update_solo_admin" on public.profiles;
create policy "profiles_update_solo_admin"
  on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------
-- 3. Re-asegurar RLS del resto de las tablas (mismo motivo)
-- ---------------------------------------------------------------------
alter table public.productos enable row level security;
alter table public.variantes_producto enable row level security;
alter table public.ordenes enable row level security;
alter table public.items_orden enable row level security;

drop policy if exists "productos_select_publico" on public.productos;
create policy "productos_select_publico"
  on public.productos for select
  using (is_active = true);

drop policy if exists "variantes_select_solo_admin" on public.variantes_producto;
create policy "variantes_select_solo_admin"
  on public.variantes_producto for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "productos_admin_insert" on public.productos;
create policy "productos_admin_insert"
  on public.productos for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "variantes_admin_insert" on public.variantes_producto;
create policy "variantes_admin_insert"
  on public.variantes_producto for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "ordenes_select_propia_o_admin" on public.ordenes;
create policy "ordenes_select_propia_o_admin"
  on public.ordenes for select
  using (
    usuario_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "ordenes_insert_propia" on public.ordenes;
create policy "ordenes_insert_propia"
  on public.ordenes for insert
  with check (usuario_id = auth.uid());

drop policy if exists "ordenes_update_solo_admin" on public.ordenes;
create policy "ordenes_update_solo_admin"
  on public.ordenes for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "items_orden_select_propio_o_admin" on public.items_orden;
create policy "items_orden_select_propio_o_admin"
  on public.items_orden for select
  using (
    exists (
      select 1 from public.ordenes o
      where o.id = items_orden.orden_id
        and (o.usuario_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

drop policy if exists "items_orden_insert_propio" on public.items_orden;
create policy "items_orden_insert_propio"
  on public.items_orden for insert
  with check (
    exists (select 1 from public.ordenes o where o.id = items_orden.orden_id and o.usuario_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 4. Verificación: confirma que la policy de select quedó bien.
-- ---------------------------------------------------------------------
-- select policyname, cmd from pg_policies where tablename = 'profiles';
