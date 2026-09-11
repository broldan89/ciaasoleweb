"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCarrito } from "@/context/CarritoContext";

type CatalogoItem = {
  varianteId: string;
  productoNombre: string;
  nombre: string;
  precio: number;
};

type OpcionEnvio = {
  shipping_method_id: string;
  metodo: string;
  proveedor: string;
  descripcion: string | null;
  costo: number | string;
};

type EstadoMedida = {
  anchoCm: string;
  altoCm: string;
  calculando: boolean;
  fabricable: boolean | null;
  mensaje: string;
};

const estadoInicial = (): EstadoMedida => ({
  anchoCm: "",
  altoCm: "",
  calculando: false,
  fabricable: null,
  mensaje: "",
});

export default function CotizarWorkspaceClient({
  catalogo,
}: {
  catalogo: CatalogoItem[];
}) {
  const {
    items,
    agregarItem,
    actualizarCantidad,
    borrarItem,
    borrarTodo,
    total,
  } = useCarrito();
  const router = useRouter();
  const [medidas, setMedidas] = useState<Record<string, EstadoMedida>>({});
  const [notas, setNotas] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [opcionesEnvio, setOpcionesEnvio] = useState<OpcionEnvio[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [consultandoEnvio, setConsultandoEnvio] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorCotizacion, setErrorCotizacion] = useState("");

  const medidasClave = items
    .map(
      (item) =>
        `${item.id}:${item.varianteId}:${medidas[item.id]?.anchoCm ?? ""}:${medidas[item.id]?.altoCm ?? ""}`,
    )
    .join("|");

  useEffect(() => {
    const controllers = new Map<string, AbortController>();
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const item of items) {
      const estado = medidas[item.id] ?? estadoInicial();
      const anchoCm = Number(estado.anchoCm.replace(",", "."));
      const altoCm = Number(estado.altoCm.replace(",", "."));

      if (
        !estado.anchoCm ||
        !estado.altoCm ||
        !Number.isFinite(anchoCm) ||
        !Number.isFinite(altoCm) ||
        anchoCm <= 0 ||
        altoCm <= 0
      ) {
        continue;
      }

      const timer = setTimeout(async () => {
        const controller = new AbortController();
        controllers.set(item.id, controller);

        setMedidas((actuales) => ({
          ...actuales,
          [item.id]: {
            ...(actuales[item.id] ?? estadoInicial()),
            calculando: true,
            fabricable: null,
            mensaje: "",
          },
        }));

        try {
          const params = new URLSearchParams({
            modo: "calcular",
            varianteId: item.varianteId,
            anchoCm: String(anchoCm),
            altoCm: String(altoCm),
          });

          const respuesta = await fetch(`/api/ordenes?${params.toString()}`, {
            signal: controller.signal,
          });
          const payload = await respuesta.json().catch(() => null);

          if (!respuesta.ok) {
            setMedidas((actuales) => ({
              ...actuales,
              [item.id]: {
                ...(actuales[item.id] ?? estadoInicial()),
                calculando: false,
                fabricable: false,
                mensaje: "No pudimos validar esta medida.",
              },
            }));
            return;
          }

          const fabricable = Boolean(payload?.resultado?.fabricable);

          setMedidas((actuales) => ({
            ...actuales,
            [item.id]: {
              ...(actuales[item.id] ?? estadoInicial()),
              calculando: false,
              fabricable,
              mensaje: fabricable
                ? "Medida válida para fabricación."
                : "La medida ingresada no está disponible para fabricación.",
            },
          }));
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;

          setMedidas((actuales) => ({
            ...actuales,
            [item.id]: {
              ...(actuales[item.id] ?? estadoInicial()),
              calculando: false,
              fabricable: false,
              mensaje: "No pudimos validar esta medida.",
            },
          }));
        } finally {
          controllers.delete(item.id);
        }
      }, 450);

      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
      controllers.forEach((controller) => controller.abort());
    };
  }, [items, medidasClave]);

  useEffect(() => {
    if (!/^\d{4,5}$/.test(codigoPostal)) {
      setOpcionesEnvio([]);
      setShippingMethodId("");
      setShippingCost(0);
      setErrorEnvio("");
      setConsultandoEnvio(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setConsultandoEnvio(true);
      setErrorEnvio("");

      try {
        const respuesta = await fetch("/api/envios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigoPostal: Number(codigoPostal) }),
          signal: controller.signal,
        });
        const resultado = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          setOpcionesEnvio([]);
          setShippingMethodId("");
          setShippingCost(0);
          setErrorEnvio(
            resultado?.error ?? "No se pudieron consultar las opciones de envío.",
          );
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

        setShippingMethodId(opciones[0].shipping_method_id);
        setShippingCost(Number(opciones[0].costo));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setOpcionesEnvio([]);
        setShippingMethodId("");
        setShippingCost(0);
        setErrorEnvio("No se pudieron consultar las opciones de envío.");
      } finally {
        setConsultandoEnvio(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [codigoPostal]);

  const actualizarMedida = (
    itemId: string,
    campo: "anchoCm" | "altoCm",
    valor: string,
  ) => {
    setMedidas((actuales) => ({
      ...actuales,
      [itemId]: {
        ...(actuales[itemId] ?? estadoInicial()),
        [campo]: valor.replace(/[^0-9.,]/g, ""),
        calculando: false,
        fabricable: null,
        mensaje: "",
      },
    }));
  };

  const todosFabricables =
    items.length > 0 &&
    items.every((item) => medidas[item.id]?.fabricable === true);

  const totalEstimado = total + shippingCost;

  const manejarCotizacion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorCotizacion("");

    if (!items.length || enviando) return;

    if (!todosFabricables) {
      setErrorCotizacion(
        "Completá las medidas y esperá la validación automática de fabricación.",
      );
      return;
    }

    if (!codigoPostal || !shippingMethodId) {
      setErrorCotizacion(
        "Ingresá un código postal con una opción de envío disponible.",
      );
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
            anchoCm: Number(medidas[item.id].anchoCm.replace(",", ".")),
            altoCm: Number(medidas[item.id].altoCm.replace(",", ".")),
          })),
          notas,
          codigoPostal: Number(codigoPostal),
          shippingMethodId,
          status: "cotizacion",
        }),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (respuesta.status === 401) {
        router.push("/login?redirect=/cotizar");
        return;
      }

      if (!respuesta.ok) {
        setErrorCotizacion(
          resultado?.error ?? "No se pudo enviar la cotización.",
        );
        return;
      }

      borrarTodo();
      router.push("/panel/cotizaciones");
    } catch {
      setErrorCotizacion(
        "No se pudo enviar la cotización. Intentá nuevamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="cs-section py-14 sm:py-20 lg:py-24">
      <div className="max-w-4xl">
        <p className="cs-eyebrow">Cotizador</p>
        <h1 className="cs-display mt-3 text-5xl sm:text-6xl">Armá tu proyecto.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--cs-muted)]">
          Elegí los sistemas, definí las medidas y obtené una estimación de envío y total en un mismo lugar.
        </p>
      </div>

      <section className="cs-card mt-10 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="cs-eyebrow">Catálogo</p>
            <h2 className="cs-display mt-2 text-2xl">Agregar sistemas</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--cs-muted)]">
            Cada sistema agregado aparece inmediatamente debajo para completar sus medidas.
          </p>
        </div>

        <div className="mt-6 divide-y divide-[var(--cs-line)] border-y border-[var(--cs-line)]">
          {catalogo.length ? (
            catalogo.map((producto) => (
              <div
                key={producto.varianteId}
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs text-[var(--cs-muted)]">{producto.productoNombre}</p>
                  <p className="mt-1 text-sm font-semibold">{producto.nombre}</p>
                </div>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <span className="text-sm font-semibold">
                    ${producto.precio.toLocaleString("es-AR")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      agregarItem({
                        varianteId: producto.varianteId,
                        nombre: `${producto.productoNombre} · ${producto.nombre}`,
                        cantidad: 1,
                        precioUnitario: producto.precio,
                        total: producto.precio,
                      })
                    }
                    className="cs-button"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-sm text-[var(--cs-muted)]">
              No hay productos publicados para cotizar.
            </p>
          )}
        </div>
      </section>

      {!items.length ? (
        <div className="cs-card mt-6 p-8 text-center sm:p-12">
          <p className="cs-eyebrow">Proyecto vacío</p>
          <h2 className="cs-display mt-3 text-3xl">
            Agregá al menos un sistema para comenzar.
          </h2>
        </div>
      ) : (
        <form
          onSubmit={manejarCotizacion}
          className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]"
        >
          <div className="space-y-6">
            <section className="cs-card overflow-hidden">
              <div className="border-b border-[var(--cs-line)] px-6 py-5 sm:px-8">
                <p className="cs-eyebrow">01 / Proyecto</p>
                <h2 className="cs-display mt-2 text-2xl">Configurá cada sistema</h2>
              </div>

              <div className="divide-y divide-[var(--cs-line)]">
                {items.map((item, index) => {
                  const estado = medidas[item.id] ?? estadoInicial();

                  return (
                    <article key={item.id} className="px-6 py-7 sm:px-8">
                      <div>
                        <span className="text-xs text-[var(--cs-muted)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="cs-display mt-1 text-2xl">{item.nombre}</h3>
                        <p className="mt-1 text-xs text-[var(--cs-muted)]">
                          ${item.precioUnitario.toLocaleString("es-AR")} por unidad
                        </p>
                      </div>

                      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px]">
                        <div>
                          <label className="cs-label" htmlFor={`anchoCm-${item.id}`}>
                            Ancho (cm)
                          </label>
                          <input
                            id={`anchoCm-${item.id}`}
                            inputMode="decimal"
                            value={estado.anchoCm}
                            onChange={(event) =>
                              actualizarMedida(item.id, "anchoCm", event.target.value)
                            }
                            className="mt-2 w-full border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                            placeholder="Ej. 180"
                          />
                        </div>

                        <div>
                          <label className="cs-label" htmlFor={`altoCm-${item.id}`}>
                            Alto (cm)
                          </label>
                          <input
                            id={`altoCm-${item.id}`}
                            inputMode="decimal"
                            value={estado.altoCm}
                            onChange={(event) =>
                              actualizarMedida(item.id, "altoCm", event.target.value)
                            }
                            className="mt-2 w-full border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                            placeholder="Ej. 220"
                          />
                        </div>

                        <div>
                          <label className="cs-label" htmlFor={`cantidad-${item.id}`}>
                            Cantidad
                          </label>
                          <div
                            id={`cantidad-${item.id}`}
                            className="mt-2 flex h-[100px] items-stretch border border-[var(--cs-line)] bg-white"
                          >
                            <button
                              type="button"
                              onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                              disabled={item.cantidad <= 1}
                              aria-label={`Reducir cantidad de ${item.nombre}`}
                              className="flex w-14 items-center justify-center text-2xl font-light text-[var(--cs-muted)] transition hover:bg-[var(--cs-paper)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              −
                            </button>
                            <span
                              aria-live="polite"
                              className="flex min-w-0 flex-1 items-center justify-center border-x border-[var(--cs-line)] px-3 text-xl font-semibold"
                            >
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                              disabled={item.cantidad >= 99}
                              aria-label={`Aumentar cantidad de ${item.nombre}`}
                              className="flex w-14 items-center justify-center text-2xl font-light text-[var(--cs-muted)] transition hover:bg-[var(--cs-paper)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => borrarItem(item.id)}
                            className="mt-3 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--cs-muted)] hover:text-[var(--cs-danger)]"
                          >
                            Quitar sistema
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-[var(--cs-line)] pt-5">
                        {estado.calculando ? (
                          <p className="text-xs text-[var(--cs-muted)]">Validando medidas...</p>
                        ) : estado.fabricable === null ? (
                          <p className="text-xs text-[var(--cs-muted)]">
                            Las medidas se validan automáticamente.
                          </p>
                        ) : estado.fabricable ? (
                          <p className="text-sm font-medium text-[var(--cs-ink)]">{estado.mensaje}</p>
                        ) : (
                          <div className="border border-[var(--cs-danger)]/30 bg-[var(--cs-danger)]/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--cs-danger)]">
                              Advertencia de fabricación
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--cs-danger)]">
                              Esta medida no está disponible para fabricación. Probá con una medida diferente.
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="cs-card p-6 sm:p-8">
              <p className="cs-eyebrow">02 / Observaciones</p>
              <h2 className="cs-display mt-2 text-2xl">Detalles del proyecto</h2>
              <label className="cs-label mt-6" htmlFor="notas">
                Observaciones
              </label>
              <textarea
                id="notas"
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                maxLength={2000}
                className="mt-2 min-h-32 w-full resize-y border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                placeholder="Ambientes, instalación, necesidades especiales u otras observaciones..."
              />
            </section>
          </div>

          <aside>
            <section className="cs-card p-6 sm:p-7 lg:sticky lg:top-28">
              <p className="cs-eyebrow">03 / Envío</p>
              <h2 className="cs-display mt-2 text-2xl">Destino</h2>

              <label className="cs-label mt-6" htmlFor="codigoPostal">
                Código postal
              </label>
              <input
                id="codigoPostal"
                inputMode="numeric"
                maxLength={5}
                value={codigoPostal}
                onChange={(event) =>
                  setCodigoPostal(event.target.value.replace(/\D/g, "").slice(0, 5))
                }
                className="mt-2 w-full border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                placeholder="Ej. 2000"
              />

              {consultandoEnvio && (
                <p className="mt-3 text-xs text-[var(--cs-muted)]">
                  Consultando opciones de envío...
                </p>
              )}

              {opcionesEnvio.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="cs-label">Método de envío</p>
                  {opcionesEnvio.map((opcion) => (
                    <label
                      key={opcion.shipping_method_id}
                      className="flex cursor-pointer items-start gap-3 border border-[var(--cs-line)] p-3"
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        checked={shippingMethodId === opcion.shipping_method_id}
                        onChange={() => {
                          setShippingMethodId(opcion.shipping_method_id);
                          setShippingCost(Number(opcion.costo));
                        }}
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

              {errorEnvio && (
                <p className="mt-3 text-xs leading-5 text-[var(--cs-danger)]">{errorEnvio}</p>
              )}

              <div className="mt-7 border-y border-[var(--cs-line)] py-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Productos</span>
                  <strong className="text-sm">${total.toLocaleString("es-AR")}</strong>
                </div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Envío</span>
                  <strong className="text-sm">
                    {shippingCost ? `$${shippingCost.toLocaleString("es-AR")}` : "A calcular"}
                  </strong>
                </div>
                <div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--cs-line)] pt-5">
                  <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Total estimado</span>
                  <strong className="cs-display text-3xl">${totalEstimado.toLocaleString("es-AR")}</strong>
                </div>
              </div>

              {errorCotizacion && (
                <p className="mt-4 border border-[var(--cs-danger)]/30 bg-[var(--cs-danger)]/5 p-3 text-xs leading-5 text-[var(--cs-danger)]">
                  {errorCotizacion}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando || !todosFabricables || !shippingMethodId || consultandoEnvio}
                className="cs-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                {enviando ? "Enviando..." : "Solicitar cotización"}
              </button>
            </section>
          </aside>
        </form>
      )}
    </div>
  );
}
