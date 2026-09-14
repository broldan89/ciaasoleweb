create table if not exists public.sistemas_comerciales (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  descripcion text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.sistemas_comerciales enable row level security;

create policy sistemas_comerciales_select_authenticated
on public.sistemas_comerciales
for select to authenticated
using (is_active = true);

insert into public.sistemas_comerciales (codigo, nombre, descripcion)
values ('STANDARD', 'Standard', 'Sistema roller estándar de Ciao Sole.')
on conflict (codigo) do update
set nombre = excluded.nombre,
    descripcion = excluded.descripcion;

alter table public.costos_variantes_producto
  add column if not exists sistema_id uuid references public.sistemas_comerciales(id);

update public.costos_variantes_producto
set sistema_id = (
  select id from public.sistemas_comerciales where codigo = 'STANDARD'
)
where sistema_id is null;

create index if not exists costos_variantes_producto_sistema_id_idx
  on public.costos_variantes_producto(sistema_id);
