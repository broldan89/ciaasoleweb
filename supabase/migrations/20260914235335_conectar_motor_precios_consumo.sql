create or replace function public.calcular_precio_variante_consumo(
  p_variante_id uuid,
  p_metros_lineales numeric,
  p_cantidad integer default 1,
  p_regla_id uuid default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_tela record;
  v_costos record;
  v_regla record;
  v_costo_tela numeric;
  v_costo_unitario numeric;
  v_precio_publico numeric;
  v_precio_mayorista numeric;
  v_total numeric;
begin
  if p_metros_lineales is null or p_metros_lineales <= 0 then
    raise exception 'El consumo de tela debe ser mayor a cero.';
  end if;
  if coalesce(p_cantidad, 1) < 1 then
    raise exception 'La cantidad debe ser mayor a cero.';
  end if;
  select t.* into v_tela
  from public.variantes_producto v
  join public.telas t on t.id = v.tela_id
  where v.id = p_variante_id and v.is_active = true and t.is_active = true;
  if not found then raise exception 'No se encontró la variante activa o su tela asociada.'; end if;
  if v_tela.precio_metro_lineal is null then raise exception 'La tela no tiene costo por metro lineal cargado.'; end if;
  select * into v_costos from public.costos_variantes_producto where variante_id = p_variante_id;
  if p_regla_id is null then
    select * into v_regla from public.reglas_precios where is_active = true order by created_at desc limit 1;
  else
    select * into v_regla from public.reglas_precios where id = p_regla_id and is_active = true;
  end if;
  if not found then raise exception 'No existe una regla de precios activa.'; end if;
  v_costo_tela := p_metros_lineales * v_tela.precio_metro_lineal * (1 + coalesce(v_regla.desperdicio, 0));
  v_costo_unitario := v_costo_tela + coalesce(v_costos.costo_sistema, 0) + coalesce(v_costos.costo_accesorios, 0) + coalesce(v_costos.costo_mano_obra, 0) + coalesce(v_costos.otros_costos, 0);
  v_precio_publico := case when v_regla.margen_publico is null then null else v_costo_unitario * (1 + v_regla.margen_publico) end;
  v_precio_mayorista := case when v_regla.margen_mayorista is null then null else v_costo_unitario * (1 + v_regla.margen_mayorista) end;
  if v_precio_publico is not null then
    v_precio_publico := ceil(v_precio_publico / v_regla.redondeo) * v_regla.redondeo;
    if v_regla.minimo_publico is not null then v_precio_publico := greatest(v_precio_publico, v_regla.minimo_publico); end if;
  end if;
  if v_precio_mayorista is not null then
    v_precio_mayorista := ceil(v_precio_mayorista / v_regla.redondeo) * v_regla.redondeo;
    if v_regla.minimo_mayorista is not null then v_precio_mayorista := greatest(v_precio_mayorista, v_regla.minimo_mayorista); end if;
  end if;
  v_total := v_precio_publico * p_cantidad;
  return jsonb_build_object('metros_lineales', round(p_metros_lineales, 2), 'costo_tela', round(v_costo_tela, 2), 'costo_sistema', coalesce(v_costos.costo_sistema, 0), 'costo_accesorios', coalesce(v_costos.costo_accesorios, 0), 'costo_mano_obra', coalesce(v_costos.costo_mano_obra, 0), 'otros_costos', coalesce(v_costos.otros_costos, 0), 'costo_unitario', round(v_costo_unitario, 2), 'precio_publico', v_precio_publico, 'precio_mayorista', v_precio_mayorista, 'cantidad', p_cantidad, 'total_publico', case when v_precio_publico is null then null else v_total end);
end;
$$;
grant execute on function public.calcular_precio_variante_consumo(uuid, numeric, integer, uuid) to anon, authenticated;
