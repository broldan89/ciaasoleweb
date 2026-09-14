alter table public.reglas_precios enable row level security;
alter table public.costos_variantes_producto enable row level security;
alter table public.matriz_precios enable row level security;

create policy reglas_precios_select_authenticated
on public.reglas_precios
for select to authenticated
using (true);

create policy costos_variantes_select_authenticated
on public.costos_variantes_producto
for select to authenticated
using (true);

create policy matriz_precios_select_authenticated
on public.matriz_precios
for select to authenticated
using (true);
