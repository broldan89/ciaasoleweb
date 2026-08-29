import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

const schema = z.object({
  codigoPostal: z.number().int().min(0).max(99999),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Código postal inválido." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "calcular_envios_por_codigo_postal",
    { p_codigo_postal: parsed.data.codigoPostal },
  );

  if (error) {
    console.error("Error calculando envío:", error);
    return NextResponse.json(
      { error: "No se pudieron consultar las opciones de envío." },
      { status: 500 },
    );
  }

  return NextResponse.json({ opciones: data ?? [] });
}
