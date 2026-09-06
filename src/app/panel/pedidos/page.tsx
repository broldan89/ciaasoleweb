import Link from "next/link";

import { createClient } from "@/lib/supabase-server";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const statusLabels: Record<string, string> = {
  aprobada: "Aprobada",
  facturada: "Facturada",
};

export default async function PedidosPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .in("status", ["aprobada", "facturada"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando pedidos:", error);
  }

  const rows = orders ?? [];

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="border-b border-[var(--cs-line)] pb-7">
        <p className="cs-eyebrow">Mi cuenta / Pedidos</p>
        <h1 className="cs-display mt-3 text-4xl sm:text-5xl">Pedidos.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cs-muted)]">
          Acá aparecen los proyectos que ya pasaron de cotización a pedido.
        </p>
      </header>

      <section className="mt-8">
        {rows.length === 0 ? (
          <div className="border border-dashed border-[var(--cs-line)] bg-[var(--cs-paper)] px-6 py-14 text-center">
            <p className="font-serif text-xl">No hay pedidos todavía.</p>
            <p className="mt-2 text-sm text-[var(--cs-muted)]">
              Los pedidos aprobados o facturados aparecerán acá.
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
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
