"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";

type OpcionEnvio = {
  shipping_method_id: string;
  metodo: string;
  proveedor: string;
  descripcion: string | null;
  costo: number | string;
};

export default function CotizarPage() {
  const { items, borrarTodo, total } = useCarrito();
  const [notas, setNotas] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [opcionesEnvio, setOpcionesEnvio] = useState<OpcionEnvio[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [consultandoEnvio, setConsultandoEnvio] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setOpcionesEnvio([]);
    setShippingMethodId("");
    setShippingCost(0);
    setErrorEnvio("");
  }, [codigoPostal]);

  const consultarEnvio = async () => {
    const cp = Number(codigoPostal);

    if (!/^\d{4,5}$/.test(codigoPostal) || !Number.isInteger(cp)) {
      setErrorEnvio("Ingresá un código postal válido de 4 o 5 dígitos.");
      return;
    }

    setConsultandoEnvio(true);
    setErrorEnvio("");

    try {
      const respuesta = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoPostal: cp }),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setOpcionesEnvio([]);
        setShippingMethodId("");
        setShippingCost(0);
        setErrorEnvio(resultado?.error ?? "No se pudieron consultar los envíos.");
        return;
      }

      const opciones = (resultado?.opciones ?? []) as OpcionEnvio[];
      setOpcionesEnvio(opciones);

      if (!opciones.length) {
        setShippingMethodId("");
        setShippingCost(0);
        setErrorEnvio("No hay una tarifa disponible para ese código postal.");
        return;
      }

      const primera = opciones[0];
      setShippingMethodId(primera.shipping_method_id);
      setShippingCost(Number(primera.costo));
    } catch {
      setOpcionesEnvio([]);
      setShippingMethodId("");
      setShippingCost(0);
      setErrorEnvio("No se pudieron consultar los envíos.");
    } finally {
      setConsultandoEnvio(false);
    }
  };

  const seleccionarEnvio = (id: string) => {
    const opcion = opcionesEnvio.find((item) => item.shipping_method_id === id);
    setShippingMethodId(id);
    setShippingCost(opcion ? Number(opcion.costo) : 0);
  };

  const totalEstimado = total + shippingCost;

  const manejarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!items.length || enviando) return;

    if (!codigoPostal || !shippingMethodId) {
      setErrorEnvio("Ingresá el código postal y seleccioná un método de envío.");
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            varianteId: item.varianteId,
            cantidad: item.cantidad,
          })),
          notas,
          codigoPostal: Number(codigoPostal),
          shippingMethodId,
          status: "cotizacion",
        }),
      });

      if (respuesta.status === 401) {
        alert("Debés iniciar sesión para confirmar la cotización");
        router.push("/login");
        return;
      }

      if (!respuesta.ok) {
        const resultado = await respuesta.json().catch(() => null);
        alert(resultado?.error ?? "Error al enviar la cotización");
        return;
      }

      alert("Cotización enviada correctamente");
      borrarTodo();
      setNotas("");
      setCodigoPostal("");
      setShippingMethodId("");
      setShippingCost(0);
      router.push("/cotizar/mis-cotizaciones");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="cs-section py-14 sm:py-20 lg:py-24">
      <div className="max-w-3xl">
        <p className="cs-eyebrow">Cotizador</p>
        <h1 className="cs-display mt-3 text-5xl sm:text-6xl">Armá tu proyecto.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--cs-muted)]">
          Revisá los productos seleccionados, indicá el destino del envío y enviá la solicitud.
          El precio definitivo se vuelve a calcular en el servidor.
        </p>
      </div>

      <form onSubmit={manejarCotizacion} className="mt-12 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="cs-card overflow-hidden">
          <div className="border-b border-[var(--cs-line)] px-6 py-5 sm:px-8">
            <p className="cs-eyebrow">01 / Detalle</p>
            <h2 className="cs-display mt-2 text-2xl">Productos seleccionados</h2>
          </div>

          {items.length ? (
            <div className="divide-y divide-[var(--cs-line)]">
              {items.map((item) => (
                <div key={item.varianteId} className="grid gap-3 px-6 py-6 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-8">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--cs-ink)]">{item.nombre}</h3>
                    <p className="mt-1 text-xs text-[var(--cs-muted)]">Configuración seleccionada</p>
                  </div>
                  <div className="text-xs text-[var(--cs-muted)]">× {item.cantidad}</div>
                  <div className="text-sm font-semibold">${item.total.toLocaleString("es-AR")}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-8 py-16 text-center">
              <p className="cs-display text-2xl">Todavía no hay productos.</p>
              <p className="mt-3 text-sm text-[var(--cs-muted)]">Volvé al catálogo para elegir una solución.</p>
              <a href="/" className="cs-button mt-7">Ver catálogo</a>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="cs-card p-6 sm:p-7 lg:sticky lg:top-28">
            <p className="cs-eyebrow">02 / Envío</p>
            <h2 className="cs-display mt-2 text-2xl">Destino</h2>

            <label className="cs-label mt-6" htmlFor="codigoPostal">Código postal</label>
            <div className="mt-2 flex gap-2">
              <input
                id="codigoPostal"
                inputMode="numeric"
                maxLength={5}
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className="min-w-0 flex-1 border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                placeholder="Ej. 1001"
              />
              <button
                type="button"
                onClick={consultarEnvio}
                disabled={consultandoEnvio || !codigoPostal}
                className="cs-button disabled:cursor-not-allowed disabled:opacity-40"
              >
                {consultandoEnvio ? "Consultando..." : "Calcular"}
              </button>
            </div>

            {opcionesEnvio.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="cs-label">Método de envío</p>
                {opcionesEnvio.map((opcion) => (
                  <label key={opcion.shipping_method_id} className="flex cursor-pointer items-start gap-3 border border-[var(--cs-line)] p-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={opcion.shipping_method_id}
                      checked={shippingMethodId === opcion.shipping_method_id}
                      onChange={() => seleccionarEnvio(opcion.shipping_method_id)}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <span>{opcion.metodo}</span>
                        <span>${Number(opcion.costo).toLocaleString("es-AR")}</span>
                      </span>
                      <span className="mt-1 block text-xs text-[var(--cs-muted)]">
                        {opcion.descripcion || opcion.proveedor}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {errorEnvio && <p className="mt-3 text-xs leading-5 text-[var(--cs-danger)]">{errorEnvio}</p>}

            <div className="mt-7 border-y border-[var(--cs-line)] py-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Productos</span>
                <strong className="text-sm">${total.toLocaleString("es-AR")}</strong>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Envío</span>
                <strong className="text-sm">{shippingCost ? `$${shippingCost.toLocaleString("es-AR")}` : "A calcular"}</strong>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--cs-line)] pt-5">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Total estimado</span>
                <strong className="cs-display text-3xl">${totalEstimado.toLocaleString("es-AR")}</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--cs-muted)]">
                El total definitivo se valida nuevamente en el servidor al confirmar.
              </p>
            </div>

            <label className="cs-label mt-6" htmlFor="notas">Observaciones</label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="min-h-32 w-full resize-y border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
              placeholder="Medidas, ambientes, instalación u otras observaciones..."
            />

            <button
              type="submit"
              disabled={enviando || !items.length || !shippingMethodId}
              className="cs-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? "Enviando..." : "Enviar cotización"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
