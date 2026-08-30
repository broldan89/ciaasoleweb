import { createClient } from "@/lib/supabase-server";
import PriceDisplay from "@/components/PriceDisplay";
import AgregarCarrito from "@/components/AgregarCarrito";

interface Variante {
  id: string;
  producto_id: string;
  atributos: Record<string, string>;
  precio_publico: number;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  variantes: Variante[];
}

interface ProductoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface VarianteRow {
  id: string;
  producto_id: string;
  atributos: Record<string, string>;
  precio_publico: number;
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let esMayorista = false;

  if (user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    esMayorista = perfil?.role === "mayorista" || perfil?.role === "admin";
  }

  const [
    { data: productosData, error: errorProductos },
    { data: variantesData, error: errorVariantes },
  ] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, descripcion")
      .eq("is_active", true)
      .order("nombre")
      .returns<ProductoRow[]>(),

    supabase
      .from("variantes_producto")
      .select("id, producto_id, atributos, precio_publico")
      .eq("is_active", true)
      .returns<VarianteRow[]>(),
  ]);

  const error = errorProductos || errorVariantes;

  const productos: Producto[] =
    productosData?.map((producto) => ({
      ...producto,
      variantes:
        variantesData?.filter(
          (variante) => variante.producto_id === producto.id,
        ) ?? [],
    })) ?? [];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--cs-line)] bg-[var(--cs-ivory)]">
        <div className="cs-section grid min-h-[620px] items-center gap-12 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <div className="cs-fade-up max-w-2xl">
            <p className="cs-eyebrow mb-6">
              Cortinados · Control solar · A medida
            </p>

            <h1 className="cs-display text-5xl leading-[.98] sm:text-6xl lg:text-7xl">
              La luz también se diseña.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[var(--cs-muted)] sm:text-lg">
              Sistemas de cortinas y control solar pensados para cada espacio,
              con asesoramiento, medidas y cotización en un mismo lugar.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#colecciones" className="cs-button">
                Explorar colecciones
              </a>

              <a href="/cotizar" className="cs-button cs-button-secondary">
                Solicitar cotización
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[420px] lg:block">
            <div className="absolute inset-8 border border-[var(--cs-line)]" />
            <div className="absolute right-0 top-0 h-3/4 w-3/4 bg-[var(--cs-sand)]" />
            <div className="absolute bottom-0 left-0 h-3/4 w-3/4 border border-[var(--cs-gold)] bg-[var(--cs-paper)]" />
            <div className="absolute inset-x-20 top-1/2 h-px bg-[var(--cs-gold)]" />

            <div className="absolute bottom-16 left-16 max-w-[210px] bg-[var(--cs-ink)] p-6 text-white">
              <p className="cs-eyebrow !text-[var(--cs-gold)]">Ciao Sole</p>

              <p className="cs-display mt-3 text-2xl">
                Precisión para habitar mejor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="colecciones" className="cs-section py-20 lg:py-28">
        <div className="mb-12 max-w-2xl">
          <p className="cs-eyebrow">Colecciones</p>

          <h2 className="cs-display mt-3 text-4xl sm:text-5xl">
            Sistemas que combinan función y arquitectura.
          </h2>

          <p className="mt-5 leading-7 text-[var(--cs-muted)]">
            Elegí un sistema, explorá sus variantes y agregá las opciones que
            quieras a tu solicitud de cotización.
          </p>
        </div>

        {error ? (
          <div className="cs-card p-8 text-sm text-[var(--cs-danger)]">
            No pudimos cargar el catálogo en este momento.
          </div>
        ) : productos.length ? (
          <div className="grid gap-px border border-[var(--cs-line)] bg-[var(--cs-line)] md:grid-cols-2">
            {productos.map((producto, index) => (
              <article
                key={producto.id}
                className="group bg-[var(--cs-white)] p-7 transition-colors hover:bg-[var(--cs-ivory)] sm:p-9"
              >
                <div className="mb-10 flex items-start justify-between gap-6">
                  <div>
                    <span className="text-xs text-[var(--cs-muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <h3 className="cs-display mt-2 text-3xl">
                      {producto.nombre}
                    </h3>
                  </div>

                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--cs-gold)]" />
                </div>

                <p className="min-h-14 max-w-lg text-sm leading-6 text-[var(--cs-muted)]">
                  {producto.descripcion ||
                    "Sistema de control solar diseñado para proyectos residenciales y profesionales."}
                </p>

                {producto.variantes.length ? (
                  <div className="mt-8 divide-y divide-[var(--cs-line)] border-y border-[var(--cs-line)]">
                    {producto.variantes.map((variante) => (
                      <VarianteRow
                        key={variante.id}
                        variante={variante}
                        nombreProducto={producto.nombre}
                        esMayorista={esMayorista}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 border-y border-[var(--cs-line)] py-5 text-xs text-[var(--cs-muted)]">
                    No hay variantes disponibles.
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="cs-card p-10 text-center text-sm text-[var(--cs-muted)]">
            El catálogo todavía no tiene productos publicados.
          </div>
        )}
      </section>

      <section className="border-y border-[var(--cs-line)] bg-[var(--cs-ink)] text-white">
        <div className="cs-section grid gap-10 py-16 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="cs-eyebrow !text-[var(--cs-gold)]">
              Proyecto a medida
            </p>

            <h2 className="cs-display mt-3 max-w-3xl text-4xl sm:text-5xl">
              Del primer dato a la instalación.
            </h2>

            <p className="mt-5 max-w-2xl leading-7 text-white/60">
              La plataforma centraliza catálogo, precios por perfil,
              cotizaciones y órdenes de trabajo para que cada proyecto avance
              con información precisa.
            </p>
          </div>

          <a
            href="/cotizar"
            className="cs-button border-white bg-white text-[var(--cs-ink)] hover:border-[var(--cs-gold)] hover:bg-[var(--cs-gold)]"
          >
            Empezar proyecto
          </a>
        </div>
      </section>
    </div>
  );
}

async function VarianteRow({
  variante,
  nombreProducto,
  esMayorista,
}: {
  variante: Variante;
  nombreProducto: string;
  esMayorista: boolean;
}) {
  const supabase = await createClient();

  const { data: precio, error } = await supabase.rpc(
    "obtener_precio_variante",
    {
      p_variante_id: variante.id,
    },
  );

  const precioFinal =
    !error && precio != null ? Number(precio) : Number(variante.precio_publico);

  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[.08em] text-[var(--cs-charcoal)]">
          {Object.entries(variante.atributos || {})
            .map(([key, value]) => `${key}: ${value}`)
            .join(" · ") || "Configuración estándar"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <PriceDisplay precio={precioFinal} esMayorista={esMayorista} />

        <AgregarCarrito
          varianteId={variante.id}
          nombre={nombreProducto}
          precio={precioFinal}
        />
      </div>
    </div>
  );
}
