"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface OpcionAtributo {
  clave: string;
  valor: string;
}

interface VarianteGenerada {
  atributos: Record<string, string>;
  precio_publico: number;
  precio_mayorista: number;
}

export default function AdminProductosPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [opciones, setOpciones] = useState<OpcionAtributo[]>([]);
  const [atributoClave, setAtributoClave] = useState("");
  const [atributoValor, setAtributoValor] = useState("");
  const [precioPublico, setPrecioPublico] = useState(0);
  const [precioMayorista, setPrecioMayorista] = useState(0);
  const [variantes, setVariantes] = useState<VarianteGenerada[]>([]);

  const agregarOpcion = () => {
    if (!atributoClave || !atributoValor) return;
    setOpciones([...opciones, { clave: atributoClave, valor: atributoValor }]);
    setAtributoClave("");
    setAtributoValor("");
  };

  const combinarAtributos = (
    opciones: OpcionAtributo[],
  ): Record<string, string>[] => {
    if (opciones.length === 0) return [{}];
    const [primera, ...resto] = opciones;
    const combinacionesResto = combinarAtributos(resto);
    return combinacionesResto.flatMap((combinacion) =>
      primera.valor
        ? [{ ...combinacion, [primera.clave]: primera.valor }]
        : [combinacion],
    );
  };

  const generarVariantes = () => {
    const combinaciones = combinarAtributos(opciones);
    const nuevasVariantes = combinaciones.map((atributos) => ({
      atributos,
      precio_publico: precioPublico,
      precio_mayorista: precioMayorista,
    }));
    setVariantes(nuevasVariantes);
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: producto, error } = await supabase
      .from("productos")
      .insert({ nombre, descripcion, categoria })
      .select()
      .single();

    if (error) {
      alert("Error al crear producto");
      return;
    }

    const { error: errorVariante } = await supabase
      .from("variantes_producto")
      .insert(
        variantes.map((v) => ({
          producto_id: producto.id,
          atributos: v.atributos,
          precio_publico: v.precio_publico,
          precio_mayorista: v.precio_mayorista,
        })),
      );

    if (errorVariante) {
      alert("Error al crear variantes");
      return;
    }

    router.refresh();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Cargar Producto</h2>
      <form onSubmit={manejarEnvio} className="space-y-4 max-w-xl">
        <div>
          <label className="block mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Categoría</label>
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Cargar Opciones</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              value={atributoClave}
              onChange={(e) => setAtributoClave(e.target.value)}
              placeholder="Clave (Ej: Tela)"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={atributoValor}
              onChange={(e) => setAtributoValor(e.target.value)}
              placeholder="Valor (Ej: Blackout)"
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="button"
            onClick={agregarOpcion}
            className="bg-black text-white px-3 py-1 rounded text-sm"
          >
            Agregar Opción
          </button>
          <div className="mt-2">
            {opciones.map((opcion, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-1"
              >
                {opcion.clave}: {opcion.valor}
              </span>
            ))}
          </div>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Precios Base</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Precio Público</label>
              <input
                type="number"
                step="0.01"
                value={precioPublico}
                onChange={(e) => setPrecioPublico(Number(e.target.value))}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Precio Mayorista</label>
              <input
                type="number"
                step="0.01"
                value={precioMayorista}
                onChange={(e) => setPrecioMayorista(Number(e.target.value))}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <button
            type="button"
            onClick={generarVariantes}
            className="mt-2 bg-yellow-400 text-black font-bold px-4 py-2 rounded text-sm"
          >
            Generar Combinaciones
          </button>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Variantes Generadas</h3>
          <div className="mt-2">
            {variantes.map((variante, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-1 mb-1"
              >
                {JSON.stringify(variante.atributos)} - $
                {variante.precio_publico}
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-yellow-400 text-black font-bold p-2 rounded w-full"
        >
          Guardar Producto
        </button>
      </form>
    </div>
  );
}
