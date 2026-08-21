import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

// Solo aceptamos varianteId + cantidad del cliente. El precio y el total
// SIEMPRE se recalculan acá adentro con obtener_precio_variante() — el
// front-end no tiene forma de mandar un precio falso.
const itemSchema = z.object({
  varianteId: z.string().uuid(),
  cantidad: z.number().int().positive().max(1000),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1),
  notas: z.string().max(2000).optional().default(""),
  status: z.enum(["borrador", "cotizacion"]).optional().default("cotizacion"),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para cotizar." },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", detalles: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { items, notas, status } = parsed.data;

  // Recalculamos cada precio unitario en el servidor vía la función RPC,
  // que decide según el rol real del usuario (tabla profiles) qué precio
  // corresponde. Nunca confiamos en un precio que venga del cliente.
  const itemsConPrecio: {
    variante_id: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
  }[] = [];

  for (const item of items) {
    const { data: precio, error: errorPrecio } = await supabase.rpc(
      "obtener_precio_variante",
      { p_variante_id: item.varianteId },
    );

    if (errorPrecio || precio == null) {
      return NextResponse.json(
        { error: `No se pudo obtener el precio de la variante ${item.varianteId}.` },
        { status: 400 },
      );
    }

    itemsConPrecio.push({
      variante_id: item.varianteId,
      cantidad: item.cantidad,
      precio_unitario: precio,
      total: precio * item.cantidad,
    });
  }

  const totalOrden = itemsConPrecio.reduce((acc, item) => acc + item.total, 0);

  const { data: orden, error: errorOrden } = await supabase
    .from("ordenes")
    .insert({
      usuario_id: user.id,
      status,
      total: totalOrden,
      notas,
    })
    .select()
    .single();

  if (errorOrden || !orden) {
    return NextResponse.json(
      { error: "Error al crear la orden." },
      { status: 500 },
    );
  }

  const { error: errorItems } = await supabase.from("items_orden").insert(
    itemsConPrecio.map((item) => ({
      orden_id: orden.id,
      variante_id: item.variante_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      total: item.total,
    })),
  );

  if (errorItems) {
    // Dejamos la orden en borrador huérfana antes que insertar items sin
    // control; en un siguiente paso conviene envolver esto en una función
    // transaccional de Postgres (RPC) para que sea atómico de verdad.
    return NextResponse.json(
      { error: "Error al guardar los ítems de la orden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ orden, total: totalOrden }, { status: 201 });
}
