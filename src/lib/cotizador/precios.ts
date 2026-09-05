import type { Role, ResultadoPrecio } from "./types";

const MARGEN_BASE = 0.35;
const MARGEN_COMERCIAL_PUBLICO = 0.30;

export function calcularPrecio(
  costo: number,
  role: Role,
): ResultadoPrecio {
  if (!Number.isFinite(costo) || costo < 0) {
    throw new Error("El costo debe ser un número válido.");
  }

  const precioConMargenBase = costo * (1 + MARGEN_BASE);

  if (role === "mayorista") {
    return {
      costo,
      margenBase: MARGEN_BASE,
      margenComercial: 0,
      precioFinal: precioConMargenBase,
    };
  }

  const precioFinal =
    precioConMargenBase * (1 + MARGEN_COMERCIAL_PUBLICO);

  return {
    costo,
    margenBase: MARGEN_BASE,
    margenComercial: MARGEN_COMERCIAL_PUBLICO,
    precioFinal,
  };
}