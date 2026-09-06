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
  aprobada: "Aprobada",
  facturada: "Facturada",
};

export default async function PanelPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando órdenes del panel:", error);
  }

  const rows = orders ?? [];
  const cotizaciones = rows.filter(
    (order) => order.status === "cotizacion" || order.status === "borrador",
  );
  const pedidos = rows.filter(
    (order) => order.status === "aprobada" || order.status === "facturada",
  );

  const recientes = rows.slice(0, 5);

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="border-b border-[var(--cs-line)] pb-7">
        <p className="cs-eyebrow">Mi cuenta</p>
        <h1 className="cs-display mt-3 text-4xl sm:text-5xl">
          Tus proyectos.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cs-muted)]">
          Acá se centraliza el seguimiento de las cotizaciones y pedidos ya enviados.
        </p>
      </header>

      <section className="grid gap-px border border-[var(--cs-line)] bg-[var(--cs-line)] sm:grid-cols-2">
        <Link
          href="/panel/cotizaciones"
          className="bg-[var(--cs-paper)] p-6 transition-colors hover:bg-[var(--cs-ivory)]"
        >
          <p className="cs-eyebrow">Cotizaciones</p>
          <p className="mt-3 font-serif text-4xl">{cotizaciones.length}</p>
          <p className="mt-2 text-sm text-[var(--cs-muted)]">
            Solicitudes enviadas o guardadas como borrador.
          </p>
        </Link>

        <Link
          href="/panel/pedidos"
          className="bg-[var(--cs-paper)] p-6 transition-colors hover:bg-[var(--cs-ivory)]"
        >
          <p className="cs-eyebrow">Pedidos</p>
          <p className="mt-3 font-serif text-4xl">{pedidos.length}</p>
          <p className="mt-2 text-sm text-[var(--cs-muted)]">
            Proyectos aprobados o facturados.
          </p>
        </Link>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="cs-eyebrow">Actividad</p>
            <h2 className="cs-display mt-2 text-3xl">Últimos movimientos</h2>
          </div>
          <Link
            href="/cotizar"
            className="hidden text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-gold-dark)] sm:block"
          >
            + Nueva cotización
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="border border-dashed border-[var(--cs-line)] bg-[var(--cs-paper)] px-6 py-14 text-center">
            <p className="font-serif text-xl">Todavía no hay proyectos.</p>
            <p className="mt-2 text-sm text-[var(--cs-muted)]">
              La primera cotización puede iniciarse desde el cotizador.
            </p>
            <Link href="/cotizar" className="cs-button mt-6 inline-flex">
              Cotizar
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--cs-line)] border border-[var(--cs-line)] bg-[var(--cs-paper)]">
            {recientes.map((order) => (
              <Link
                key={order.id}
                href={`/panel/ordenes/${order.id}`}
                className="flex flex-col gap-3 px-5 py-5 transition-colors hover:bg-[var(--cs-ivory)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--cs-gold-dark)]">
                    Proyecto #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm text-[var(--cs-muted)]">
                    {new Date(order.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <span className="text-xs font-semibold uppercase tracking-[.1em] text-[var(--cs-muted)]">
                    {statusLabels[order.status] ?? order.status}
                  </span>
                  <span className="font-serif text-lg">
                    {currency.format(Number(order.total ?? 0))}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
