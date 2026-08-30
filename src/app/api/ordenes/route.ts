import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase-server";
import {
  calcularConsumoTela,
  calcularMedidasFabricacion,
} from "@/lib/cotizador";

const itemSchema = z.object({
  varianteId: z.string().uuid(),
  cantidad: z.number().int().positive().max(1000),

  anchoCm: z
    .number()
    .finite()
    .positive()
    .max(100000),

  altoCm: z
    .number()
    .finite()
    .positive()
    .max(100000),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1),

  notas: z
    .string()
    .max(2000)
    .optional()
    .default(""),

  codigoPostal: z
    .number()
    .int()
    .min(0)
    .max(99999),

  shippingMethodId: z
    .string()
    .uuid(),

  status: z
    .enum(["borrador", "cotizacion"])
    .optional()
    .default("cotizacion"),
});

type VarianteRow = {
  id: string;
  tela_id: string | null;
};

type TelaRow = {
  id: string;
  nombre: string;
  ancho_fabrica_mm: number;
  apaisable: boolean;
};

/**
 * GET
 *
 * Calcula la fabricación de una variante sin crear una orden.
 *
 * Ejemplo:
 *
 * /api/ordenes?modo=calcular
 *   &varianteId=UUID
 *   &anchoCm=180
 *   &altoCm=220
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);

  const modo = searchParams.get("modo");

  if (modo !== "calcular") {
    return NextResponse.json(
      {
        error: "Modo de consulta inválido.",
      },
      { status: 400 },
    );
  }

  const varianteId = searchParams.get("varianteId");
  const anchoCm = Number(searchParams.get("anchoCm"));
  const altoCm = Number(searchParams.get("altoCm"));

  if (
    !varianteId ||
    !z.string().uuid().safeParse(varianteId).success
  ) {
    return NextResponse.json(
      {
        error: "La variante indicada no es válida.",
      },
      { status: 400 },
    );
  }

  if (
    !Number.isFinite(anchoCm) ||
    !Number.isFinite(altoCm) ||
    anchoCm <= 0 ||
    altoCm <= 0
  ) {
    return NextResponse.json(
      {
        error: "Las medidas deben ser mayores a cero.",
      },
      { status: 400 },
    );
  }

  const { data: variante, error: errorVariante } =
    await supabase
      .from("variantes_producto")
      .select("id, tela_id")
      .eq("id", varianteId)
      .eq("is_active", true)
      .maybeSingle<VarianteRow>();

  if (errorVariante) {
    console.error(
      "Error obteniendo variante:",
      errorVariante,
    );

    return NextResponse.json(
      {
        error: "No se pudo obtener la variante.",
      },
      { status: 500 },
    );
  }

  if (!variante) {
    return NextResponse.json(
      {
        error:
          "La variante indicada no existe o está inactiva.",
      },
      { status: 404 },
    );
  }

  if (!variante.tela_id) {
    return NextResponse.json(
      {
        error:
          "La variante no tiene una tela configurada.",
      },
      { status: 400 },
    );
  }

  const { data: tela, error: errorTela } =
    await supabase
      .from("telas")
      .select(
        "id, nombre, ancho_fabrica_mm, apaisable",
      )
      .eq("id", variante.tela_id)
      .eq("is_active", true)
      .maybeSingle<TelaRow>();

  if (errorTela) {
    console.error(
      "Error obteniendo tela:",
      errorTela,
    );

    return NextResponse.json(
      {
        error: "No se pudo obtener la tela.",
      },
      { status: 500 },
    );
  }

  if (!tela) {
    return NextResponse.json(
      {
        error:
          "La tela asociada a la variante no existe o está inactiva.",
      },
      { status: 400 },
    );
  }

  let medidasFabricacion;

  try {
    medidasFabricacion =
      calcularMedidasFabricacion({
        anchoCm,
        altoCm,
      });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron calcular las medidas de fabricación.",
      },
      { status: 400 },
    );
  }

  const resultado = calcularConsumoTela(
    medidasFabricacion,
    {
      id: tela.id,
      nombre: tela.nombre,
      anchoFabricaCm:
        tela.ancho_fabrica_mm / 10,
      apaisable: tela.apaisable,
    },
  );

  return NextResponse.json({
    varianteId: variante.id,

    tela: {
      id: tela.id,
      nombre: tela.nombre,
      anchoFabricaMm: tela.ancho_fabrica_mm,
      apaisable: tela.apaisable,
    },

    medidasCliente: {
      anchoCm,
      altoCm,
    },

    medidasFabricacion,

    resultado,
  });
}

/**
 * POST
 *
 * Crea una cotización.
 *
 * El navegador solamente envía:
 *
 * - variante
 * - cantidad
 * - medidas
 * - notas
 * - código postal
 * - método de envío
 *
 * El servidor vuelve a calcular:
 *
 * - medidas de fabricación
 * - consumo
 * - precio
 * - costo de envío
 * - total
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Debés iniciar sesión para confirmar la cotización.",
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos.",
        detalles: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const {
    items,
    notas,
    codigoPostal,
    shippingMethodId,
    status,
  } = parsed.data;

  const itemsConPrecio: {
    variante_id: string;
    cantidad: number;
    precio_unitario: number;
    total: number;

    ancho_cliente_cm: number;
    alto_cliente_cm: number;
    metros_lineales: number;
    orientacion: "normal" | "apaisada";
  }[] = [];

  for (const item of items) {
    const {
      data: variante,
      error: errorVariante,
    } = await supabase
      .from("variantes_producto")
      .select("id, tela_id")
      .eq("id", item.varianteId)
      .eq("is_active", true)
      .maybeSingle<VarianteRow>();

    if (errorVariante) {
      console.error(
        "Error obteniendo variante:",
        errorVariante,
      );

      return NextResponse.json(
        {
          error: "No se pudo obtener una variante.",
        },
        { status: 500 },
      );
    }

    if (!variante) {
      return NextResponse.json(
        {
          error:
            `La variante ${item.varianteId} no existe o está inactiva.`,
        },
        { status: 400 },
      );
    }

    if (!variante.tela_id) {
      return NextResponse.json(
        {
          error:
            `La variante ${item.varianteId} no tiene una tela configurada.`,
        },
        { status: 400 },
      );
    }

    const {
      data: tela,
      error: errorTela,
    } = await supabase
      .from("telas")
      .select(
        "id, nombre, ancho_fabrica_mm, apaisable",
      )
      .eq("id", variante.tela_id)
      .eq("is_active", true)
      .maybeSingle<TelaRow>();

    if (errorTela) {
      console.error(
        "Error obteniendo tela:",
        errorTela,
      );

      return NextResponse.json(
        {
          error: "No se pudo obtener la tela.",
        },
        { status: 500 },
      );
    }

    if (!tela) {
      return NextResponse.json(
        {
          error:
            `La tela asociada a la variante ${item.varianteId} no existe o está inactiva.`,
        },
        { status: 400 },
      );
    }

    let medidasFabricacion;

    try {
      medidasFabricacion =
        calcularMedidasFabricacion({
          anchoCm: item.anchoCm,
          altoCm: item.altoCm,
        });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "No se pudieron calcular las medidas de fabricación.",
        },
        { status: 400 },
      );
    }

    const resultadoConsumo =
      calcularConsumoTela(
        medidasFabricacion,
        {
          id: tela.id,
          nombre: tela.nombre,
          anchoFabricaCm:
            tela.ancho_fabrica_mm / 10,
          apaisable: tela.apaisable,
        },
      );

    if (!resultadoConsumo.fabricable) {
      return NextResponse.json(
        {
          error:
            `La variante ${item.varianteId} no es fabricable con las medidas indicadas.`,
          motivo: resultadoConsumo.motivo,
          medidasFabricacion,
          tela: {
            id: tela.id,
            nombre: tela.nombre,
            anchoFabricaMm:
              tela.ancho_fabrica_mm,
            apaisable: tela.apaisable,
          },
        },
        { status: 400 },
      );
    }

    /**
     * El precio se obtiene SIEMPRE desde Supabase.
     */
    const {
      data: precio,
      error: errorPrecio,
    } = await supabase.rpc(
      "obtener_precio_variante",
      {
        p_variante_id: item.varianteId,
      },
    );

    if (errorPrecio || precio == null) {
      console.error(
        "Error obteniendo precio:",
        errorPrecio,
      );

      return NextResponse.json(
        {
          error:
            `No se pudo obtener el precio de la variante ${item.varianteId}.`,
        },
        { status: 400 },
      );
    }

    const precioNumerico = Number(precio);

    if (!Number.isFinite(precioNumerico)) {
      return NextResponse.json(
        {
          error:
            `El precio de la variante ${item.varianteId} no es válido.`,
        },
        { status: 500 },
      );
    }

    const totalItem =
      precioNumerico * item.cantidad;

    itemsConPrecio.push({
      variante_id: item.varianteId,
      cantidad: item.cantidad,
      precio_unitario: precioNumerico,
      total: totalItem,

      ancho_cliente_cm: item.anchoCm,
      alto_cliente_cm: item.altoCm,

      metros_lineales:
        resultadoConsumo.metrosLineales,

      orientacion:
        resultadoConsumo.orientacion,
    });
  }

  const totalProductos =
    itemsConPrecio.reduce(
      (acc, item) => acc + item.total,
      0,
    );

  /**
   * El costo de envío también se obtiene desde
   * Supabase según código postal + método seleccionado.
   */
  const {
    data: envios,
    error: errorEnvio,
  } = await supabase.rpc(
    "obtener_cotizacion_envio",
    {
      p_codigo_postal: codigoPostal,
      p_shipping_method_id:
        shippingMethodId,
    },
  );

  if (errorEnvio || !envios?.length) {
    console.error(
      "Error obteniendo envío:",
      errorEnvio,
    );

    return NextResponse.json(
      {
        error:
          "No existe una tarifa de envío para ese código postal y método seleccionado.",
      },
      { status: 400 },
    );
  }

  const shippingCost = Number(
    envios[0].costo,
  );

  if (!Number.isFinite(shippingCost) || shippingCost < 0) {
    return NextResponse.json(
      {
        error:
          "El costo de envío obtenido no es válido.",
      },
      { status: 500 },
    );
  }

  const totalOrden =
    totalProductos + shippingCost;

  const {
    data: orden,
    error: errorOrden,
  } = await supabase
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
    console.error(
      "Error creando orden:",
      errorOrden,
    );

    return NextResponse.json(
      {
        error: "Error al crear la orden.",
      },
      { status: 500 },
    );
  }

  const {
    error: errorItems,
  } = await supabase
    .from("order_items")
    .insert(
      itemsConPrecio.map((item) => ({
        order_id: orden.id,
        product_variant_id:
          item.variante_id,
        cantidad: item.cantidad,
        precio_unitario:
          item.precio_unitario,
        total: item.total,

        ancho_cliente_cm:
          item.ancho_cliente_cm,

        alto_cliente_cm:
          item.alto_cliente_cm,

        metros_lineales:
          item.metros_lineales,

        orientacion:
          item.orientacion,
      })),
    );

  if (errorItems) {
    console.error(
      "Error guardando items de orden:",
      errorItems,
    );

    return NextResponse.json(
      {
        error:
          "Error al guardar los ítems de la orden.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      orden,
      total: totalOrden,
      shippingCost,
    },
    { status: 201 },
  );
}