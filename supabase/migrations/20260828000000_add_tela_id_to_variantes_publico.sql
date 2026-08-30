create or replace view public.variantes_publico
with (security_invoker = true)
as
select
  id,
  producto_id,
  atributos,
  precio_publico,
  tela_id
from public.variantes_producto
where is_active = true;