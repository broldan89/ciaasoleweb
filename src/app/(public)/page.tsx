import { createClient } from "@/lib/supabase-server";
import PriceDisplay from "@/components/PriceDisplay";
import AgregarCarrito from "@/components/AgregarCarrito";

interface Variante {
  id: string;
  producto_id: string;
  atributos: Record<string, string>;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  variantes_publico: Variante[];
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Traemos el rol una sola vez, solo para decidir la etiqueta visual
  // ("Precio mayorista"). El precio en sí NUNCA sale de acá: sale de
  // obtener_precio_variante(), que ya sabe el rol del lado del servidor.
  let esMayorista = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    esMayorista = perfil?.rol === "mayorista" || perfil?.rol === "admin";
  }

  // variantes_publico es una vista que solo expone precio_publico —
  // precio_mayorista nunca llega a este componente ni al HTML/RSC payload.
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, variantes_publico(id, producto_id, atributos)")
    .eq("is_active", true)
    .returns<Producto[]>();

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">CIAO SOLE</h1>
        <p className="text-gray-600 text-lg">Cortinas y persianas a medida</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {productos?.map((producto) => (
          <div
            key={producto.id}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-bold mb-2">{producto.nombre}</h2>
            <p className="text-gray-600 mb-4">{producto.descripcion}</p>

            <div className="mt-4 space-y-3">
              {producto.variantes_publico?.map((variante) => (
                <VarianteRow
                  key={variante.id}
                  variante={variante}
                  nombreProducto={producto.nombre}
                  esMayorista={esMayorista}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function VarianteRow({
  variante,
  nombreProducto,
  esMayorista,
}: {
  variante: Variante;
  nombreProducto: string;
  esMayorista: boolean;
}) {
  const supabase = await createClient();
  const { data: precio } = await supabase.rpc("obtener_precio_variante", {
    p_variante_id: variante.id,
  });

  return (
    <div className="border-t pt-3">
      <p className="text-sm text-gray-500 mb-1">
        {JSON.stringify(variante.atributos)}
      </p>
      <div className="flex items-center justify-between">
        <PriceDisplay precio={precio ?? 0} esMayorista={esMayorista} />
        <AgregarCarrito
          varianteId={variante.id}
          nombre={nombreProducto}
          precio={precio ?? 0}
        />
      </div>
    </div>
  );
}
