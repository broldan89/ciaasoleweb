import type {
  MedidaCliente,
  MedidasFabricacion,
} from "./types";

const DESCUENTO_ANCHO_TELA_CM = 3;
const ADICIONAL_ALTO_TELA_CM = 30;
const DESCUENTO_ANCHO_CANO_CM = 2.5;

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
    anchoCm - DESCUENTO_ANCHO_TELA_CM;

  const altoTela =
    altoCm + ADICIONAL_ALTO_TELA_CM;

  const anchoCano =
    anchoCm - DESCUENTO_ANCHO_CANO_CM;

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