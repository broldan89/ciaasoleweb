"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Producto {
  id: string;
  nombre: string;
}

interface Variante {
  id: string;
  producto_id: string;
  atributos: Record<string, string>;
  precio_publico: number;
  precio_mayorista: number;
}

interface ItemOrden {
  id: string;
  variante_id: string;
  precio_unitario: number;
  cantidad: number;
  total: number;
}

interface Orden {
  id: string;
  status: string;
  total: number;
  created_at: string;
  profiles?: { email: string } | null;
  items_orden?: ItemOrden[];
}

interface ItemFormulario {
  varianteId: string;
  nombre: string;
  cantidad: number;
  // Precio mostrado en la tabla del formulario: es solo referencia visual
  // (viene de variantes_producto, que el admin sí puede leer). El precio
  // que efectivamente se guarda lo recalcula /api/ordenes en el servidor.
  precioReferencia: number;
}

export default function AdminOrdenesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [varianteSeleccionada, setVarianteSeleccionada] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState<ItemFormulario[]>([]);
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargarOrdenes = useCallback(async () => {
    const { data } = await supabase
      .from("ordenes")
      .select("*, items_orden(*), profiles(*)")
      .order("created_at", { ascending: false });
    setOrdenes(data ?? []);
  }, []);

  const cargarProductos = useCallback(async () => {
    const { data } = await supabase
      .from("productos")
      .select("*")
      .eq("is_active", true);
    setProductos(data ?? []);
  }, []);

  useEffect(() => {
    const cargarInicial = async () => {
      await Promise.all([cargarOrdenes(), cargarProductos()]);
    };
    cargarInicial();
  }, [cargarOrdenes, cargarProductos]);

  const cargarVariantes = async (productoId: string) => {
    // Esta consulta a variantes_producto (con ambos precios) solo funciona
    // porque este panel está protegido para admin — la RLS
    // "variantes_select_solo_admin" la bloquea para cualquier otro rol.
    const { data } = await supabase
      .from("variantes_producto")
      .select("*")
      .eq("producto_id", productoId)
      .eq("is_active", true);
    setVariantes(data ?? []);
    setVarianteSeleccionada("");
  };

  const totalReferencia = items.reduce(
    (acc, item) => acc + item.precioReferencia * item.cantidad,
    0,
  );

  const agregarItem = () => {
    const variante = variantes.find((v) => v.id === varianteSeleccionada);
    if (!variante) return;

    const nuevoItem: ItemFormulario = {
      varianteId: variante.id,
      nombre: `${
        productos.find((p) => p.id === variante.producto_id)?.nombre ?? ""
      } - ${JSON.stringify(variante.atributos)}`,
      cantidad,
      precioReferencia: variante.precio_publico,
    };

    setItems([...items, nuevoItem]);
    setCantidad(1);
    setVarianteSeleccionada("");
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const respuesta = await fetch("/api/ordenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          varianteId: item.varianteId,
          cantidad: item.cantidad,
        })),
        notas,
        status: "borrador",
      }),
    });

    setEnviando(false);

    if (!respuesta.ok) {
      alert("Error al crear la orden");
      return;
    }

    alert("Orden de trabajo generada correctamente");
    setItems([]);
    setNotas("");
    cargarOrdenes();
    router.refresh();
  };

  const manejarEstado = async (ordenId: string, estado: string) => {
    const respuesta = await fetch(`/api/ordenes/${ordenId}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    if (!respuesta.ok) {
      alert("Error al cambiar estado");
      return;
    }

    alert("Estado actualizado");
    cargarOrdenes();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">
        Listado de Cotizaciones y Órdenes
      </h2>

      <div className="mb-8">
        {ordenes.map((orden) => (
          <div key={orden.id} className="border rounded p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold">{orden.profiles?.email}</span>
                <span className="ml-4 text-sm text-gray-500">
                  {new Date(orden.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    orden.status === "cotizacion"
                      ? "bg-blue-100 text-blue-800"
                      : orden.status === "aprobada"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {orden.status}
                </span>
                <button
                  onClick={() => manejarEstado(orden.id, "aprobada")}
                  className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => manejarEstado(orden.id, "facturada")}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  Facturar
                </button>
              </div>
            </div>

            <div className="mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orden.items_orden?.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.variante_id}</td>
                      <td>${item.precio_unitario}</td>
                      <td>{item.cantidad}</td>
                      <td>${item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right font-bold text-xl">
                Total: ${orden.total}
              </div>
            </div>
          </div>
        ))}
        {ordenes.length === 0 && (
          <div className="text-gray-500">No hay órdenes.</div>
        )}
      </div>

      <div className="border-t pt-8">
        <h3 className="text-2xl font-bold mb-4">Generar Orden Manual</h3>
        <form onSubmit={manejarEnvio} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Producto</label>
              <input
                list="listaProductos"
                value={productoSeleccionado}
                onChange={(e) => {
                  setProductoSeleccionado(e.target.value);
                  cargarVariantes(e.target.value);
                }}
                className="w-full p-2 border rounded"
                placeholder="Buscar producto..."
              />
              <datalist id="listaProductos">
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block mb-1">Variante</label>
              <select
                value={varianteSeleccionada}
                onChange={(e) => setVarianteSeleccionada(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Seleccionar variante</option>
                {variantes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {JSON.stringify(v.atributos)} - ${v.precio_publico}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div>
              <label className="block mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-20 p-2 border rounded"
                min="1"
              />
            </div>
            <button
              type="button"
              onClick={agregarItem}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Agregar
            </button>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-bold mb-2">Detalle de la orden</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Producto</th>
                  <th>Precio ref.</th>
                  <th>Cantidad</th>
                  <th>Total ref.</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.nombre}</td>
                    <td>${item.precioReferencia}</td>
                    <td>{item.cantidad}</td>
                    <td>${item.precioReferencia * item.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right font-bold text-xl">
              Total referencial: ${totalReferencia}
            </div>
            <p className="text-right text-xs text-gray-500 mt-1">
              El total definitivo se recalcula en el servidor al generar la orden.
            </p>
          </div>

          <div>
            <label className="block mb-1">Notas para la orden</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Detalles de instalación, medidas, observaciones..."
            />
          </div>

          <button
            type="submit"
            disabled={enviando || items.length === 0}
            className="bg-yellow-400 text-black font-bold p-2 rounded w-full disabled:opacity-50"
          >
            {enviando ? "Generando..." : "Generar Orden"}
          </button>
        </form>
      </div>
    </div>
  );
}
