// Estados del pipeline COMERCIAL de una orden (columna orders.status).
// Ver supabase/migrations/0005_dashboard_metricas.sql para el detalle
// de por qué está separado del pipeline de producción.
export const ESTADOS_COMERCIALES = [
  { key: "cotizacion", label: "Cotización" },
  { key: "pendiente_pago", label: "Pendiente de pago" },
  { key: "pagada", label: "Pagada" },
  { key: "cancelada", label: "Cancelada" },
  { key: "facturada", label: "Facturada" },
] as const;

export type EstadoComercial = (typeof ESTADOS_COMERCIALES)[number]["key"];

// Estados a partir de los cuales una orden ya se considera venta real
// (para calcular facturación, ticket promedio, etc.).
export const ESTADOS_VENTA_CONFIRMADA: EstadoComercial[] = ["pagada", "facturada"];

// Estados del pipeline de PRODUCCIÓN (columna orders.production_status).
// Solo aplica a órdenes que ya están en estado comercial "pagada".
export const ETAPAS_PRODUCCION = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_preparacion", label: "Preparación" },
  { key: "en_produccion", label: "Producción" },
  { key: "control_calidad", label: "Control de calidad" },
  { key: "lista_despacho", label: "Lista para despacho" },
  { key: "entregada", label: "Entregada" },
] as const;

export type EtapaProduccion = (typeof ETAPAS_PRODUCCION)[number]["key"];
