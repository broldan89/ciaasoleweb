import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { ESTADOS_VENTA_CONFIRMADA } from "@/lib/estados";

// ---------------------------------------------------------------------
// Tipos mínimos de lo que se lee de cada tabla. Reflejan el esquema
// REAL documentado en ARCHITECTURE.md, no el propuesto en 0004/0005.
// ---------------------------------------------------------------------
interface OrdenFila {
  status: string;
  total: number;
  created_at: string;
}

interface ItemOrdenFila {
  cantidad: number;
  variantes_producto: {
    atributos: Record<string, unknown> | null;
    productos: { nombre: string } | null;
  } | null;
}

interface ProfileFila {
  role: string | null;
  rol_solicitado: string | null;
}

const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function inicioDeMes(offsetMeses = 0) {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() + offsetMeses, 1);
}

// ---------------------------------------------------------------------
// Sección: Pulso comercial
// ---------------------------------------------------------------------
async function cargarPulsoComercial() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("status, total, created_at");

  if (error || !data) {
    return { disponible: false as const, error: error?.message };
  }

  const ordenes = data as OrdenFila[];

  const inicioMesActual = inicioDeMes(0);
  const inicioMesAnterior = inicioDeMes(-1);

  const esVenta = (o: OrdenFila) =>
    (ESTADOS_VENTA_CONFIRMADA as string[]).includes(o.status);

  const ventasMesActual = ordenes.filter(
    (o) => esVenta(o) && new Date(o.created_at) >= inicioMesActual,
  );
  const ventasMesAnterior = ordenes.filter(
    (o) =>
      esVenta(o) &&
      new Date(o.created_at) >= inicioMesAnterior &&
      new Date(o.created_at) < inicioMesActual,
  );

  const facturacionMesActual = ventasMesActual.reduce((acc, o) => acc + o.total, 0);
  const facturacionMesAnterior = ventasMesAnterior.reduce((acc, o) => acc + o.total, 0);

  const totalCotizaciones = ordenes.length;
  const totalVentas = ordenes.filter(esVenta).length;
  const tasaConversion = totalCotizaciones > 0 ? totalVentas / totalCotizaciones : null;

  const ticketPromedio =
    ventasMesActual.length > 0 ? facturacionMesActual / ventasMesActual.length : null;

  const haceSieteDias = new Date();
  haceSieteDias.setDate(haceSieteDias.getDate() - 7);
  const cotizacionesEstancadas = ordenes.filter(
    (o) => o.status === "cotizacion" && new Date(o.created_at) < haceSieteDias,
  ).length;

  return {
    disponible: true as const,
    hayDatos: ordenes.length > 0,
    facturacionMesActual,
    facturacionMesAnterior,
    tasaConversion,
    ticketPromedio,
    cotizacionesEstancadas,
    totalCotizaciones,
  };
}

// ---------------------------------------------------------------------
// Sección: Catálogo y demanda
// ---------------------------------------------------------------------
async function cargarCatalogoYDemanda() {
  const supabase = await createClient();

  const [productosRes, variantesRes, itemsRes] = await Promise.all([
    supabase.from("productos").select("id, is_active"),
    supabase.from("variantes_producto").select("id, is_active"),
    supabase
      .from("items_orden")
      .select("cantidad, variantes_producto(atributos, productos(nombre))"),
  ]);

  if (productosRes.error || variantesRes.error || itemsRes.error) {
    return {
      disponible: false as const,
      error:
        productosRes.error?.message ??
        variantesRes.error?.message ??
        itemsRes.error?.message,
    };
  }

  const productos = productosRes.data ?? [];
  const variantes = variantesRes.data ?? [];
  const items = (itemsRes.data ?? []) as unknown as ItemOrdenFila[];

  const demandaPorProducto = new Map<string, number>();
  for (const item of items) {
    const nombre = item.variantes_producto?.productos?.nombre ?? "Sin identificar";
    demandaPorProducto.set(
      nombre,
      (demandaPorProducto.get(nombre) ?? 0) + item.cantidad,
    );
  }

  const rankingDemanda = [...demandaPorProducto.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    disponible: true as const,
    totalProductos: productos.length,
    productosActivos: productos.filter((p) => p.is_active).length,
    totalVariantes: variantes.length,
    variantesActivas: variantes.filter((v) => v.is_active).length,
    rankingDemanda,
    hayDemanda: items.length > 0,
  };
}

