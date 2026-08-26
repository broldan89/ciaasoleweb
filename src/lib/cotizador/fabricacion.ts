import type {
  MedidaCliente,
  MedidasFabricacion,
} from "./types";

/**
 * Reglas actuales de fabricación.
 *
 * El motor trabaja exclusivamente en milímetros.
 *
 * Estas reglas representan la lógica actualmente confirmada:
 *
 * - Tela: descuento de 30 mm en ancho.
 * - Tela: adicional de 300 mm en alto.
 * - Caño: descuento de 25 mm en ancho.
 *
 * Cualquier regla adicional de fabricación que todavía no haya
 * sido confirmada debe incorporarse posteriormente.
 */

const DESCUENTO_ANCHO_TELA_MM = 30;
const ADICIONAL_ALTO_TELA_MM = 300;

const DESCUENTO_ANCHO_CANO_MM = 25;

export function calcularMedidasFabricacion(
  medida: MedidaCliente,
): MedidasFabricacion {
  const { anchoMm, altoMm } = medida;

  if (
    !Number.isFinite(anchoMm) ||
    !Number.isFinite(altoMm) ||
    anchoMm <= 0 ||
    altoMm <= 0
  ) {
    throw new Error(
      "Las medidas del cliente deben ser números mayores a cero.",
    );
  }

  const anchoTela = anchoMm - DESCUENTO_ANCHO_TELA_MM;
  const altoTela = altoMm + ADICIONAL_ALTO_TELA_MM;

  const anchoCano = anchoMm - DESCUENTO_ANCHO_CANO_MM;

  if (anchoTela <= 0 || anchoCano <= 0) {
    throw new Error(
      "La medida ingresada no permite obtener medidas válidas de fabricación.",
    );
  }

  return {
    tela: {
      anchoMm: anchoTela,
      altoMm: altoTela,
    },
    cano: {
      anchoMm: anchoCano,
    },
    perfilContrapeso: {
      anchoMm: anchoTela,
    },
  };
}