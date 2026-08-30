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

  // Defensa en profundidad: no confiar únicamente en RLS. Esta
  // verificación es redundante con la política de base de datos, pero
  // el estado real de esa política vive fuera de este repo (ver
  // auditoría de seguridad) — mejor no depender de una sola capa.
  const { data: perfil, error: errorPerfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (errorPerfil || perfil?.role !== "admin") {
    return NextResponse.json(
      {
        error: "No autorizado.",
      },
      { status: 403 },
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

  // La política RLS de orders debería rechazar esto también si algo
  // falla acá arriba — pero la verificación de rol ya se hizo explícita
  // en el bloque anterior, no depende solo de RLS.
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