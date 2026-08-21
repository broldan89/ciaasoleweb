-- =====================================================================
-- Migración: roles seguros (profiles) + precios calculados en servidor
--
-- Por qué existe esto:
-- El código original guardaba el rol del usuario ("cliente" / "mayorista")
-- en `user_metadata`, un campo que el propio usuario puede editar desde
-- el navegador con el SDK de Supabase. Cualquiera podía autoasignarse
-- "mayorista" y acceder a precios de por mayor. Esta migración mueve el
-- rol a una tabla protegida por RLS que SOLO un admin puede modificar,
-- y agrega una función que calcula el precio correcto en el servidor
-- sin exponer nunca precio_publico y precio_mayorista juntos al cliente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabla de perfiles (fuente de verdad del rol, separada de auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  rol text not null default 'cliente' check (rol in ('cliente', 'mayorista', 'admin')),
  rol_solicitado text check (rol_solicitado in ('cliente', 'mayorista')),
  aprobado boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Un usuario ve su propio perfil. Un admin ve todos.
create policy "profiles_select_propio_o_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin')
  );

-- Nadie puede modificar su propio rol. Solo un admin puede actualizar
-- el rol/aprobado de otros usuarios (esto es lo que reemplaza al
-- "autoasignarse mayorista" del código original).
create policy "profiles_update_solo_admin"
  on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'));

-- ---------------------------------------------------------------------
-- 2. Trigger: al registrarse, se crea el perfil automáticamente.
--    El rol real siempre arranca en 'cliente'. Si pidió 'mayorista',
--    queda guardado como solicitud pendiente (aprobado = false) hasta
--    que un admin lo habilite manualmente.
-- ---------------------------------------------------------------------
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  solicitud text := new.raw_user_meta_data ->> 'rol_solicitado';
begin
  insert into public.profiles (id, email, rol, rol_solicitado, aprobado)
  values (
    new.id,
    new.email,
    'cliente', -- el rol real nunca se toma del formulario de registro
    case when solicitud = 'mayorista' then 'mayorista' else null end,
    case when solicitud = 'mayorista' then false else true end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ---------------------------------------------------------------------
-- 3. Función RPC: único punto por el que se obtiene un precio.
--    Nunca devuelve precio_publico y precio_mayorista juntos — decide
--    server-side, según el rol real en `profiles`, cuál corresponde.
-- ---------------------------------------------------------------------
create or replace function public.obtener_precio_variante(p_variante_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_rol text := 'anonimo';
  v_precio numeric;
begin
  if auth.uid() is not null then
    select rol into v_rol
    from public.profiles
    where id = auth.uid() and aprobado = true;

    v_rol := coalesce(v_rol, 'cliente');
  end if;

  if v_rol in ('mayorista', 'admin') then
    select precio_mayorista into v_precio from public.variantes_producto where id = p_variante_id;
  else
    select precio_publico into v_precio from public.variantes_producto where id = p_variante_id;
  end if;

  return v_precio;
end;
$$;

-- ---------------------------------------------------------------------
-- 3b. Vista pública del catálogo: SOLO precio_publico. El catálogo de la
--    home consulta esta vista para mostrar atributos (tela/color/medida),
--    nunca la tabla real — así precio_mayorista jamás sale hacia un
--    visitante anónimo o cliente común, ni siquiera en el HTML/RSC payload.
--    El precio que efectivamente se muestra sale de
--    obtener_precio_variante(), que decide server-side cuál corresponde.
-- ---------------------------------------------------------------------
-- security_invoker queda en su default (off): la vista corre con los
-- privilegios de su dueño, no del usuario que consulta. Es intencional:
-- así puede mostrar precio_publico a cualquiera aunque la tabla real
-- (variantes_producto) esté bloqueada por RLS a solo admin.
create or replace view public.variantes_publico as
select id, producto_id, atributos, precio_publico
from public.variantes_producto;

grant select on public.variantes_publico to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. RLS en tablas operativas
-- ---------------------------------------------------------------------
alter table public.productos enable row level security;
alter table public.variantes_producto enable row level security;
alter table public.ordenes enable row level security;
alter table public.items_orden enable row level security;

-- Catálogo: lectura pública de productos activos (sin precios acá).
create policy "productos_select_publico"
  on public.productos for select
  using (is_active = true);

-- Variantes: la tabla completa (con AMBOS precios) solo la lee un admin
-- o el propio backend vía la función RPC (que corre con SECURITY DEFINER
-- y no pasa por esta policy). El público/cliente jamás hace select directo
-- a esta tabla desde el navegador.
create policy "variantes_select_solo_admin"
  on public.variantes_producto for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "productos_admin_insert"
  on public.productos for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "variantes_admin_insert"
  on public.variantes_producto for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'));

-- Órdenes: cada usuario ve y crea las suyas. Admin ve y actualiza todas.
create policy "ordenes_select_propia_o_admin"
  on public.ordenes for select
  using (
    usuario_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin')
  );

create policy "ordenes_insert_propia"
  on public.ordenes for insert
  with check (usuario_id = auth.uid());

create policy "ordenes_update_solo_admin"
  on public.ordenes for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'));

create policy "items_orden_select_propio_o_admin"
  on public.items_orden for select
  using (
    exists (
      select 1 from public.ordenes o
      where o.id = items_orden.orden_id
        and (o.usuario_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'))
    )
  );

create policy "items_orden_insert_propio"
  on public.items_orden for insert
  with check (
    exists (select 1 from public.ordenes o where o.id = items_orden.orden_id and o.usuario_id = auth.uid())
  );

-- NOTA IMPORTANTE: el total de cada ítem y de la orden se recalcula en
-- el servidor (ver src/app/api/ordenes/route.ts) usando
-- obtener_precio_variante(). El monto que mande el navegador nunca se
-- usa para persistir precios — solo cantidad y variante_id son confiables.
