import { createClient } from "@/lib/supabase-server";
import type { Tela } from "./types";

type TelaRow = {
  id: string;
  nombre: string;
  ancho_fabrica_mm: number;
  apaisable: boolean;
  is_active: boolean;
};

export async function obtenerTelaPorId(
  telaId: string,
): Promise<Tela | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("telas")
    .select(
      "id, nombre, ancho_fabrica_mm, apaisable, is_active",
    )
    .eq("id", telaId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error al obtener tela: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  const row = data as TelaRow;

  return {
    id: row.id,
    nombre: row.nombre,
    anchoFabricaCm: row.ancho_fabrica_mm / 10,
    apaisable: row.apaisable,
  };
}