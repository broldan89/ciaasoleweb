"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [productos, setProductos] = useState(0);
  const [ordenes, setOrdenes] = useState(0);
  const [cotizaciones, setCotizaciones] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: dataProductos } = await supabase
        .from("productos")
        .select("id");
      setProductos(dataProductos?.length || 0);

      const { data: dataOrdenes } = await supabase.from("ordenes").select("id");
      setOrdenes(dataOrdenes?.length || 0);

      const { data: dataCotizaciones } = await supabase
        .from("ordenes")
        .select("id")
        .eq("status", "cotizacion");
      setCotizaciones(dataCotizaciones?.length || 0);

      const { data: dataTotal } = await supabase
        .from("ordenes")
        .select("total");
      setTotalVentas(
        dataTotal?.reduce((acc, item) => acc + (item.total || 0), 0) || 0,
      );
    };

    cargarDatos();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="border rounded-lg p-6">
          <span className="text-sm text-gray-500">Productos</span>
          <div className="text-3xl font-bold mt-2">{productos}</div>
        </div>
        <div className="border rounded-lg p-6">
          <span className="text-sm text-gray-500">Órdenes</span>
          <div className="text-3xl font-bold mt-2">{ordenes}</div>
        </div>
        <div className="border rounded-lg p-6">
          <span className="text-sm text-gray-500">Cotizaciones</span>
          <div className="text-3xl font-bold mt-2">{cotizaciones}</div>
        </div>
        <div className="border rounded-lg p-6">
          <span className="text-sm text-gray-500">Total Ventas</span>
          <div className="text-3xl font-bold mt-2">${totalVentas}</div>
        </div>
      </div>
    </div>
  );
}
