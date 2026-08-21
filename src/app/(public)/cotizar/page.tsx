"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";

export default function CotizarPage() {
  const { items, borrarTodo, total } = useCarrito();
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const manejarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    // El precio y el total NO se mandan acá: la API los recalcula del
    // lado del servidor a partir de varianteId + cantidad, así nadie
    // puede modificar el total interceptando la petición.
    const respuesta = await fetch("/api/ordenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          varianteId: item.varianteId,
          cantidad: item.cantidad,
        })),
        notas,
        status: "cotizacion",
      }),
    });

    setEnviando(false);

    if (respuesta.status === 401) {
      alert("Debés iniciar sesión para cotizar");
      router.push("/login");
      return;
    }

    if (!respuesta.ok) {
      alert("Error al enviar la cotización");
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
            Total estimado: ${total}
          </div>
          <p className="text-right text-xs text-gray-500 mt-1">
            El total final se calcula y confirma en el servidor al enviar.
          </p>
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
          disabled={enviando}
          className="bg-yellow-400 text-black font-bold p-2 rounded w-full disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar Cotización"}
        </button>
      </form>
    </div>
  );
}
