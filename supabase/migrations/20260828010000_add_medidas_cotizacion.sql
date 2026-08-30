alter table public.items_orden
  add column if not exists ancho_cliente_cm numeric,
  add column if not exists alto_cliente_cm numeric,
  add column if not exists metros_lineales numeric,
  add column if not exists orientacion text;

alter table public.items_orden
  drop constraint if exists items_orden_orientacion_check;

alter table public.items_orden
  add constraint items_orden_orientacion_check
  check (
    orientacion is null
    or orientacion in ('normal', 'apaisada')
  );

alter table public.items_orden
  add constraint items_orden_ancho_cliente_cm_check
  check (
    ancho_cliente_cm is null
    or ancho_cliente_cm > 0
  );

alter table public.items_orden
  add constraint items_orden_alto_cliente_cm_check
  check (
    alto_cliente_cm is null
    or alto_cliente_cm > 0
  );

alter table public.items_orden
  add constraint items_orden_metros_lineales_check
  check (
    metros_lineales is null
    or metros_lineales >= 0
  );