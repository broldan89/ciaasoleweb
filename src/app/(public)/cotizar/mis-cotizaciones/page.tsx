"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  items_orden?: ItemOrden[];
}

export default function MisCotizacionesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("ordenes")
        .select("*, items_orden(*)")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      setOrdenes(data || []);
    };

    cargar();
  }, [router]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mis Cotizaciones</h1>
      <div className="space-y-6">
        {ordenes.map((orden) => (
          <div key={orden.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">
                {new Date(orden.created_at).toLocaleDateString("es-AR")}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  orden.status === "cotizacion"
                    ? "bg-blue-100 text-blue-800"
                    : orden.status === "aprobada"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {orden.status === "cotizacion"
                  ? "En revisión"
                  : orden.status === "aprobada"
                    ? "Aprobada"
                    : "Facturada"}
              </span>
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
          </div>
        ))}
        {ordenes.length === 0 && (
          <div className="text-gray-500">No hay cotizaciones.</div>
        )}
      </div>
    </div>
  );
}
