-- =====================================================================
-- Migración 0002: adapta la migración de roles al esquema REAL de
-- `profiles`, que ya existía en el proyecto con estas columnas:
--   id uuid, email text, role text, created_at timestamptz
--
-- La migración 0001 asumía una tabla nueva con columna "rol" (con una
-- sola "o") — falló porque la tabla ya existía con "role". Esta versión:
--   1. Agrega las columnas que faltan para el flujo de aprobación manual
--      de mayoristas (rol_solicitado, aprobado), sin tocar filas existentes.
--   2. Reemplaza toda referencia a "rol" por "role" en políticas y función.
--   3. Es segura de correr aunque parte de 0001 haya quedado aplicada a
--      medias (usa "drop if exists" / "create or replace" en todo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Columnas que faltan para el flujo de aprobación manual
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists rol_solicitado text;

alter table public.profiles
  add constraint profiles_rol_solicitado_check
  check (rol_solicitado in ('cliente', 'mayorista'))
  not valid; -- no valida filas viejas, solo las nuevas/futuras

alter table public.profiles
  add column if not exists aprobado boolean not null default true;

-- Aseguramos que el check de "role" contemple los tres valores que usamos
-- (si ya existía un check distinto con otro nombre, este se agrega igual;
-- no rompe nada si "role" ya solo contiene estos valores)
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('cliente', 'mayorista', 'admin'));
  end if;
exception when others then
  -- si ya hay una constraint equivalente con otro nombre, seguimos sin fallar
  null;
end $$;

-- ---------------------------------------------------------------------
-- 2. RLS en profiles (recreamos las policies con el nombre de columna
--    correcto — drop if exists por si 0001 alcanzó a crear alguna)
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
-- 3. Trigger de alta de usuario (create or replace es seguro de re-correr)
-- ---------------------------------------------------------------------
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  solicitud text := new.raw_user_meta_data ->> 'rol_solicitado';
begin
  insert into public.profiles (id, email, role, rol_solicitado, aprobado)
  values (
    new.id,
    new.email,
    'cliente',
    case when solicitud = 'mayorista' then 'mayorista' else null end,
    case when solicitud = 'mayorista' then false else true end
  )
  on conflict (id) do nothing; -- por si el perfil ya existiera
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ---------------------------------------------------------------------
-- 4. Función RPC de precio: usa "role", no "rol"
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
    select precio_mayorista into v_precio from public.variantes_producto where id = p_variante_id;
  else
    select precio_publico into v_precio from public.variantes_producto where id = p_variante_id;
  end if;

  return v_precio;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Vista pública del catálogo (sin precio_mayorista) — sin cambios de
--    fondo respecto a 0001, solo create or replace por si ya existía
-- ---------------------------------------------------------------------
create or replace view public.variantes_publico as
select id, producto_id, atributos, precio_publico
from public.variantes_producto;

grant select on public.variantes_publico to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. RLS en tablas operativas — recreadas con "role"
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
-- 7. Verificación final: confirma que tu usuario admin sigue como admin.
--    Corré esto después de aplicar todo lo de arriba.
-- ---------------------------------------------------------------------
-- select id, email, role, aprobado from public.profiles where role = 'admin';
