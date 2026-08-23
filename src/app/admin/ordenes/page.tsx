"use client";

import { useMemo, useState } from "react";

type Tab = "todas" | "en proceso" | "aprobadas";

type Order = {
  id: string;
  client: string;
  status: "Aprobada" | "En proceso";
  product: string;
  variant: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  date: string;
};

const ORDERS: Order[] = [
  {
    id: "110ECB98",
    client: "roldanbrian.data@gmail.com",
    status: "Aprobada",
    product: "Sistema Roller Double",
    variant: "Tela Screen 3% White",
    unitPrice: 98,
    quantity: 12,
    subtotal: 1176,
    date: "22/08/2026",
  },
];

const currency = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

function StatusBadge({ status }: { status: Order["status"] }) {
  const approved = status === "Aprobada";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1",
        "text-[10px] font-medium uppercase tracking-[0.14em]",
        approved
          ? "border-[#c9b27c]/40 bg-[#f5f0e4] text-[#8a6b2f]"
          : "border-[#d8d1c5] bg-[#f7f5f1] text-[#6e675d]",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          approved ? "bg-[#b08a3c]" : "bg-[#8a8378]",
        ].join(" ")}
      />
      {status}
    </span>
  );
}

function NuevaOrdenModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    clienteEmail: "",
    sistema: "Roller Individual",
    tela: "Screen 3% White",
    ancho: "",
    alto: "",
    cantidad: 1,
    precioUnitario: "",
  });

  if (!isOpen) return null;

  const update = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211f1b]/45 p-4 backdrop-blur-[3px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2px] border border-[#ddd7cc] bg-[#fbfaf7] shadow-[0_30px_80px_rgba(33,31,27,0.18)]">
        <div className="flex items-start justify-between border-b border-[#e4dfd6] px-7 py-6">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a17b35]">
              Nueva orden
            </p>
            <h2 className="font-serif text-2xl font-normal tracking-[-0.02em] text-[#24221f]">
              Ingresar orden de trabajo
            </h2>
            <p className="mt-2 text-sm text-[#777067]">
              Completar los datos comerciales y técnicos de la orden.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-2xl font-light leading-none text-[#8b847a] transition hover:text-[#24221f]"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onClose();
          }}
          className="space-y-6 px-7 py-7"
        >
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777067]">
              Email o nombre del cliente
            </label>
            <input
              type="email"
              required
              value={formData.clienteEmail}
              onChange={(event) => update("clienteEmail", event.target.value)}
              placeholder="ejemplo@estudio.com"
              className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm text-[#24221f] outline-none transition placeholder:text-[#aaa39a] focus:border-[#b08a3c]"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777067]">
                Sistema de cortinado
              </label>
              <select
                value={formData.sistema}
                onChange={(event) => update("sistema", event.target.value)}
                className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm text-[#24221f] outline-none focus:border-[#b08a3c]"
              >
                <option>Roller Individual</option>
                <option>Roller Doble</option>
                <option>Banda Vertical</option>
                <option>Panel Oriental</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777067]">
                Colección de tela
              </label>
              <select
                value={formData.tela}
                onChange={(event) => update("tela", event.target.value)}
                className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm text-[#24221f] outline-none focus:border-[#b08a3c]"
              >
                <option>Screen 3% White</option>
                <option>Screen 5% Charcoal</option>
                <option>Blackout Premium</option>
                <option>Sunscreen Linen</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777067]">
                Ancho (cm)
              </label>
              <input
                type="number"
                value={formData.ancho}
                onChange={(event) => update("ancho", event.target.value)}
                placeholder="180"
                className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#b08a3c]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777067]">
                Alto (cm)
              </label>
              <input
                type="number"
                value={formData.alto}
                onChange={(event) => update("alto", event.target.value)}
                placeholder="220"
                className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#b08a3c]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777067]">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={formData.cantidad}
                onChange={(event) =>
                  update("cantidad", Number(event.target.value) || 1)
                }
                className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#b08a3c]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777067]">
              Precio unitario
            </label>
            <input
              type="number"
              value={formData.precioUnitario}
              onChange={(event) => update("precioUnitario", event.target.value)}
              placeholder="98"
              className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#b08a3c]"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e4dfd6] pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#d0c9be] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#625c54] transition hover:border-[#aaa196] hover:bg-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="bg-[#b08a3c] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#98752f]"
            >
              Crear orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdenesCiaoSolePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState<Tab>("todas");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ORDERS.filter((order) => {
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.client.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query) ||
        order.variant.toLowerCase().includes(query);

      const matchesTab =
        tabActiva === "todas" ||
        (tabActiva === "aprobadas" && order.status === "Aprobada") ||
        (tabActiva === "en proceso" && order.status === "En proceso");

      return matchesSearch && matchesTab;
    });
  }, [search, tabActiva]);

  return (
    <>
      <main className="min-h-full bg-[#f7f5f0] px-5 py-8 text-[#24221f] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1180px]">
          <header className="border-b border-[#ddd7cc] pb-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a17b35]">
                  Ciao Sole · Cortinados & Control Solar
                </p>

                <h1 className="max-w-3xl font-serif text-3xl font-normal leading-tight tracking-[-0.025em] text-[#24221f] sm:text-4xl">
                  Cotizaciones y órdenes de trabajo
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777067]">
                  Seguimiento comercial y operativo de cada proyecto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex w-fit items-center justify-center border border-[#b08a3c] bg-[#b08a3c] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-white transition hover:bg-[#98752f]"
              >
                + Nueva orden
              </button>
            </div>
          </header>

          <section className="py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full max-w-md">
                <label className="sr-only" htmlFor="order-search">
                  Buscar órdenes
                </label>
                <input
                  id="order-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por cliente, referencia o producto..."
                  className="w-full border border-[#d8d2c8] bg-white px-4 py-3 text-sm text-[#24221f] outline-none transition placeholder:text-[#aaa39a] focus:border-[#b08a3c]"
                />
              </div>

              <nav className="flex flex-wrap items-center gap-5 border-b border-[#ded8ce] lg:border-0">
                {(["todas", "en proceso", "aprobadas"] as Tab[]).map((tab) => {
                  const active = tabActiva === tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTabActiva(tab)}
                      className={[
                        "relative pb-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition",
                        active
                          ? "text-[#24221f]"
                          : "text-[#918a80] hover:text-[#5e5851]",
                      ].join(" ")}
                    >
                      {tab}
                      {active && (
                        <span className="absolute inset-x-0 bottom-0 h-px bg-[#b08a3c]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </section>

          <section className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="border border-dashed border-[#d4cec4] bg-[#fbfaf7] px-6 py-14 text-center">
                <p className="font-serif text-xl text-[#34302b]">
                  No se encontraron órdenes
                </p>
                <p className="mt-2 text-sm text-[#817a71]">
                  Ajustá la búsqueda o seleccioná otro estado.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className="border border-[#ddd7cc] bg-[#fbfaf7] transition hover:border-[#c8c0b4]"
                >
                  <div className="flex flex-col gap-5 border-b border-[#e4dfd6] px-6 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a17b35]">
                        OT #{order.id}
                      </p>
                      <p className="mt-2 text-sm text-[#4f4942]">
                        {order.client}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <StatusBadge status={order.status} />
                      <button
                        type="button"
                        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#756e65] underline decoration-[#c9c1b6] underline-offset-4 transition hover:text-[#24221f]"
                      >
                        Emitir factura
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,2.4fr)_0.8fr_0.7fr_0.9fr] lg:items-end">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#969087]">
                        Especificación / variante
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#34302b]">
                        {order.product}
                      </p>
                      <p className="mt-1 text-xs text-[#817a71]">
                        {order.variant}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#969087]">
                        Precio unit.
                      </p>
                      <p className="mt-2 text-sm text-[#34302b]">
                        ${currency.format(order.unitPrice)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#969087]">
                        Cantidad
                      </p>
                      <p className="mt-2 text-sm text-[#34302b]">
                        {order.quantity} un.
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#969087]">
                        Subtotal
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#34302b]">
                        ${currency.format(order.subtotal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-[#e4dfd6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <p className="text-xs text-[#898178]">
                      Emitido el {order.date}
                    </p>

                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#969087]">
                        Total de la orden
                      </p>
                      <p className="mt-1 font-serif text-2xl text-[#24221f]">
                        ${currency.format(order.subtotal)}
                        <span className="ml-2 font-sans text-[10px] uppercase tracking-[0.12em] text-[#a17b35]">
                          ARS
                        </span>
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </main>

      <NuevaOrdenModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
