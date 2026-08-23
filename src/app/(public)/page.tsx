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

  let esMayorista = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    esMayorista = perfil?.role === "mayorista" || perfil?.role === "admin";
  }

  const { data: productos } = await supabase
    .from("productos")
    .select(
      "id, nombre, descripcion, variantes_publico(id, producto_id, atributos)",
    )
    .eq("is_active", true)
    .returns<Producto[]>();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      {/* Encabezado */}
      <div className="text-center mb-16 md:mb-20">
        <h1 className="font-serif text-6xl md:text-7xl font-light tracking-wide text-stone-900">
          CIAO SOLE
        </h1>
        <p className="mt-3 text-stone-500 text-lg md:text-xl italic font-light tracking-wider">
          Cortinas y persianas a medida
        </p>
        <div className="mt-6 w-16 h-0.5 bg-stone-300 mx-auto" />
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {productos?.map((producto) => (
          <div
            key={producto.id}
            className="group border border-stone-200 rounded-none p-6 hover:border-stone-400 transition-colors duration-300 bg-white"
          >
            <h2 className="font-serif text-xl font-normal text-stone-800 mb-2">
              {producto.nombre}
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-4">
              {producto.descripcion}
            </p>

            <div className="space-y-3">
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

        {(!productos || productos.length === 0) && (
          <div className="col-span-full text-center py-16 text-stone-400">
            <p className="font-serif text-xl">Próximamente disponibles</p>
            <p className="text-sm mt-1">
              Estamos actualizando nuestra colección
            </p>
          </div>
        )}
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
    <div className="pt-3 border-t border-stone-100">
      <p className="text-xs text-stone-400 mb-1 font-mono">
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
