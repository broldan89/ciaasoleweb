"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

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
  items: ItemOrden[];
}

function estadoLabel(status: string) {
  switch (status) {
    case "cotizacion":
      return "En revisión";
    case "borrador":
      return "Borrador";
    case "aprobada":
      return "Aprobada";
    case "facturada":
      return "Facturada";
    default:
      return status || "Sin estado";
  }
}

export default function MisCotizacionesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerCotizaciones() {
      try {
        setCargando(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setOrdenes([]);
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const ordenesConItems = await Promise.all(
          (data ?? []).map(async (orden) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from("items_orden")
              .select("*")
              .eq("orden_id", orden.id);

            if (itemsError) throw itemsError;

            return {
              ...orden,
              items: itemsData ?? [],
            } as Orden;
          }),
        );

        setOrdenes(ordenesConItems);
      } catch (err) {
        console.error("Error cargando cotizaciones:", err);
        setOrdenes([]);
      } finally {
        setCargando(false);
      }
    }

    obtenerCotizaciones();
  }, []);

  if (cargando) {
    return (
      <div className="cs-section py-24 text-center">
        <p className="cs-eyebrow">Cuenta</p>
        <p className="cs-display mt-3 text-3xl">Cargando tus proyectos...</p>
      </div>
    );
  }

  return (
    <div className="cs-section py-14 sm:py-20 lg:py-24">
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--cs-line)] pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="cs-eyebrow">Cuenta / Historial</p>
          <h1 className="cs-display mt-3 text-5xl sm:text-6xl">Mis cotizaciones.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--cs-muted)]">
            Consultá el estado y detalle de cada solicitud enviada a Ciao Sole.
          </p>
        </div>
        <Link href="/" className="cs-button cs-button-secondary">
          Nueva selección
        </Link>
      </div>

      {ordenes.length === 0 ? (
        <div className="cs-card mt-10 p-10 text-center sm:p-16">
          <p className="cs-display text-3xl">Todavía no hay cotizaciones.</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--cs-muted)]">
            Explorá el catálogo, elegí una configuración y comenzá un nuevo proyecto.
          </p>
          <Link href="/" className="cs-button mt-7">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {ordenes.map((orden, index) => (
            <article key={orden.id} className="cs-card overflow-hidden">
              <div className="flex flex-col gap-5 border-b border-[var(--cs-line)] bg-[var(--cs-ivory)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <p className="cs-eyebrow">Proyecto 0{index + 1}</p>
                  <p className="mt-2 text-sm font-semibold">
                    {new Date(orden.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="inline-flex w-fit border border-[var(--cs-gold)] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-gold-dark)]">
                  {estadoLabel(orden.status)}
                </span>
              </div>

              <div className="overflow-x-auto px-6 py-6 sm:px-8">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--cs-line)] text-left text-[10px] uppercase tracking-[.12em] text-[var(--cs-muted)]">
                      <th className="pb-3 font-semibold">Variante</th>
                      <th className="pb-3 text-right font-semibold">Precio</th>
                      <th className="pb-3 text-center font-semibold">Cantidad</th>
                      <th className="pb-3 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.items.length ? (
                      orden.items.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--cs-line)] last:border-b-0">
                          <td className="py-4 font-medium">{item.variante_id}</td>
                          <td className="py-4 text-right">${Number(item.precio_unitario).toLocaleString("es-AR")}</td>
                          <td className="py-4 text-center text-[var(--cs-muted)]">{item.cantidad}</td>
                          <td className="py-4 text-right font-semibold">${Number(item.total).toLocaleString("es-AR")}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[var(--cs-muted)]">Sin detalle de productos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end border-t border-[var(--cs-line)] px-6 py-5 sm:px-8">
                <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-[.12em] text-[var(--cs-muted)]">Total</span>
                  <strong className="cs-display text-3xl">${Number(orden.total ?? 0).toLocaleString("es-AR")}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
