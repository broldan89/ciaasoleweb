"use client";

const productos = [
  {
    id: "01",
    nombre: "Sistema Roller Individual",
    tela: "Screen 3% White",
    categoria: "Roller",
    precio: "$98 / m²",
  },
  {
    id: "02",
    nombre: "Sistema Roller Doble",
    tela: "Blackout Premium + Screen 5%",
    categoria: "Roller",
    precio: "$165 / m²",
  },
  {
    id: "03",
    nombre: "Banda Vertical",
    tela: "Sunscreen Linen",
    categoria: "Vertical",
    precio: "$110 / m²",
  },
];

export default function ProductosPage() {
  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-col justify-between gap-6 border-b border-[var(--cs-line)] pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="cs-eyebrow">Catálogo · Control solar</p>
          <h1 className="cs-display mt-3 text-5xl sm:text-6xl">Productos.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--cs-muted)]">
            Colecciones, sistemas y configuraciones disponibles para cotizar.
          </p>
        </div>
        <button className="cs-button">+ Nuevo producto</button>
      </header>

      <div className="mt-10 grid gap-px border border-[var(--cs-line)] bg-[var(--cs-line)] md:grid-cols-2 xl:grid-cols-3">
        {productos.map((producto) => (
          <article key={producto.id} className="group flex min-h-[300px] flex-col justify-between bg-[var(--cs-white)] p-7 transition-colors hover:bg-[var(--cs-ivory)] sm:p-8">
            <div>
              <div className="flex items-start justify-between gap-5">
                <span className="text-xs text-[var(--cs-muted)]">{producto.id}</span>
                <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[var(--cs-gold-dark)]">
                  {producto.categoria}
                </span>
              </div>
              <h2 className="cs-display mt-8 text-3xl leading-tight">{producto.nombre}</h2>
              <p className="mt-3 text-sm text-[var(--cs-muted)]">{producto.tela}</p>
            </div>

            <div className="mt-10 flex items-end justify-between border-t border-[var(--cs-line)] pt-5">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]">Precio sugerido</span>
                <strong className="cs-display text-2xl">{producto.precio}</strong>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-charcoal)] underline decoration-[var(--cs-gold)] underline-offset-4">
                Editar
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 border border-dashed border-[var(--cs-line)] p-7 text-sm text-[var(--cs-muted)]">
        Esta vista conserva datos de demostración. La conexión definitiva al
        catálogo real se hará contra <code>productos</code> y
        <code>variantes_producto</code>, que son los nombres actualmente vigentes en Supabase.
      </div>
    </div>
  );
}
