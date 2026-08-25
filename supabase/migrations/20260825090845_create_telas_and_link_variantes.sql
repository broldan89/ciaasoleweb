create table if not exists public.telas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ancho_fabrica_mm integer not null,
  apaisable boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint telas_ancho_fabrica_mm_check check (ancho_fabrica_mm > 0)
);

alter table public.variantes_producto
  add column if not exists tela_id uuid
  references public.telas(id)
  on delete restrict;

create index if not exists idx_variantes_producto_tela_id
  on public.variantes_producto(tela_id);

alter table public.telas enable row level security;

create policy "telas_select_publico"
  on public.telas
  for select
  to anon, authenticated
  using (is_active = true);

create policy "telas_admin_insert"
  on public.telas
  for insert
  to authenticated
  with check (is_admin());

create policy "telas_admin_update"
  on public.telas
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "telas_admin_delete"
  on public.telas
  for delete
  to authenticated
  using (is_admin());