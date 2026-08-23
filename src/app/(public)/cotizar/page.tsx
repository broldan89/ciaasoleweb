"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";

export default function CotizarPage() {
  const { items, borrarTodo, total } = useCarrito();
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const manejarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!items.length || enviando) return;
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
          status: "cotizacion",
        }),
      });

      if (respuesta.status === 401) {
        alert("Debés iniciar sesión para cotizar");
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
          Revisá las opciones seleccionadas, agregá las observaciones necesarias
          y enviá la solicitud. El precio definitivo se vuelve a calcular en el servidor.
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
            <p className="cs-eyebrow">02 / Solicitud</p>
            <h2 className="cs-display mt-2 text-2xl">Resumen</h2>

            <div className="mt-7 border-y border-[var(--cs-line)] py-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Total estimado</span>
                <strong className="cs-display text-3xl">${total.toLocaleString("es-AR")}</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--cs-muted)]">
                El total definitivo se calcula y confirma en el servidor al enviar.
              </p>
            </div>

            <label className="cs-label mt-6" htmlFor="notas">Observaciones</label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="min-h-32 w-full resize-y border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]"
              placeholder="Medidas, telas, ambientes, instalación u otras observaciones..."
            />

            <button type="submit" disabled={enviando || !items.length} className="cs-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40">
              {enviando ? "Enviando..." : "Enviar cotización"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
