"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";
import { supabase } from "@/lib/supabase";

export default function CotizarPage() {
  const { items, borrarTodo, total } = useCarrito();
  const [notas, setNotas] = useState("");
  const router = useRouter();

  const manejarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    const usuarioId = userData.user?.id;

    if (!usuarioId) {
      alert("Debes iniciar sesión para cotizar");
      router.push("/login");
      return;
    }

    const { data: orden, error } = await supabase
      .from("ordenes")
      .insert({
        usuario_id: usuarioId,
        status: "cotizacion",
        total,
        notas,
      })
      .select()
      .single();

    if (error) {
      alert("Error al crear la cotización");
      return;
    }

    const itemsParaInsertar = items.map((item) => ({
      orden_id: orden.id,
      variante_id: item.varianteId,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
      total: item.total,
    }));

    const { error: errorItems } = await supabase
      .from("items_orden")
      .insert(itemsParaInsertar);

    if (errorItems) {
      alert("Error al insertar los items");
      return;
    }

    alert("Cotización enviada correctamente");
    borrarTodo();
    setNotas("");
    router.push("/");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Solicitar Cotización</h1>
      <form onSubmit={manejarCotizacion} className="space-y-6">
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Detalle</h2>
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
              {items.map((item) => (
                <tr key={item.varianteId} className="border-b">
                  <td className="py-2">{item.nombre}</td>
                  <td>${item.precioUnitario}</td>
                  <td>{item.cantidad}</td>
                  <td>${item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right font-bold text-xl">
            Total: ${total}
          </div>
        </div>

        <div>
          <label className="block mb-1">Notas para la cotización</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Medidas, telas, observaciones..."
          />
        </div>

        <button
          type="submit"
          className="bg-yellow-400 text-black font-bold p-2 rounded w-full"
        >
          Enviar Cotización
        </button>
      </form>
    </div>
  );
}
