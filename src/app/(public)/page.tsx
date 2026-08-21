import { createClient } from "@/lib/supabase-server";
import PriceDisplay from "@/components/PriceDisplay";
import AgregarCarrito from "@/components/AgregarCarrito";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: productos } = await supabase
    .from("productos")
    .select("*, variantes_producto(*)")
    .eq("is_active", true);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">CIAO SOLE</h1>
        <p className="text-gray-600 text-lg">Cortinas y persianas a medida</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {productos?.map((producto: any) => (
          <div
            key={producto.id}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-bold mb-2">{producto.nombre}</h2>
            <p className="text-gray-600 mb-4">{producto.descripcion}</p>

            <div className="mt-4 space-y-3">
              {producto.variantes_producto?.map((variante: any) => (
                <div key={variante.id} className="border-t pt-3">
                  <p className="text-sm text-gray-500 mb-1">
                    {JSON.stringify(variante.atributos)}
                  </p>
                  <div className="flex items-center justify-between">
                    <PriceDisplay
                      precioPublico={variante.precio_publico}
                      precioMayorista={variante.precio_mayorista}
                    />
                    <AgregarCarrito
                      varianteId={variante.id}
                      nombre={producto.nombre}
                      precio={
                        user?.user_metadata?.rol === "mayorista"
                          ? variante.precio_mayorista
                          : variante.precio_publico
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
