import { User } from "@supabase/supabase-js";

interface Variante {
  precio_publico: number;
  precio_mayorista: number;
}

export function obtenerPrecioParaUsuario(
  variante: Variante,
  usuario: User | null,
) {
  const esMayorista = usuario?.user_metadata?.rol === "mayorista";
  return esMayorista ? variante.precio_mayorista : variante.precio_publico;
}
