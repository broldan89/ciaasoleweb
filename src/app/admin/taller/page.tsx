"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface ItemTaller {
  id: string;
  orden_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  variante_id: string;
  variante?: {
    atributos: Record<string, unknown> | null;
    productos?: { nombre: string; categoria: string | null } | null;
  } | null;
}

interface OrdenTaller {
  id: string;
  user_id: string;
  status: string;
  total: number;
  notas: string | null;
  created_at: string;
  items: ItemTaller[];
  profile?: { email: string | null } | null;
}

const ETAPAS = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_proceso", label: "Preparación" },
  { key: "produccion", label: "Producción" },
  { key: "lista", label: "Control / lista" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getVariantLabel(item: ItemTaller) {
  const product = item.variante?.productos?.nombre ?? "Producto";
  const attributes = item.variante?.atributos;

  if (!attributes || typeof attributes !== "object") return product;

  const detail = Object.entries(attributes)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");

  return detail ? `${product} — ${detail}` : product;
}

export default function TallerProduccionPage() {
  const [ordenes, setOrdenes] = useState<OrdenTaller[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarTaller = async () => {
    setCargando(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("orders")
      .select(
        `
          id,
          user_id,
          status,
          total,
          notas,
          created_at,
          profiles(email),
          items_orden(
            id,
            orden_id,
            cantidad,
            precio_unitario,
            total,
            variante_id,
            variantes_producto(
              atributos,
              productos(nombre, categoria)
            )
          )
        `,
      )
      .in("status", ["pendiente", "en_proceso", "produccion", "lista"])
      .order("created_at", { ascending: true });

    if (queryError) {
      console.error("Error cargando taller:", queryError);
      setError("No se pudo cargar la cola de producción.");
      setOrdenes([]);
      setCargando(false);
      return;
    }

    setOrdenes(
      ((data ?? []) as unknown as Array<OrdenTaller & { items_orden?: ItemTaller[] }>).map(
        (orden) => ({
          ...orden,
          items: orden.items_orden ?? [],
        }),
      ),
    );
    setCargando(false);
  };

  useEffect(() => {
    cargarTaller();
  }, []);

  const ordenesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return ordenes.filter((orden) => {
      const coincideEtapa = filtro === "todas" || orden.status === filtro;
      const email = orden.profile?.email?.toLowerCase() ?? "";
      const items = orden.items
        .map(getVariantLabel)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda =
        !termino ||
        orden.id.toLowerCase().includes(termino) ||
        email.includes(termino) ||
        items.includes(termino) ||
        (orden.notas ?? "").toLowerCase().includes(termino);

      return coincideEtapa && coincideBusqueda;
    });
  }, [ordenes, filtro, busqueda]);

  const avanzarOrden = async (orden: OrdenTaller) => {
    const currentIndex = ETAPAS.findIndex((etapa) => etapa.key === orden.status);
    const siguiente = ETAPAS[currentIndex + 1];

    if (!siguiente) return;

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: siguiente.key })
      .eq("id", orden.id);

    if (updateError) {
      console.error("Error avanzando orden de taller:", updateError);
      setError("No se pudo actualizar la etapa de producción.");
      return;
    }

    setOrdenes((actuales) =>
      actuales.map((item) =>
        item.id === orden.id ? { ...item, status: siguiente.key } : item,
      ),
    );
  };

  return (
    <div className="cs-fade-up space-y-8">
      <header className="flex flex-col gap-6 border-b cs-rule pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="cs-eyebrow">Operación · taller</span>
          <h1 className="cs-display mt-2 text-4xl md:text-5xl">Cola de producción.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cs-muted)]">
            Una vista operativa de las órdenes que ya requieren preparación, fabricación y control.
          </p>
        </div>
        <button className="cs-button" onClick={cargarTaller} type="button">
          Actualizar cola
        </button>
      </header>

      <section className="grid grid-cols-2 gap-px border cs-rule bg-[var(--cs-line)] md:grid-cols-4">
        {[
          ["En cola", ordenes.length],
          ["Preparación", ordenes.filter((o) => o.status === "en_proceso").length],
          ["Producción", ordenes.filter((o) => o.status === "produccion").length],
          ["Listas", ordenes.filter((o) => o.status === "lista").length],
        ].map(([label, value]) => (
          <div key={label} className="bg-[var(--cs-white)] px-5 py-6">
            <div className="cs-eyebrow">{label}</div>
            <div className="mt-2 text-3xl font-light tracking-tight">{value}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 border-b cs-rule pb-5 lg:flex-row lg:items-center lg:justify-between">
        <input
          className="cs-input max-w-xl"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por cliente, ID, producto o nota..."
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ key: "todas", label: "Todas" }, ...ETAPAS].map((etapa) => (
            <button
              key={etapa.key}
              type="button"
              onClick={() => setFiltro(etapa.key)}
              className={`whitespace-nowrap border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                filtro === etapa.key
                  ? "border-[var(--cs-ink)] bg-[var(--cs-ink)] text-white"
                  : "border-[var(--cs-line)] bg-white text-[var(--cs-muted)] hover:border-[var(--cs-ink)]"
              }`}
            >
              {etapa.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="border border-[#e2c8c4] bg-[#fbf2f1] px-4 py-3 text-sm text-[var(--cs-danger)]">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="cs-card px-6 py-14 text-center text-sm text-[var(--cs-muted)]">Cargando producción...</div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="cs-card px-6 py-14 text-center">
          <div className="cs-eyebrow">Cola vacía</div>
          <p className="mt-3 text-sm text-[var(--cs-muted)]">No hay órdenes que coincidan con los filtros actuales.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {ordenesFiltradas.map((orden) => {
            const etapaIndex = ETAPAS.findIndex((etapa) => etapa.key === orden.status);
            const siguiente = ETAPAS[etapaIndex + 1];

            return (
              <article key={orden.id} className="cs-card overflow-hidden">
                <div className="border-b cs-rule px-5 py-5 md:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <span className="cs-eyebrow">Orden · {orden.id.slice(0, 8).toUpperCase()}</span>
                      <h2 className="mt-1 text-base font-medium">{orden.profile?.email || "Cliente sin email visible"}</h2>
                      <p className="mt-1 text-xs text-[var(--cs-muted)]">Ingresó {formatDate(orden.created_at)}</p>
                    </div>
                    <span className="inline-flex w-fit border border-[#d8c7aa] bg-[#f8f1e5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--cs-gold-dark)]">
                      {ETAPAS[etapaIndex]?.label ?? orden.status}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-1">
                    {ETAPAS.map((etapa, index) => (
                      <div key={etapa.key}>
                        <div className={`h-1 ${index <= etapaIndex ? "bg-[var(--cs-gold)]" : "bg-[var(--cs-sand)]"}`} />
                        <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--cs-muted)]">{etapa.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 px-5 py-5 md:px-6 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="cs-eyebrow">Despiece / productos</div>
                    <div className="mt-3 space-y-3">
                      {orden.items.length === 0 ? (
                        <p className="text-sm text-[var(--cs-muted)]">La orden no tiene ítems cargados.</p>
                      ) : (
                        orden.items.map((item) => (
                          <div key={item.id} className="flex flex-col gap-1 border-b cs-rule pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium">{getVariantLabel(item)}</p>
                              <p className="text-xs text-[var(--cs-muted)]">Variante · {item.variante_id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--cs-muted)]">x {item.cantidad}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {orden.notas && (
                      <div className="mt-5 border-t cs-rule pt-4">
                        <div className="cs-eyebrow">Observaciones</div>
                        <p className="mt-2 text-sm leading-6 text-[var(--cs-muted)]">{orden.notas}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-52 flex-col justify-between gap-5 border-t cs-rule pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div>
                      <div className="cs-eyebrow">Siguiente acción</div>
                      <p className="mt-2 text-sm leading-6">
                        {siguiente ? `Pasar la orden a ${siguiente.label.toLowerCase()}.` : "Orden lista para despacho o instalación."}
                      </p>
                    </div>

                    {siguiente ? (
                      <button type="button" className="cs-button w-full" onClick={() => avanzarOrden(orden)}>
                        Avanzar a {siguiente.label}
                      </button>
                    ) : (
                      <div className="border border-[#c9d8cd] bg-[#f0f5f1] px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--cs-success)]">
                        Lista para despacho
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
