import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase-server";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const statusConfig: Record<string, { label: string; tone: string; description: string }> = {
  borrador: {
    label: "Borrador",
    tone: "border-[var(--cs-line)] bg-[var(--cs-sand)] text-[var(--cs-charcoal)]",
    description: "Este proyecto todavía está en preparación.",
  },
  cotizacion: {
    label: "Cotización enviada",
    tone: "border-[var(--cs-gold)]/40 bg-[var(--cs-gold)]/10 text-[var(--cs-gold-dark)]",
    description: "La cotización fue enviada y está pendiente de definición.",
  },
  aprobada: {
    label: "Aprobada",
    tone: "border-[var(--cs-success)]/30 bg-[var(--cs-success)]/10 text-[var(--cs-success)]",
    description: "El proyecto fue aprobado.",
  },
  facturada: {
    label: "Facturada",
    tone: "border-[var(--cs-success)]/30 bg-[var(--cs-success)]/10 text-[var(--cs-success)]",
    description: "El proyecto ya cuenta con facturación.",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total, notas, created_at, codigo_postal, shipping_cost")
    .eq("id", id)
    .maybeSingle();

  if (orderError) {
    console.error("Error cargando detalle de orden:", orderError);
  }

  if (!order) {
    notFound();
  }

  const { data: items, error: itemsError } = await supabase
    .from("items_orden")
    .select(
      "id, variante_id, cantidad, precio_unitario, total, ancho_cliente_cm, alto_cliente_cm, metros_lineales, orientacion",
    )
    .eq("orden_id", order.id);

  if (itemsError) {
    console.error("Error cargando items de orden:", itemsError);
  }

  const status = statusConfig[order.status] ?? {
    label: order.status,
    tone: "border-[var(--cs-line)] bg-[var(--cs-sand)] text-[var(--cs-charcoal)]",
    description: "Consultá el estado actual de este proyecto.",
  };

  return (
    <div className="mx-auto max-w-[1120px]">
      <Link
        href="/panel"
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--cs-muted)] transition-colors hover:text-[var(--cs-ink)]"
      >
        <span aria-hidden="true">←</span>
        Volver a mi cuenta
      </Link>

      <header className="mt-8 border-b border-[var(--cs-line)] pb-8 sm:mt-10 sm:pb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="cs-eyebrow">Mi cuenta · Detalle del proyecto</p>
            <h1 className="cs-display mt-3 text-4xl leading-[1.05] sm:text-5xl">
              Proyecto <span className="text-[var(--cs-gold-dark)]">#{order.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <p className="mt-4 text-sm text-[var(--cs-muted)]">
              Creado el {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <span
              className={`inline-flex items-center border px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] ${status.tone}`}
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {status.label}
            </span>
            <p className="max-w-xs text-xs leading-5 text-[var(--cs-muted)] lg:text-right">
              {status.description}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-3" aria-label="Resumen del proyecto">
        <div className="border border-[var(--cs-line)] bg-[var(--cs-white)] p-5 sm:p-6">
          <p className="cs-eyebrow">Estado actual</p>
          <p className="mt-3 font-serif text-2xl">{status.label}</p>
          <p className="mt-1 text-xs text-[var(--cs-muted)]">Situación del proyecto</p>
        </div>
        <div className="border border-[var(--cs-line)] bg-[var(--cs-white)] p-5 sm:p-6">
          <p className="cs-eyebrow">Artículos</p>
          <p className="mt-3 font-serif text-3xl">{(items ?? []).length}</p>
          <p className="mt-1 text-xs text-[var(--cs-muted)]">Ítems incluidos en el proyecto</p>
        </div>
        <div className="border border-[var(--cs-ink)] bg-[var(--cs-ink)] p-5 text-[var(--cs-white)] sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--cs-sand)]">
            Total del proyecto
          </p>
          <p className="mt-3 font-serif text-3xl sm:text-4xl">
            {currency.format(Number(order.total ?? 0))}
          </p>
          <p className="mt-1 text-xs text-white/60">Importe registrado</p>
        </div>
      </section>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)] lg:gap-8">
        <section className="border border-[var(--cs-line)] bg-[var(--cs-white)]">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--cs-line)] px-5 py-5 sm:px-7">
            <div>
              <p className="cs-eyebrow">Composición</p>
              <h2 className="cs-display mt-2 text-2xl">Tus productos</h2>
            </div>
            <span className="text-xs text-[var(--cs-muted)]">
              {(items ?? []).length} {(items ?? []).length === 1 ? "ítem" : "ítems"}
            </span>
          </div>

          {(items ?? []).length > 0 ? (
            <div className="divide-y divide-[var(--cs-line)]">
              {(items ?? []).map((item, index) => (
                <article key={item.id} className="px-5 py-6 sm:px-7">
                  <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--cs-gold-dark)]">
                        Producto {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 break-all text-xs text-[var(--cs-muted)]">
                        Variante {item.variante_id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-3 text-sm font-semibold">
                        {item.cantidad} {item.cantidad === 1 ? "unidad" : "unidades"}
                      </p>
                    </div>

                    <div className="sm:min-w-[150px] sm:text-right">
                      <p className="text-xs text-[var(--cs-muted)]">Importe del ítem</p>
                      <p className="mt-1 font-serif text-2xl">
                        {currency.format(Number(item.total ?? 0))}
                      </p>
                      <p className="mt-1 text-xs text-[var(--cs-muted)]">
                        {currency.format(Number(item.precio_unitario ?? 0))} por unidad
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--cs-line)] pt-4 sm:grid-cols-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[var(--cs-muted)]">
                        Medidas
                      </p>
                      <p className="mt-1 text-sm">
                        {item.ancho_cliente_cm ?? "—"} × {item.alto_cliente_cm ?? "—"} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[var(--cs-muted)]">
                        Consumo
                      </p>
                      <p className="mt-1 text-sm">{item.metros_lineales ?? "—"} m</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[var(--cs-muted)]">
                        Orientación
                      </p>
                      <p className="mt-1 text-sm capitalize">{item.orientacion ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[var(--cs-muted)]">
                        Cantidad
                      </p>
                      <p className="mt-1 text-sm">{item.cantidad}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center sm:px-7">
              <p className="cs-display text-xl">Todavía no hay productos</p>
              <p className="mt-2 text-sm text-[var(--cs-muted)]">
                Los artículos de este proyecto aparecerán acá cuando estén disponibles.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="border border-[var(--cs-line)] bg-[var(--cs-paper)]">
            <div className="border-b border-[var(--cs-line)] px-5 py-5 sm:px-6">
              <p className="cs-eyebrow">Importes</p>
              <h2 className="cs-display mt-2 text-2xl">Resumen</h2>
            </div>
            <div className="space-y-4 px-5 py-6 sm:px-6">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[var(--cs-muted)]">Envío</span>
                <span className="font-medium">{currency.format(Number(order.shipping_cost ?? 0))}</span>
              </div>
              {order.codigo_postal != null && (
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[var(--cs-muted)]">Código postal</span>
                  <span className="font-medium">{order.codigo_postal}</span>
                </div>
              )}
              <div className="border-t border-[var(--cs-line)] pt-4">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-[.13em]">Total</span>
                  <span className="font-serif text-2xl">
                    {currency.format(Number(order.total ?? 0))}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="border border-[var(--cs-line)] bg-[var(--cs-white)] px-5 py-6 sm:px-6">
            <p className="cs-eyebrow">Entrega</p>
            <h2 className="cs-display mt-2 text-2xl">Seguimiento</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--cs-muted)]">
              Los datos de despacho y el número de seguimiento todavía no están disponibles para este proyecto.
            </p>
            <div className="mt-4 border-l-2 border-[var(--cs-gold)] bg-[var(--cs-paper)] px-4 py-3 text-xs leading-5 text-[var(--cs-muted)]">
              Cuando se incorpore la información logística, vas a poder consultarla desde acá.
            </div>
          </section>

          {order.notas && (
            <section className="border border-[var(--cs-line)] bg-[var(--cs-white)] px-5 py-6 sm:px-6">
              <p className="cs-eyebrow">Información adicional</p>
              <h2 className="cs-display mt-2 text-2xl">Observaciones</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--cs-muted)]">
                {order.notas}
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