// ---------------------------------------------------------------------
// Sección: Clientes y canal mayorista
// ---------------------------------------------------------------------
async function cargarClientesYCanal() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role, rol_solicitado");

  if (error || !data) {
    return { disponible: false as const, error: error?.message };
  }

  const profiles = data as ProfileFila[];

  const porRol = new Map<string, number>();
  for (const p of profiles) {
    const rol = p.role ?? "sin_rol";
    porRol.set(rol, (porRol.get(rol) ?? 0) + 1);
  }

  const solicitudesPendientes = profiles.filter(
    (p) => p.rol_solicitado && p.rol_solicitado !== p.role,
  ).length;

  return {
    disponible: true as const,
    totalClientes: profiles.length,
    porRol: [...porRol.entries()],
    solicitudesPendientes,
  };
}

export default async function DashboardPage() {
  const [comercial, catalogo, clientes] = await Promise.all([
    cargarPulsoComercial(),
    cargarCatalogoYDemanda(),
    cargarClientesYCanal(),
  ]);

  const variacionFacturacion =
    comercial.disponible && comercial.facturacionMesAnterior > 0
      ? (comercial.facturacionMesActual - comercial.facturacionMesAnterior) /
        comercial.facturacionMesAnterior
      : null;

  return (
    <div className="cs-fade-up mx-auto max-w-[1180px] space-y-12">
      <header className="border-b cs-rule pb-8">
        <p className="cs-eyebrow">Ciao Sole · Resumen general</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="cs-display text-5xl sm:text-6xl">Dashboard.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--cs-muted)]">
              Una lectura del estado comercial y operativo, pensada para decidir
              hacia dónde va la empresa — no solo para mirar números.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-muted)]">
            Vista administrativa
          </span>
        </div>
      </header>

      {/* ---------------- Pulso comercial ---------------- */}
      <section>
        <SectionHeader
          eyebrow="Ventas"
          title="Pulso comercial."
          pregunta="¿Cómo va la venta este mes y hacia dónde va la tendencia?"
        />

        {!comercial.disponible ? (
          <EmptyState mensaje="No se pudo leer la tabla de órdenes todavía." />
        ) : !comercial.hayDatos ? (
          <EmptyState mensaje="Todavía no hay cotizaciones cargadas. En cuanto empiecen a entrar, esta sección va a mostrar facturación, conversión y ticket promedio." />
        ) : (
          <div className="grid gap-px border-x border-b cs-rule bg-[var(--cs-line)] sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Facturación del mes"
              valor={moneda.format(comercial.facturacionMesActual)}
              detalle={
                variacionFacturacion === null
                  ? "Sin mes anterior para comparar"
                  : `${variacionFacturacion >= 0 ? "+" : ""}${(variacionFacturacion * 100).toFixed(0)}% vs. mes anterior`
              }
              acento={variacionFacturacion !== null && variacionFacturacion < 0}
            />
            <MetricTile
              label="Tasa de conversión"
              valor={
                comercial.tasaConversion === null
                  ? "—"
                  : `${(comercial.tasaConversion * 100).toFixed(0)}%`
              }
              detalle="Cotizaciones que terminaron en pago"
            />
            <MetricTile
              label="Ticket promedio"
              valor={
                comercial.ticketPromedio === null ? "—" : moneda.format(comercial.ticketPromedio)
              }
              detalle="Sobre ventas confirmadas este mes"
            />
            <MetricTile
              label="Cotizaciones estancadas"
              valor={String(comercial.cotizacionesEstancadas)}
              detalle="Sin avanzar hace más de 7 días"
              acento={comercial.cotizacionesEstancadas > 0}
            />
          </div>
        )}
      </section>

      {/* ---------------- Salud de producción ---------------- */}
      <section>
        <SectionHeader
          eyebrow="Taller"
          title="Salud de producción."
          pregunta="¿Dónde se traba el taller y qué hay que priorizar hoy?"
        />
        <div className="border border-dashed border-[var(--cs-line)] p-7 text-sm leading-6 text-[var(--cs-muted)]">
          Esta sección se conecta cuando exista la columna{" "}
          <code>orders.production_status</code> y la tabla{" "}
          <code>production_events</code> propuestas en{" "}
          <code>supabase/migrations/0005_dashboard_metricas.sql</code>. Ahí se
          va a poder ver cuántas órdenes hay en cada etapa de taller, el
          tiempo promedio en cada una y cuáles están estancadas — antes de
          eso mostrar números acá sería inventar datos.
          <div className="mt-5">
            <Link href="/admin/taller" className="cs-button cs-button-secondary">
              Ver cola de producción actual
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Catálogo y demanda ---------------- */}
      <section>
        <SectionHeader
          eyebrow="Catálogo"
          title="Catálogo y demanda."
          pregunta="¿Qué se vende, qué no, y qué precio conviene ajustar?"
        />

        {!catalogo.disponible ? (
          <EmptyState mensaje="No se pudo leer el catálogo todavía." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <div className="grid grid-cols-2 gap-px border cs-rule bg-[var(--cs-line)]">
              <MetricTile
                label="Productos activos"
                valor={`${catalogo.productosActivos} / ${catalogo.totalProductos}`}
                detalle="Publicados sobre el total cargado"
              />
              <MetricTile
                label="Variantes activas"
                valor={`${catalogo.variantesActivas} / ${catalogo.totalVariantes}`}
                detalle="Combinaciones de tela/color disponibles"
              />
            </div>

            <div className="cs-card p-6">
              <p className="cs-eyebrow">Más cotizados</p>
              {!catalogo.hayDemanda ? (
                <p className="mt-3 text-sm text-[var(--cs-muted)]">
                  Todavía no hay ítems de cotización cargados para armar un
                  ranking real de demanda.
                </p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {catalogo.rankingDemanda.map(([nombre, cantidad], i) => (
                    <li key={nombre} className="flex items-center justify-between gap-4 border-b cs-rule pb-3 last:border-0 last:pb-0">
                      <span className="text-sm">
                        <span className="mr-2 text-[var(--cs-muted)]">{i + 1}.</span>
                        {nombre}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[.08em] text-[var(--cs-muted)]">
                        {cantidad} un.
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ---------------- Clientes y canal mayorista ---------------- */}
      <section>
        <SectionHeader
          eyebrow="Clientes"
          title="Clientes y canal mayorista."
          pregunta="¿Quién compra, cuánto, y a quién conviene habilitar como revendedor?"
        />

        {!clientes.disponible ? (
          <EmptyState mensaje="No se pudo leer la tabla de perfiles todavía." />
        ) : (
          <div className="grid gap-px border-x border-b cs-rule bg-[var(--cs-line)] sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Usuarios totales"
              valor={String(clientes.totalClientes)}
              detalle="Cuentas registradas"
            />
            {clientes.porRol.map(([rol, cantidad]) => (
              <MetricTile key={rol} label={`Rol: ${rol}`} valor={String(cantidad)} detalle="Cuentas activas" />
            ))}
            <MetricTile
              label="Solicitudes pendientes"
              valor={String(clientes.solicitudesPendientes)}
              detalle="Piden un rol distinto al actual"
              acento={clientes.solicitudesPendientes > 0}
            />
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------
// Componentes de presentación
// ---------------------------------------------------------------------
function SectionHeader({
  eyebrow,
  title,
  pregunta,
}: {
  eyebrow: string;
  title: string;
  pregunta: string;
}) {
  return (
    <div className="mb-5">
      <p className="cs-eyebrow">{eyebrow}</p>
      <h2 className="cs-display mt-2 text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-[var(--cs-muted)]">{pregunta}</p>
    </div>
  );
}

function MetricTile({
  label,
  valor,
  detalle,
  acento,
}: {
  label: string;
  valor: string;
  detalle: string;
  acento?: boolean;
}) {
  return (
    <div className="bg-[var(--cs-white)] p-6 sm:p-7">
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[var(--cs-muted)]">
        {label}
      </p>
      <p
        className={`cs-display mt-4 text-4xl sm:text-5xl ${
          acento ? "text-[var(--cs-gold-dark)]" : ""
        }`}
      >
        {valor}
      </p>
      <p className="mt-2 text-xs text-[var(--cs-muted)]">{detalle}</p>
    </div>
  );
}

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="border border-dashed border-[var(--cs-line)] p-7 text-sm leading-6 text-[var(--cs-muted)]">
      {mensaje}
    </div>
  );
}
