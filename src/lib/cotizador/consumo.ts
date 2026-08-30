import type {
  MedidasFabricacion,
  ResultadoConsumo,
  Tela,
} from "./types";

export function calcularConsumoTela(
  fabricacion: MedidasFabricacion,
  tela: Tela,
): ResultadoConsumo {
  const ancho = fabricacion.tela.anchoCm;
  const alto = fabricacion.tela.altoCm;
  const anchoFabrica = tela.anchoFabricaCm;

  if (
    !Number.isFinite(ancho) ||
    !Number.isFinite(alto) ||
    !Number.isFinite(anchoFabrica) ||
    ancho <= 0 ||
    alto <= 0 ||
    anchoFabrica <= 0
  ) {
    return {
      fabricable: false,
      metrosLineales: 0,
      orientacion: null,
      motivo: "Las medidas de fabricación o el ancho de fábrica no son válidos.",
    };
  }

  // Orientación normal:
  // el ancho de fabricación debe entrar en el ancho de fábrica.
  if (ancho <= anchoFabrica) {
    return {
      fabricable: true,
      metrosLineales: alto / 100,
      orientacion: "normal",
    };
  }

  // Orientación apaisada:
  // solamente se permite si la tela está marcada como apaisable.
  if (tela.apaisable && alto <= anchoFabrica) {
    return {
      fabricable: true,
      metrosLineales: ancho / 100,
      orientacion: "apaisada",
    };
  }

  /*
   * REGLA PENDIENTE DE DEFINICIÓN
   *
   * Todavía no tenemos confirmación de qué debe ocurrir cuando:
   *
   * - la tela no es apaisable y no entra en orientación normal, o
   * - ninguna de las dos orientaciones simples permite fabricar la pieza.
   *
   * No inventamos una fórmula para orientaciones o cortes
   * más complejos hasta contar con la información de fabricación.
   */

  return {
    fabricable: false,
    metrosLineales: 0,
    orientacion: null,
    motivo:
      "La medida de fabricación no entra en una orientación de tela validada.",
  };
}