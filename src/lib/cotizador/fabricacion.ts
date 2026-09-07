import type {
  MedidaCliente,
  MedidasFabricacion,
} from "./types";

/**
 * Reglas actuales de fabricación del Roller.
 *
 * Estos valores están centralizados deliberadamente porque todavía deben
 * validarse contra la ficha técnica definitiva de producción. No deberían
 * quedar repartidos dentro del motor de consumo.
 */
export const REGLAS_FABRICACION_ROLLER = {
  descuentoAnchoTelaCm: 3,
  adicionalAltoTelaCm: 30,
  descuentoAnchoCanoCm: 2.5,
} as const;

export function calcularMedidasFabricacion(
  medida: MedidaCliente,
): MedidasFabricacion {
  const { anchoCm, altoCm } = medida;

  if (
    !Number.isFinite(anchoCm) ||
    !Number.isFinite(altoCm) ||
    anchoCm <= 0 ||
    altoCm <= 0
  ) {
    throw new Error(
      "Las medidas del cliente deben ser mayores a cero.",
    );
  }

  const anchoTela =
    anchoCm - REGLAS_FABRICACION_ROLLER.descuentoAnchoTelaCm;

  const altoTela =
    altoCm + REGLAS_FABRICACION_ROLLER.adicionalAltoTelaCm;

  const anchoCano =
    anchoCm - REGLAS_FABRICACION_ROLLER.descuentoAnchoCanoCm;

  if (anchoTela <= 0 || anchoCano <= 0) {
    throw new Error(
      "La medida ingresada no permite obtener medidas válidas de fabricación.",
    );
  }

  return {
    tela: {
      anchoCm: anchoTela,
      altoCm: altoTela,
    },
    cano: {
      anchoCm: anchoCano,
    },
    perfilContrapeso: {
      anchoCm: anchoTela,
    },
  };
}
