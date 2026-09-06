import Link from "next/link";

import { createClient } from "@/lib/supabase-server";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  cotizacion: "Cotización enviada",
};

export default async function CotizacionesPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total, notas, created_at")
    .in("status", ["borrador", "cotizacion"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando cotizaciones:", error);
  }

  const rows = orders ?? [];

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="border-b border-[var(--cs-line)] pb-7">
        <p className="cs-eyebrow">Mi cuenta / Cotizaciones</p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="cs-display text-4xl sm:text-5xl">Cotizaciones.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cs-muted)]">
              Historial de solicitudes enviadas. El armado de una nueva cotización se hace únicamente desde Cotizar.
            </p>
          </div>
          <Link href="/cotizar" className="cs-button w-fit">
            Nueva cotización
          </Link>
        </div>
      </header>

      <section className="mt-8">
        {rows.length === 0 ? (
          <div className="border border-dashed border-[var(--cs-line)] bg-[var(--cs-paper)] px-6 py-14 text-center">
            <p className="font-serif text-xl">No hay cotizaciones todavía.</p>
            <p className="mt-2 text-sm text-[var(--cs-muted)]">
              Cuando se envíe una solicitud desde el cotizador, aparecerá acá.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--cs-line)] border border-[var(--cs-line)] bg-[var(--cs-paper)]">
            {rows.map((order) => (
              <Link
                key={order.id}
                href={`/panel/ordenes/${order.id}`}
                className="block px-5 py-5 transition-colors hover:bg-[var(--cs-ivory)] sm:px-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--cs-gold-dark)]">
                      Cotización #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-2 text-sm text-[var(--cs-muted)]">
                      {new Date(order.created_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]">
                      {statusLabels[order.status] ?? order.status}
                    </span>
                    <span className="font-serif text-xl">
                      {currency.format(Number(order.total ?? 0))}
                    </span>
                  </div>
                </div>

                {order.notas && (
                  <p className="mt-4 border-t border-[var(--cs-line)] pt-4 text-sm leading-6 text-[var(--cs-muted)]">
                    {order.notas}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
