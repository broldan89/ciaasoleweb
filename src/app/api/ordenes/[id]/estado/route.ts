import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  estado: z.enum(["cotizacion", "borrador", "aprobada", "facturada"]),
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
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  // La RLS ("ordenes_update_solo_admin") ya bloquea esto a nivel de base
  // de datos si el usuario no es admin — acá solo damos un mensaje claro
  // en vez de un error genérico de Postgres.
  const { data, error } = await supabase
    .from("ordenes")
    .update({ status: parsed.data.estado })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo actualizar el estado (¿tenés permisos de admin?)." },
      { status: 403 },
    );
  }

  return NextResponse.json({ orden: data });
}
