"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function MisCotizacionesPage() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerCotizaciones() {
      try {
        setCargando(true);

        // 1. Intentamos consultar la tabla principal de cotizaciones
        let { data, error } = await supabase
          .from("cotizaciones")
          .select("*")
          .order("created_at", { ascending: false });

        // Fallback en caso de que la tabla se llame 'ordenes'
        if (error || !data) {
          const resOrdenes = await supabase
            .from("ordenes")
            .select("*")
            .order("created_at", { ascending: false });
          data = resOrdenes.data;
        }

        if (!data || data.length === 0) {
          setOrdenes([]);
          return;
        }

        // 2. Traemos los items para cada cotización/orden encontrada
        const ordenesConItems = await Promise.all(
          data.map(async (orden: any) => {
            // Buscamos items asociados
            const { data: itemsData } = await supabase
              .from("items_cotizacion")
              .select("*")
              .eq("cotizacion_id", orden.id);

            // Si no encontró en items_cotizacion, probamos en orden_items o items
            let itemsFinales = itemsData;

            if (!itemsFinales || itemsFinales.length === 0) {
              const fallbackItems = await supabase
                .from("items")
                .select("*")
                .eq("orden_id", orden.id);
              itemsFinales = fallbackItems.data;
            }

            return {
              ...orden,
              items: itemsFinales || [],
            };
          }),
        );

        setOrdenes(ordenesConItems);
      } catch (err) {
        console.error("Error cargando cotizaciones:", err);
      } finally {
        setCargando(false);
      }
    }

    obtenerCotizaciones();
  }, []);

  if (cargando) {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "4rem auto",
          padding: "0 1rem",
          color: "#86868B",
          textAlign: "center",
        }}
      >
        Cargando cotizaciones...
      </div>
    );
  }

  return (
    <div
      style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 1rem" }}
    >
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          marginBottom: "2rem",
          color: "#1D1D1F",
        }}
      >
        Mis Cotizaciones
      </h1>

      {ordenes.length === 0 ? (
        <p style={{ color: "#86868B" }}>
          No tenés cotizaciones registradas aún.
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {ordenes.map((orden) => (
            <div
              key={orden.id}
              style={{
                border: "1px solid #E8E8ED",
                borderRadius: "12px",
                padding: "1.5rem",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <span style={{ fontWeight: "600", fontSize: "15px" }}>
                  {new Date(orden.created_at).toLocaleDateString("es-AR")}
                </span>
                <span
                  style={{
                    backgroundColor: "#DCFCE7",
                    color: "#166534",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "4px",
                    textTransform: "capitalize",
                  }}
                >
                  {orden.estado || "Aprobada"}
                </span>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                  marginBottom: "1.25rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #E8E8ED",
                      textAlign: "left",
                      color: "#86868B",
                    }}
                  >
                    <th style={{ paddingBottom: "0.5rem", fontWeight: "500" }}>
                      Variante
                    </th>
                    <th
                      style={{
                        paddingBottom: "0.5rem",
                        fontWeight: "500",
                        textAlign: "right",
                      }}
                    >
                      Precio
                    </th>
                    <th
                      style={{
                        paddingBottom: "0.5rem",
                        fontWeight: "500",
                        textAlign: "center",
                      }}
                    >
                      Cantidad
                    </th>
                    <th
                      style={{
                        paddingBottom: "0.5rem",
                        fontWeight: "500",
                        textAlign: "right",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orden.items && orden.items.length > 0 ? (
                    orden.items.map((item: any, idx: number) => {
                      const precio = item.precio_unitario || item.precio || 0;
                      const subtotal = precio * (item.cantidad || 1);
                      const titulo =
                        item.variante_id ||
                        item.descripcion ||
                        item.nombre ||
                        `Item #${idx + 1}`;

                      return (
                        <tr
                          key={item.id || idx}
                          style={{ borderBottom: "1px solid #F8F8FA" }}
                        >
                          <td
                            style={{ padding: "0.75rem 0", color: "#1D1D1F" }}
                          >
                            {titulo}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem 0",
                              textAlign: "right",
                              color: "#1D1D1F",
                            }}
                          >
                            ${precio}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem 0",
                              textAlign: "center",
                              color: "#1D1D1F",
                            }}
                          >
                            {item.cantidad}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem 0",
                              textAlign: "right",
                              fontWeight: "500",
                              color: "#1D1D1F",
                            }}
                          >
                            ${subtotal}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "center",
                          padding: "1rem 0",
                          color: "#86868B",
                        }}
                      >
                        Sin detalle de productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div
                style={{
                  textAlign: "right",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid #E8E8ED",
                  color: "#1D1D1F",
                }}
              >
                Total: ${orden.total}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
