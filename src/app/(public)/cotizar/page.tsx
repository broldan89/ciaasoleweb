"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";

type OpcionEnvio = { shipping_method_id: string; metodo: string; proveedor: string; descripcion: string | null; costo: number | string };
type EstadoMedida = { anchoCm: string; altoCm: string; calculando: boolean; calculado: boolean; fabricable: boolean | null; mensaje: string; orientacion: "normal" | "apaisada" | null };

export default function CotizarPage() {
  const { items, borrarItem, borrarTodo, total } = useCarrito();
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

  const actualizarMedida = (itemId: string, campo: "anchoCm" | "altoCm", valor: string) => {
    setMedidas((actuales) => ({ ...actuales, [itemId]: { ...(actuales[itemId] ?? estadoInicial()), [campo]: valor.replace(/[^0-9.,]/g, ""), calculado: false, fabricable: null, mensaje: "", orientacion: null } }));
  };

  const calcularFabricacion = async (itemId: string) => {
    const estado = medidas[itemId] ?? estadoInicial();
    const anchoCm = Number(estado.anchoCm.replace(",", "."));
    const altoCm = Number(estado.altoCm.replace(",", "."));
    if (!Number.isFinite(anchoCm) || !Number.isFinite(altoCm) || anchoCm <= 0 || altoCm <= 0) {
      setMedidas((actuales) => ({ ...actuales, [itemId]: { ...estado, mensaje: "Ingresá ancho y alto mayores a cero." } }));
      return;
    }
    const item = items.find((actual) => actual.id === itemId);
    if (!item) return;
    setMedidas((actuales) => ({ ...actuales, [itemId]: { ...estado, calculando: true, calculado: false, mensaje: "" } }));
    try {
      const params = new URLSearchParams({ modo: "calcular", varianteId: item.varianteId, anchoCm: String(anchoCm), altoCm: String(altoCm) });
      const respuesta = await fetch(`/api/ordenes?${params.toString()}`);
      const resultado = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        setMedidas((actuales) => ({ ...actuales, [itemId]: { ...estado, calculando: false, calculado: true, fabricable: false, mensaje: resultado?.error ?? "No se pudo calcular la fabricación.", orientacion: null } }));
        return;
      }
      setMedidas((actuales) => ({ ...actuales, [itemId]: { ...estado, anchoCm: String(anchoCm), altoCm: String(altoCm), calculando: false, calculado: true, fabricable: Boolean(resultado?.resultado?.fabricable), mensaje: resultado?.resultado?.fabricable ? "Medidas válidas para fabricación." : resultado?.resultado?.motivo ?? "La configuración no es fabricable.", orientacion: resultado?.resultado?.fabricable ? resultado.resultado.orientacion : null } }));
    } catch {
      setMedidas((actuales) => ({ ...actuales, [itemId]: { ...estado, calculando: false, calculado: true, fabricable: false, mensaje: "No se pudo consultar el cálculo. Intentá nuevamente.", orientacion: null } }));
    }
  };

  const consultarEnvio = async () => {
    const cp = Number(codigoPostal);
    if (!/^\d{4,5}$/.test(codigoPostal) || !Number.isInteger(cp)) { setErrorEnvio("Ingresá un código postal válido de 4 o 5 dígitos."); return; }
    setConsultandoEnvio(true); setErrorEnvio(""); setShippingMethodId(""); setShippingCost(0);
    try {
      const respuesta = await fetch("/api/envios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigoPostal: cp }) });
      const resultado = await respuesta.json().catch(() => null);
      if (!respuesta.ok) { setOpcionesEnvio([]); setErrorEnvio(resultado?.error ?? "No se pudieron consultar los envíos."); return; }
      const opciones = (resultado?.opciones ?? []) as OpcionEnvio[];
      setOpcionesEnvio(opciones);
      if (!opciones.length) { setErrorEnvio("No hay una tarifa disponible para ese código postal."); return; }
      setShippingMethodId(opciones[0].shipping_method_id); setShippingCost(Number(opciones[0].costo));
    } catch { setOpcionesEnvio([]); setErrorEnvio("No se pudieron consultar los envíos."); } finally { setConsultandoEnvio(false); }
  };

  const seleccionarEnvio = (id: string) => { const opcion = opcionesEnvio.find((item) => item.shipping_method_id === id); setShippingMethodId(id); setShippingCost(opcion ? Number(opcion.costo) : 0); };
  const todosFabricables = items.every((item) => medidas[item.id]?.fabricable === true);
  const totalEstimado = total + shippingCost;

  const manejarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorCotizacion("");
    if (!items.length || enviando) return;
    if (!todosFabricables) { setErrorCotizacion("Completá y calculá las medidas de todos los productos antes de continuar."); return; }
    if (!codigoPostal || !shippingMethodId) { setErrorCotizacion("Ingresá el código postal y seleccioná un método de envío."); return; }
    setEnviando(true);
    try {
      const respuesta = await fetch("/api/ordenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((item) => ({ varianteId: item.varianteId, cantidad: item.cantidad, anchoCm: Number(medidas[item.id].anchoCm.replace(",", ".")), altoCm: Number(medidas[item.id].altoCm.replace(",", ".")) })), notas, codigoPostal: Number(codigoPostal), shippingMethodId, status: "cotizacion" }) });
      const resultado = await respuesta.json().catch(() => null);
      if (respuesta.status === 401) { router.push("/login?redirect=/cotizar"); return; }
      if (!respuesta.ok) { setErrorCotizacion(resultado?.error ?? "Error al enviar la cotización."); return; }
      borrarTodo(); router.push("/cotizar/mis-cotizaciones");
    } catch { setErrorCotizacion("No se pudo enviar la cotización. Intentá nuevamente."); } finally { setEnviando(false); }
  };

  return <div className="cs-section py-14 sm:py-20 lg:py-24">
    <div className="max-w-3xl"><p className="cs-eyebrow">Cotizador</p><h1 className="cs-display mt-3 text-5xl sm:text-6xl">Armá tu proyecto.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[var(--cs-muted)]">Elegí las medidas de cada producto, verificá su fabricación, indicá el destino y obtené una estimación antes de confirmar.</p></div>
    {!items.length ? <div className="cs-card mt-12 p-10 text-center sm:p-16"><p className="cs-eyebrow">Sin productos</p><h2 className="cs-display mt-3 text-3xl">Todavía no hay productos en el cotizador.</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[var(--cs-muted)]">Volvé al catálogo para elegir un sistema y comenzar el proyecto.</p><a href="/#colecciones" className="cs-button mt-7">Ver catálogo</a></div> :
    <form onSubmit={manejarCotizacion} className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="cs-card overflow-hidden"><div className="border-b border-[var(--cs-line)] px-6 py-5 sm:px-8"><p className="cs-eyebrow">01 / Productos</p><h2 className="cs-display mt-2 text-2xl">Configurá cada producto</h2></div><div className="divide-y divide-[var(--cs-line)]">
          {items.map((item, index) => { const estado = medidas[item.id] ?? estadoInicial(); return <article key={item.id} className="px-6 py-7 sm:px-8">
            <div className="flex items-start justify-between gap-5"><div><span className="text-xs text-[var(--cs-muted)]">{String(index + 1).padStart(2, "0")}</span><h3 className="cs-display mt-1 text-2xl">{item.nombre}</h3><p className="mt-1 text-xs text-[var(--cs-muted)]">Cantidad: {item.cantidad} · ${item.precioUnitario.toLocaleString("es-AR")} c/u</p></div><button type="button" onClick={() => borrarItem(item.id)} className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--cs-muted)] hover:text-[var(--cs-danger)]">Quitar</button></div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2"><div><label className="cs-label" htmlFor={`ancho-${item.id}`}>Ancho (cm)</label><input id={`ancho-${item.id}`} inputMode="decimal" value={estado.anchoCm} onChange={(e) => actualizarMedida(item.id, "anchoCm", e.target.value)} className="mt-2 w-full border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]" placeholder="Ej. 180" /></div><div><label className="cs-label" htmlFor={`alto-${item.id}`}>Alto (cm)</label><input id={`alto-${item.id}`} inputMode="decimal" value={estado.altoCm} onChange={(e) => actualizarMedida(item.id, "altoCm", e.target.value)} className="mt-2 w-full border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]" placeholder="Ej. 220" /></div></div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => calcularFabricacion(item.id)} disabled={estado.calculando} className="cs-button disabled:cursor-not-allowed disabled:opacity-40">{estado.calculando ? "Calculando..." : "Verificar fabricación"}</button>{estado.calculado && <div className={`text-xs leading-5 ${estado.fabricable ? "text-[var(--cs-ink)]" : "text-[var(--cs-danger)]"}`}><strong>{estado.fabricable ? "Fabricable" : "No fabricable"}</strong><span className="ml-2 text-[var(--cs-muted)]">{estado.mensaje}</span></div>}</div>
            {estado.fabricable && <div className="mt-4 border-t border-[var(--cs-line)] pt-4 text-xs"><span className="text-[var(--cs-muted)]">Configuración</span><p className="mt-1 font-semibold">{estado.orientacion === "apaisada" ? "Apaisada" : "Normal"}</p></div>}
          </article>; })}
        </div></section>
        <section className="cs-card p-6 sm:p-8"><p className="cs-eyebrow">02 / Observaciones</p><h2 className="cs-display mt-2 text-2xl">Detalles del proyecto</h2><label className="cs-label mt-6" htmlFor="notas">Observaciones</label><textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={2000} className="min-h-32 w-full resize-y border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]" placeholder="Ambientes, instalación, necesidades especiales u otras observaciones..." /></section>
      </div>
      <aside><section className="cs-card p-6 sm:p-7 lg:sticky lg:top-28"><p className="cs-eyebrow">03 / Envío</p><h2 className="cs-display mt-2 text-2xl">Destino</h2><label className="cs-label mt-6" htmlFor="codigoPostal">Código postal</label><div className="mt-2 flex gap-2"><input id="codigoPostal" inputMode="numeric" maxLength={5} value={codigoPostal} onChange={(e) => { setCodigoPostal(e.target.value.replace(/\D/g, "").slice(0, 5)); setErrorEnvio(""); }} className="min-w-0 flex-1 border border-[var(--cs-line)] bg-white p-3 text-sm outline-none focus:border-[var(--cs-gold)]" placeholder="Ej. 1001" /><button type="button" onClick={consultarEnvio} disabled={consultandoEnvio || !codigoPostal} className="cs-button disabled:cursor-not-allowed disabled:opacity-40">{consultandoEnvio ? "Consultando..." : "Calcular"}</button></div>
        {opcionesEnvio.length > 0 && <div className="mt-5 space-y-2"><p className="cs-label">Método de envío</p>{opcionesEnvio.map((opcion) => <label key={opcion.shipping_method_id} className="flex cursor-pointer items-start gap-3 border border-[var(--cs-line)] p-3"><input type="radio" name="shippingMethod" value={opcion.shipping_method_id} checked={shippingMethodId === opcion.shipping_method_id} onChange={() => seleccionarEnvio(opcion.shipping_method_id)} className="mt-1" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3 text-sm font-semibold"><span>{opcion.metodo}</span><span>${Number(opcion.costo).toLocaleString("es-AR")}</span></span><span className="mt-1 block text-xs text-[var(--cs-muted)]">{opcion.descripcion || opcion.proveedor}</span></span></label>)}</div>}
        {errorEnvio && <p className="mt-3 text-xs leading-5 text-[var(--cs-danger)]">{errorEnvio}</p>}
        <div className="mt-7 border-y border-[var(--cs-line)] py-5"><div className="flex items-end justify-between gap-4"><span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Productos</span><strong className="text-sm">${total.toLocaleString("es-AR")}</strong></div><div className="mt-3 flex items-end justify-between gap-4"><span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Envío</span><strong className="text-sm">{shippingCost ? `$${shippingCost.toLocaleString("es-AR")}` : "A calcular"}</strong></div><div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--cs-line)] pt-5"><span className="text-xs uppercase tracking-[.1em] text-[var(--cs-muted)]">Total estimado</span><strong className="cs-display text-3xl">${totalEstimado.toLocaleString("es-AR")}</strong></div></div>
        {errorCotizacion && <p className="mt-4 border border-[var(--cs-danger)]/30 bg-[var(--cs-danger)]/5 p-3 text-xs leading-5 text-[var(--cs-danger)]">{errorCotizacion}</p>}
        <button type="submit" disabled={enviando || !todosFabricables || !shippingMethodId} className="cs-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40">{enviando ? "Enviando..." : "Confirmar cotización"}</button><p className="mt-3 text-center text-xs leading-5 text-[var(--cs-muted)]">Se solicitará iniciar sesión al confirmar. El servidor vuelve a validar precios, fabricación y envío.</p>
      </section></aside>
    </form>}
  </div>;
}

function estadoInicial(): EstadoMedida { return { anchoCm: "", altoCm: "", calculando: false, calculado: false, fabricable: null, mensaje: "", orientacion: null }; }
