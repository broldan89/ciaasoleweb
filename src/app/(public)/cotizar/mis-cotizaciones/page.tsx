"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";

type ResultadoConsumo = {
  fabricable: boolean;
  metrosLineales: number;
  orientacion: "normal" | "apaisada" | null;
  motivo?: string;
};

type ResultadoItem = {
  id: string;
  anchoCm: number;
  altoCm: number;
  resultado: ResultadoConsumo;
};

export default function CotizarPage() {
  const { items, borrarItem, borrarTodo, total } = useCarrito();

  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [medidas, setMedidas] = useState<
    Record<string, { ancho: string; alto: string }>
  >({});

  const [resultados, setResultados] = useState<Record<string, ResultadoItem>>(
    {},
  );

  const router = useRouter();

  const actualizarMedida = (
    id: string,
    campo: "ancho" | "alto",
    valor: string,
  ) => {
    setMedidas((actuales) => ({
      ...actuales,
      [id]: {
        ancho: actuales[id]?.ancho ?? "",
        alto: actuales[id]?.alto ?? "",
        [campo]: valor,
      },
    }));
  };

  const calcularItem = async (itemId: string, varianteId: string) => {
    const medida = medidas[itemId];

    const ancho = Number(medida?.ancho);
    const alto = Number(medida?.alto);

    if (
      !Number.isFinite(ancho) ||
      !Number.isFinite(alto) ||
      ancho <= 0 ||
      alto <= 0
    ) {
      alert("Ingresá un ancho y un alto mayores a cero.");
      return;
    }

    try {
      const respuesta = await fetch(
        `/api/ordenes?modo=calcular&varianteId=${encodeURIComponent(
          varianteId,
        )}&anchoCm=${encodeURIComponent(
          ancho,
        )}&altoCm=${encodeURIComponent(alto)}`,
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        alert(data?.error ?? "No se pudo calcular la cotización.");
        return;
      }

      setResultados((actuales) => ({
        ...actuales,
        [itemId]: {
          id: itemId,
          anchoCm: ancho,
          altoCm: alto,
          resultado: data.resultado,
        },
      }));
    } catch {
      alert("No se pudo conectar con el servidor.");
    }
  };

  const todosCalculados =
    items.length > 0 &&
    items.every((item) => {
      const resultado = resultados[item.id];
      return resultado?.resultado.fabricable;
    });

  const manejarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!items.length || enviando) return;

    if (!todosCalculados) {
      alert(
        "Calculá y validá todos los productos antes de enviar la cotización.",
      );
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch("/api/ordenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            anchoCm: resultados[item.id].anchoCm,
            altoCm: resultados[item.id].altoCm,
            metrosLineales: resultados[item.id].resultado.metrosLineales,
            orientacion: resultados[item.id].resultado.orientacion,
          })),
          notas,
          status: "cotizacion",
        }),
      });

      if (respuesta.status === 401) {
        alert("Debés iniciar sesión para cotizar.");
        router.push("/login");
        return;
      }

      if (!respuesta.ok) {
        const resultado = await respuesta.json().catch(() => null);

        alert(resultado?.error ?? "Error al enviar la cotización.");

        return;
      }

      alert("Cotización enviada correctamente.");

      borrarTodo();
      setNotas("");

      router.push("/cotizar/mis-cotizaciones");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="cs-section py-14 sm:py-20 lg:py-24">
      <div className="max-w-3xl">
        <p className="cs-eyebrow">Cotizador</p>

        <h1 className="cs-display mt-3 text-5xl sm:text-6xl">
          Armá tu proyecto.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--cs-muted)]">
          Indicá las medidas de cada producto. El sistema verifica la
          fabricación, calcula el consumo de tela y determina la orientación
          correspondiente.
        </p>
      </div>

      <form
        onSubmit={manejarCotizacion}
        className="mt-12 grid gap-8 lg:grid-cols-[1fr_340px]"
      >
        <section className="cs-card overflow-hidden">
          <div className="border-b border-[var(--cs-line)] px-6 py-5 sm:px-8">
            <p className="cs-eyebrow">01 / Medidas</p>

            <h2 className="cs-display mt-2 text-2xl">
              Productos seleccionados
            </h2>
          </div>

          {items.length ? (
            <div className="divide-y divide-[var(--cs-line)]">
              {items.map((item) => {
                const medida = medidas[item.id] ?? {
                  ancho: "",
                  alto: "",
                };

                const calculo = resultados[item.id];

                return (
                  <article key={item.id} className="px-6 py-7 sm:px-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--cs-ink)]">
                          {item.nombre}
                        </h3>

                        <p className="mt-1 text-xs text-[var(--cs-muted)]">
                          Cantidad: {item.cantidad}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => borrarItem(item.id)}
                        className="self-start text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)] underline decoration-[var(--cs-line)] underline-offset-4 hover:text-[var(--cs-danger)]"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`ancho-${item.id}`}
                          className="cs-label"
                        >
                          Ancho (cm)
                        </label>

                        <input
                          id={`ancho-${item.id}`}
                          type="number"
                          min="1"
                          step="0.1"
                          value={medida.ancho}
                          onChange={(e) =>
                            actualizarMedida(item.id, "ancho", e.target.value)
                          }
                          className="mt-2 w-full border border-[var(--cs-line)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor={`alto-${item.id}`} className="cs-label">
                          Alto (cm)
                        </label>

                        <input
                          id={`alto-${item.id}`}
                          type="number"
                          min="1"
                          step="0.1"
                          value={medida.alto}
                          onChange={(e) =>
                            actualizarMedida(item.id, "alto", e.target.value)
                          }
                          className="mt-2 w-full border border-[var(--cs-line)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--cs-gold)]"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => calcularItem(item.id, item.varianteId)}
                      className="cs-button mt-5"
                    >
                      Calcular fabricación
                    </button>

                    {calculo && (
                      <div className="mt-6 border-t border-[var(--cs-line)] pt-5">
                        {calculo.resultado.fabricable ? (
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]">
                                Estado
                              </span>

                              <strong className="mt-1 block text-sm">
                                Fabricable
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]">
                                Consumo
                              </span>

                              <strong className="mt-1 block text-sm">
                                {calculo.resultado.metrosLineales.toLocaleString(
                                  "es-AR",
                                  {
                                    maximumFractionDigits: 2,
                                  },
                                )}{" "}
                                m
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]">
                                Orientación
                              </span>

                              <strong className="mt-1 block text-sm">
                                {calculo.resultado.orientacion === "apaisada"
                                  ? "Apaisada"
                                  : "Normal"}
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-[var(--cs-danger)]/30 bg-[var(--cs-danger)]/5 p-4">
                            <p className="text-sm font-medium text-[var(--cs-danger)]">
                              No fabricable
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[var(--cs-muted)]">
                              {calculo.resultado.motivo}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-8 py-16 text-center">
              <p className="cs-display text-2xl">Todavía no hay productos.</p>

              <p className="mt-3 text-sm text-[var(--cs-muted)]">
                Volvé al catálogo para elegir una solución.
              </p>

              <a href="/" className="cs-button mt-7">
                Ver catálogo
              </a>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="cs-card p-6 sm:p-7 lg:sticky lg:top-28">
            <p className="cs-eyebrow">02 / Solicitud</p>

            <h2 className="cs-display mt-2 text-2xl">Resumen</h2>

            <div className="mt-7 border-y border-[var(--cs-line)] py-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">
                  Total estimado
                </span>

                <strong className="cs-display text-3xl">
                  ${total.toLocaleString("es-AR")}
                </strong>
              </div>

              <p className="mt-3 text-xs leading-5 text-[var(--cs-muted)]">
                El precio comercial corresponde a la variante seleccionada. El
                consumo y la fabricación se validan según las medidas
                ingresadas.
              </p>
            </div>

            <label className="cs-label mt-6" htmlFor="notas">
              Observaciones
            </label>

            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="min-h-32 w-full resize-y border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
              placeholder="Ambientes, instalación u otras observaciones..."
            />

            <button
              type="submit"
              disabled={enviando || !items.length || !todosCalculados}
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
