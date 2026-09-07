"use client";

import { useEffect, useRef, useState } from "react";
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

type EvaluacionOrientacion = {
  orientacion: "normal" | "apaisada";
  entra: boolean;
  anchoRequeridoCm: number;
  largoRequeridoCm: number;
  metrosLineales: number;
  motivo?: string;
};

type EstadoMedida = {
  anchoCm: string;
  altoCm: string;
  calculando: boolean;
  calculado: boolean;
  fabricable: boolean | null;
  mensaje: string;
  orientacion: "normal" | "apaisada" | null;
  metrosLineales: number | null;
  evaluaciones: EvaluacionOrientacion[];
};

export default function CotizarPageClient({
  catalogo,
}: {
  catalogo: CatalogoItem[];
}) {
  const { items, agregarItem, borrarItem, borrarTodo, total } = useCarrito();
  const router = useRouter();
  const timers = useRef<Record<string, number>>({});
  const abortControllers = useRef<Record<string, AbortController>>({});
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

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
      Object.values(abortControllers.current).forEach((controller) => controller.abort());
    };
  }, []);

  useEffect(() => {
    const cp = Number(codigoPostal);
    const valido = /^\d{4,5}$/.test(codigoPostal) && Number.isInteger(cp);

    setOpcionesEnvio([]);
    setShippingMethodId("");
    setShippingCost(0);
    setErrorEnvio("");

    if (!valido) {
      setConsultandoEnvio(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setConsultandoEnvio(true);

      try {
        const respuesta = await fetch("/api/envios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigoPostal: cp }),
          signal: controller.signal,
        });

        const resultado = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          setOpcionesEnvio([]);
          setErrorEnvio(
            resultado?.error ?? "No se pudieron consultar los envíos.",
          );
          return;
        }

        const opciones = (resultado?.opciones ?? []) as OpcionEnvio[];
        setOpcionesEnvio(opciones);

        if (!opciones.length) {
          setErrorEnvio("No hay una tarifa disponible para ese código postal.");
          return;
        }

        const primeraOpcion = opciones[0];
        setShippingMethodId(primeraOpcion.shipping_method_id);
        setShippingCost(Number(primeraOpcion.costo));
      } catch (error) {
        if (controller.signal.aborted) return;
        setOpcionesEnvio([]);
        setErrorEnvio("No se pudieron consultar los envíos.");
      } finally {
        if (!controller.signal.aborted) {
          setConsultandoEnvio(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [codigoPostal]);

  const calcularFabricacion = async (
    itemId: string,
    anchoCm: number,
    altoCm: number,
  ) => {
    const item = items.find((actual) => actual.id === itemId);
    if (!item) return;

    abortControllers.current[itemId]?.abort();
    const controller = new AbortController();
    abortControllers.current[itemId] = controller;

    setMedidas((actuales) => ({
      ...actuales,
      [itemId]: {
        ...(actuales[itemId] ?? estadoInicial()),
        anchoCm: String(anchoCm),
        altoCm: String(altoCm),
        calculando: true,
        calculado: false,
        fabricable: null,
        mensaje: "",
        orientacion: null,
        metrosLineales: null,
        evaluaciones: [],
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
      const resultado = await respuesta.json().catch(() => null);

      if (controller.signal.aborted) return;

      if (!respuesta.ok) {
        setMedidas((actuales) => ({
          ...actuales,
          [itemId]: {
            ...(actuales[itemId] ?? estadoInicial()),
            anchoCm: String(anchoCm),
            altoCm: String(altoCm),
            calculando: false,
            calculado: true,
            fabricable: false,
            mensaje:
              resultado?.motivo ??
              resultado?.error ??
              "No se pudo calcular la fabricación.",
            orientacion: null,
            metrosLineales: null,
            evaluaciones: resultado?.resultado?.evaluaciones ?? [],
          },
        }));
        return;
      }

      const fabricable = Boolean(resultado?.resultado?.fabricable);

      setMedidas((actuales) => ({
        ...actuales,
        [itemId]: {
          ...(actuales[itemId] ?? estadoInicial()),
          anchoCm: String(anchoCm),
          altoCm: String(altoCm),
          calculando: false,
          calculado: true,
          fabricable,
          mensaje: fabricable
            ? "Fabricación calculada automáticamente."
            : resultado?.resultado?.motivo ?? "La configuración no es fabricable.",
          orientacion: fabricable
            ? resultado.resultado.orientacion
            : null,
          metrosLineales: fabricable
            ? Number(resultado.resultado.metrosLineales)
            : null,
          evaluaciones: resultado?.resultado?.evaluaciones ?? [],
        },
      }));
    } catch {
      if (controller.signal.aborted) return;

      setMedidas((actuales) => ({
        ...actuales,
        [itemId]: {
          ...(actuales[itemId] ?? estadoInicial()),
          anchoCm: String(anchoCm),
          altoCm: String(altoCm),
          calculando: false,
          calculado: true,
          fabricable: false,
          mensaje: "No se pudo consultar el cálculo. Intentá nuevamente.",
          orientacion: null,
          metrosLineales: null,
          evaluaciones: [],
        },
      }));
    }
  };

  const actualizarMedida = (
    itemId: string,
    campo: "anchoCm" | "altoCm",
    valor: string,
  ) => {
    const valorLimpio = valor.replace(/[^0-9.,]/g, "");
    const anterior = medidas[itemId] ?? estadoInicial();
    const siguiente = {
      ...anterior,
      [campo]: valorLimpio,
      calculando: false,
      calculado: false,
      fabricable: null,
      mensaje: "",
      orientacion: null,
      metrosLineales: null,
      evaluaciones: [],
    } satisfies EstadoMedida;

    setMedidas((actuales) => ({ ...actuales, [itemId]: siguiente }));

    if (timers.current[itemId]) {
      window.clearTimeout(timers.current[itemId]);
    }

    const anchoCm = Number(siguiente.anchoCm.replace(",", "."));
    const altoCm = Number(siguiente.altoCm.replace(",", "."));

    if (
      !Number.isFinite(anchoCm) ||
      !Number.isFinite(altoCm) ||
      anchoCm <= 0 ||
      altoCm <= 0
    ) {
      return;
    }

    timers.current[itemId] = window.setTimeout(() => {
      calcularFabricacion(itemId, anchoCm, altoCm);
    }, 450);
  };

  const quitarItem = (itemId: string) => {
    if (timers.current[itemId]) {
      window.clearTimeout(timers.current[itemId]);
      delete timers.current[itemId];
    }

    abortControllers.current[itemId]?.abort();
    delete abortControllers.current[itemId];

    setMedidas((actuales) => {
      const siguiente = { ...actuales };
      delete siguiente[itemId];
      return siguiente;
    });

    borrarItem(itemId);
  };

  const seleccionarEnvio = (id: string) => {
    const opcion = opcionesEnvio.find(
      (item) => item.shipping_method_id === id,
    );

    setShippingMethodId(id);
    setShippingCost(opcion ? Number(opcion.costo) : 0);
  };

  const todosFabricables =
    items.length > 0 &&
    items.every((item) => medidas[item.id]?.fabricable === true);
  const totalEstimado = total + shippingCost;

  const manejarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCotizacion("");

    if (!items.length || enviando) return;

    if (!todosFabricables) {
      setErrorCotizacion(
        "Completá las medidas. La fabricación se valida automáticamente antes de continuar.",
      );
      return;
    }

    if (!codigoPostal || !shippingMethodId) {
      setErrorCotizacion(
        "Ingresá un código postal válido y esperá la cotización del envío.",
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
            anchoCm: Number(
              medidas[item.id].anchoCm.replace(",", "."),
            ),
            altoCm: Number(
              medidas[item.id].altoCm.replace(",", "."),
            ),
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
          resultado?.error ?? "Error al enviar la cotización.",
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
        <h1 className="cs-display mt-3 text-5xl sm:text-6xl">
          Armá tu proyecto.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--cs-muted)]">
          Elegí los sistemas, definí las medidas y dejá que Ciao Sole determine
          automáticamente fabricación, orientación, consumo y envío.
        </p>
      </div>

      <section className="cs-card mt-12 overflow-hidden">
        <div className="border-b border-[var(--cs-line)] px-6 py-5 sm:px-8">
          <p className="cs-eyebrow">01 / Selección</p>
          <h2 className="cs-display mt-2 text-2xl">Agregá sistemas a tu proyecto</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cs-muted)]">
            Cada variante que agregues aparece inmediatamente abajo, donde vas a
            definir sus medidas.
          </p>
        </div>

        <div className="divide-y divide-[var(--cs-line)]">
          {catalogo.map((variante) => (
            <div
              key={variante.varianteId}
              className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
            >
              <div>
                <p className="text-xs text-[var(--cs-muted)]">
                  {variante.productoNombre}
                </p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[.08em]">
                  {variante.nombre}
                </p>
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                <strong className="cs-display text-2xl">
                  ${variante.precio.toLocaleString("es-AR")}
                </strong>
                <button
                  type="button"
                  onClick={() =>
                    agregarItem({
                      varianteId: variante.varianteId,
                      nombre: `${variante.productoNombre} · ${variante.nombre}`,
                      cantidad: 1,
                      precioUnitario: variante.precio,
                      total: variante.precio,
                    })
                  }
                  className="cs-button"
                >
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <form
        onSubmit={manejarCotizacion}
        className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-5">
          <section className="cs-card overflow-hidden">
            <div className="border-b border-[var(--cs-line)] px-6 py-5 sm:px-8">
              <p className="cs-eyebrow">02 / Proyecto</p>
              <h2 className="cs-display mt-2 text-2xl">Configuración automática</h2>
            </div>

            {!items.length ? (
              <div className="px-6 py-12 text-center sm:px-8">
                <p className="text-sm text-[var(--cs-muted)]">
                  Todavía no hay sistemas en el proyecto. Agregá una variante
                  desde la sección superior.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--cs-line)]">
                {items.map((item, index) => {
                  const estado = medidas[item.id] ?? estadoInicial();

                  return (
                    <article key={item.id} className="px-6 py-7 sm:px-8">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <span className="text-xs text-[var(--cs-muted)]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h3 className="cs-display mt-1 text-2xl">
                            {item.nombre}
                          </h3>
                          <p className="mt-1 text-xs text-[var(--cs-muted)]">
                            Cantidad: {item.cantidad} · $
                            {item.precioUnitario.toLocaleString("es-AR")} c/u
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => quitarItem(item.id)}
                          className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--cs-muted)] hover:text-[var(--cs-danger)]"
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="mt-7 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            className="cs-label"
                            htmlFor={`ancho-${item.id}`}
                          >
                            Ancho terminado (cm)
                          </label>
                          <input
                            id={`ancho-${item.id}`}
                            inputMode="decimal"
                            value={estado.anchoCm}
                            onChange={(e) =>
                              actualizarMedida(
                                item.id,
                                "anchoCm",
                                e.target.value,
                              )
                            }
                            className="mt-2 w-full border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                            placeholder="Ej. 120"
                          />
                        </div>

                        <div>
                          <label
                            className="cs-label"
                            htmlFor={`alto-${item.id}`}
                          >
                            Alto terminado (cm)
                          </label>
                          <input
                            id={`alto-${item.id}`}
                            inputMode="decimal"
                            value={estado.altoCm}
                            onChange={(e) =>
                              actualizarMedida(
                                item.id,
                                "altoCm",
                                e.target.value,
                              )
                            }
                            className="mt-2 w-full border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                            placeholder="Ej. 200"
                          />
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[var(--cs-line)] pt-4">
                        {!estado.calculado && !estado.calculando && (
                          <p className="text-xs leading-5 text-[var(--cs-muted)]">
                            Ingresá ambas medidas. La fabricación se calculará
                            automáticamente.
                          </p>
                        )}

                        {estado.calculando && (
                          <p className="text-xs leading-5 text-[var(--cs-muted)]">
                            Analizando fabricación y orientación...
                          </p>
                        )}

                        {estado.calculado && (
                          <div
                            className={`text-xs leading-5 ${
                              estado.fabricable
                                ? "text-[var(--cs-ink)]"
                                : "text-[var(--cs-danger)]"
                            }`}
                          >
                            <strong>
                              {estado.fabricable
                                ? "✓ Fabricable"
                                : "× No fabricable"}
                            </strong>
                            <span className="ml-2 text-[var(--cs-muted)]">
                              {estado.mensaje}
                            </span>

                            {estado.fabricable && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <span className="block text-[var(--cs-muted)]">
                                    Orientación elegida
                                  </span>
                                  <strong>
                                    {estado.orientacion === "apaisada"
                                      ? "Apaisada"
                                      : "Normal"}
                                  </strong>
                                </div>
                                <div>
                                  <span className="block text-[var(--cs-muted)]">
                                    Consumo estimado
                                  </span>
                                  <strong>
                                    {estado.metrosLineales?.toLocaleString(
                                      "es-AR",
                                      { maximumFractionDigits: 2 },
                                    )} m lineales
                                  </strong>
                                </div>
                              </div>
                            )}

                            {!estado.fabricable && estado.evaluaciones.length > 0 && (
                              <div className="mt-3 space-y-1 text-[var(--cs-muted)]">
                                {estado.evaluaciones.map((evaluacion) => (
                                  <p key={evaluacion.orientacion}>
                                    {evaluacion.orientacion === "apaisada"
                                      ? "Apaisada"
                                      : "Normal"}
                                    : {evaluacion.motivo ?? "compatible"}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="cs-card p-6 sm:p-8">
            <p className="cs-eyebrow">03 / Observaciones</p>
            <h2 className="cs-display mt-2 text-2xl">Detalles del proyecto</h2>
            <label className="cs-label mt-6" htmlFor="notas">
              Observaciones
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={2000}
              className="mt-2 min-h-32 w-full resize-y border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
              placeholder="Ambientes, instalación, necesidades especiales u otras observaciones..."
            />
          </section>
        </div>

        <aside>
          <section className="cs-card p-6 sm:p-7 lg:sticky lg:top-28">
            <p className="cs-eyebrow">04 / Envío</p>
            <h2 className="cs-display mt-2 text-2xl">Destino</h2>

            <label className="cs-label mt-6" htmlFor="codigoPostal">
              Código postal
            </label>
            <input
              id="codigoPostal"
              inputMode="numeric"
              maxLength={5}
              value={codigoPostal}
              onChange={(e) =>
                setCodigoPostal(
                  e.target.value.replace(/\D/g, "").slice(0, 5),
                )
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
                      value={opcion.shipping_method_id}
                      checked={shippingMethodId === opcion.shipping_method_id}
                      onChange={() => seleccionarEnvio(opcion.shipping_method_id)}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <span>{opcion.metodo}</span>
                        <span>
                          ${Number(opcion.costo).toLocaleString("es-AR")}
                        </span>
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
              <p className="mt-3 text-xs leading-5 text-[var(--cs-danger)]">
                {errorEnvio}
              </p>
            )}

            <div className="mt-7 border-y border-[var(--cs-line)] py-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">
                  Productos
                </span>
                <strong className="text-sm">
                  ${total.toLocaleString("es-AR")}
                </strong>
              </div>

              <div className="mt-3 flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">
                  Envío
                </span>
                <strong className="text-sm">
                  {shippingCost
                    ? `$${shippingCost.toLocaleString("es-AR")}`
                    : "A calcular"}
                </strong>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--cs-line)] pt-5">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">
                  Total estimado
                </span>
                <strong className="cs-display text-3xl">
                  ${totalEstimado.toLocaleString("es-AR")}
                </strong>
              </div>
            </div>

            {errorCotizacion && (
              <p className="mt-4 border border-[var(--cs-danger)]/30 bg-[var(--cs-danger)]/5 p-3 text-xs leading-5 text-[var(--cs-danger)]">
                {errorCotizacion}
              </p>
            )}

            <button
              type="submit"
              disabled={
                enviando ||
                !items.length ||
                !todosFabricables ||
                !shippingMethodId
              }
              className="cs-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? "Enviando..." : "Confirmar cotización"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-[var(--cs-muted)]">
              Se solicitará iniciar sesión al confirmar. El servidor vuelve a
              validar precios, fabricación y envío.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}

function estadoInicial(): EstadoMedida {
  return {
    anchoCm: "",
    altoCm: "",
    calculando: false,
    calculado: false,
    fabricable: null,
    mensaje: "",
    orientacion: null,
    metrosLineales: null,
    evaluaciones: [],
  };
}
