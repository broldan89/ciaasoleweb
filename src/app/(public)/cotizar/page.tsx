import { createClient } from "@/lib/supabase-server";
import CotizarPageClient from "./CotizarPageClient";

interface ProductoRow {
  id: string;
  nombre: string;
}

interface VarianteRow {
  id: string;
  producto_id: string;
  atributos: Record<string, string>;
  precio_publico: number;
}

export default async function CotizarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: productosData }, { data: variantesData }] =
    await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre")
        .eq("is_active", true)
        .order("nombre")
        .returns<ProductoRow[]>(),
      supabase
        .from("variantes_producto")
        .select("id, producto_id, atributos, precio_publico")
        .eq("is_active", true)
        .returns<VarianteRow[]>(),
    ]);

  const productos = productosData ?? [];
  const variantes = variantesData ?? [];

  const catalogo = await Promise.all(
    variantes.map(async (variante) => {
      const producto = productos.find(
        (actual) => actual.id === variante.producto_id,
      );

      const { data: precio, error } = await supabase.rpc(
        "obtener_precio_variante",
        {
          p_variante_id: variante.id,
        },
      );

      const precioFinal =
        !error && precio != null
          ? Number(precio)
          : Number(variante.precio_publico);

      const nombreVariante =
        Object.entries(variante.atributos ?? {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(" · ") || "Configuración estándar";

      return {
        varianteId: variante.id,
        productoNombre: producto?.nombre ?? "Sistema",
        nombre: nombreVariante,
        precio: Number.isFinite(precioFinal) ? precioFinal : 0,
      };
    }),
  );

  void user;

  return <CotizarPageClient catalogo={catalogo} />;
}
