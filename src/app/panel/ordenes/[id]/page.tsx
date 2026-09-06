import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase-server";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  cotizacion: "Cotización enviada",
  aprobada: "Aprobada",
  facturada: "Facturada",
};

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, status, total, notas, created_at, codigo_postal, shipping_cost",
    )
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

  return (
    <div className="mx-auto max-w-[980px]">
      <Link
        href="/panel"
        className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-muted)] hover:text-[var(--cs-ink)]"
      >
        ← Volver a mi cuenta
      </Link>

      <header className="mt-7 border-b border-[var(--cs-line)] pb-7">
        <p className="cs-eyebrow">
          Proyecto #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="cs-display text-4xl sm:text-5xl">Seguimiento.</h1>
            <p className="mt-3 text-sm text-[var(--cs-muted)]">
              Creado el {new Date(order.created_at).toLocaleDateString("es-AR")}
            </p>
          </div>
          <span className="w-fit border border-[var(--cs-line)] bg-[var(--cs-paper)] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]">
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
        <div className="border border-[var(--cs-line)] bg-[var(--cs-paper)]">
          <div className="border-b border-[var(--cs-line)] px-6 py-5">
            <p className="cs-eyebrow">Productos</p>
          </div>

          <div className="divide-y divide-[var(--cs-line)]">
            {(items ?? []).map((item) => (
              <div key={item.id} className="px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-gold-dark)]">
                      Variante {item.variante_id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      Cantidad: {item.cantidad}
                    </p>
                    <p className="mt-2 text-sm text-[var(--cs-muted)]">
                      {item.ancho_cliente_cm ?? "—"} cm × {item.alto_cliente_cm ?? "—"} cm
                    </p>
                    <p className="mt-1 text-xs text-[var(--cs-muted)]">
                      Consumo: {item.metros_lineales ?? "—"} m · Orientación: {item.orientacion ?? "—"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-[var(--cs-muted)]">
                      {currency.format(Number(item.precio_unitario ?? 0))} / unidad
                    </p>
                    <p className="mt-1 font-serif text-xl">
                      {currency.format(Number(item.total ?? 0))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit border border-[var(--cs-line)] bg-[var(--cs-paper)]">
          <div className="border-b border-[var(--cs-line)] px-6 py-5">
            <p className="cs-eyebrow">Resumen</p>
          </div>
          <div className="space-y-4 px-6 py-6 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--cs-muted)]">Envío</span>
              <span>{currency.format(Number(order.shipping_cost ?? 0))}</span>
            </div>
            <div className="border-t border-[var(--cs-line)] pt-4">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--cs-muted)]">Total</span>
                <span className="font-serif text-2xl">
                  {currency.format(Number(order.total ?? 0))}
                </span>
              </div>
            </div>
            {order.codigo_postal != null && (
              <p className="text-xs text-[var(--cs-muted)]">
                Código postal de entrega: {order.codigo_postal}
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="mt-6 border border-dashed border-[var(--cs-line)] bg-[var(--cs-paper)] px-6 py-6">
        <p className="cs-eyebrow">Entrega y seguimiento</p>
        <p className="mt-3 text-sm leading-6 text-[var(--cs-muted)]">
          El número de tracking y los datos de despacho todavía no forman parte del modelo de datos actual. No se muestran datos inventados; esta sección queda preparada para incorporarlos cuando se defina ese circuito.
        </p>
      </section>

      {order.notas && (
        <section className="mt-6 border border-[var(--cs-line)] bg-[var(--cs-paper)] px-6 py-6">
          <p className="cs-eyebrow">Observaciones</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--cs-muted)]">
            {order.notas}
          </p>
        </section>
      )}
    </div>
  );
}
