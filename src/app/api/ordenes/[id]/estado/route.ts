import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  estado: z.enum([
    "cotizacion",
    "borrador",
    "aprobada",
    "facturada",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "No autenticado.",
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Estado inválido.",
      },
      { status: 400 },
    );
  }

  // La autorización real debe quedar protegida por RLS.
  // Acá simplemente usamos la tabla real de Supabase.
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: parsed.data.estado,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error(
      "Error actualizando estado de orden:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el estado. Verificá que tengas permisos de administrador.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    orden: data,
  });
}