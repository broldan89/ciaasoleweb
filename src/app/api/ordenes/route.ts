import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

const itemSchema = z.object({
  varianteId: z.string().uuid(),
  cantidad: z.number().int().positive().max(1000),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1),
  notas: z.string().max(2000).optional().default(""),
  codigoPostal: z.number().int().min(0).max(99999),
  shippingMethodId: z.string().uuid(),
  status: z.enum(["borrador", "cotizacion"]).optional().default("cotizacion"),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debés iniciar sesión para cotizar." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos.", detalles: parsed.error.flatten() }, { status: 400 });
  }

  const { items, notas, codigoPostal, shippingMethodId, status } = parsed.data;
  const itemsConPrecio: { variante_id: string; cantidad: number; precio_unitario: number; total: number }[] = [];

  for (const item of items) {
    const { data: precio, error: errorPrecio } = await supabase.rpc("obtener_precio_variante", {
      p_variante_id: item.varianteId,
    });

    if (errorPrecio || precio == null) {
      console.error("Error obteniendo precio:", errorPrecio);
      return NextResponse.json({ error: `No se pudo obtener el precio de la variante ${item.varianteId}.` }, { status: 400 });
    }

    const precioNumerico = Number(precio);
    itemsConPrecio.push({
      variante_id: item.varianteId,
      cantidad: item.cantidad,
      precio_unitario: precioNumerico,
      total: precioNumerico * item.cantidad,
    });
  }

  const { data: envios, error: errorEnvio } = await supabase.rpc("obtener_cotizacion_envio", {
    p_codigo_postal: codigoPostal,
    p_shipping_method_id: shippingMethodId,
  });

  if (errorEnvio || !envios?.length) {
    console.error("Error obteniendo envío:", errorEnvio);
    return NextResponse.json({ error: "No existe una tarifa de envío para ese código postal y método seleccionado." }, { status: 400 });
  }

  const shippingCost = Number(envios[0].costo);
  const totalProductos = itemsConPrecio.reduce((acc, item) => acc + item.total, 0);
  const totalOrden = totalProductos + shippingCost;

  const { data: orden, error: errorOrden } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status,
      total: totalOrden,
      notas,
      codigo_postal: codigoPostal,
      shipping_method_id: shippingMethodId,
      shipping_cost: shippingCost,
    })
    .select()
    .single();

  if (errorOrden || !orden) {
    console.error("Error creando orden:", errorOrden);
    return NextResponse.json({ error: "Error al crear la orden." }, { status: 500 });
  }

  const { error: errorItems } = await supabase
    .from("order_items")
    .insert(itemsConPrecio.map((item) => ({
      order_id: orden.id,
      product_variant_id: item.variante_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      total: item.total,
    })));

  if (errorItems) {
    console.error("Error guardando items de orden:", errorItems);
    return NextResponse.json({ error: "Error al guardar los ítems de la orden." }, { status: 500 });
  }

  return NextResponse.json({ orden, total: totalOrden, shippingCost }, { status: 201 });
}
