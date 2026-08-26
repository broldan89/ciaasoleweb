import type {
  MedidasFabricacion,
  ResultadoConsumo,
  Tela,
} from "./types";

export function calcularConsumoTela(
  fabricacion: MedidasFabricacion,
  tela: Tela,
): ResultadoConsumo {
  const ancho = fabricacion.tela.anchoMm;
  const alto = fabricacion.tela.altoMm;
  const anchoFabrica = tela.anchoFabricaMm;

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

  /*
   * ORIENTACIÓN NORMAL
   *
   * El ancho de fabricación debe entrar dentro
   * del ancho estándar de la tela.
   */
  if (ancho <= anchoFabrica) {
    return {
      fabricable: true,
      metrosLineales: alto / 1000,
      orientacion: "normal",
    };
  }

  /*
   * ORIENTACIÓN APAISADA
   *
   * Solo se evalúa si la tela permite apaisabilidad.
   *
   * En esta primera versión:
   *
   * - no se calcula optimización avanzada;
   * - no se compara desperdicio;
   * - no se evalúan múltiples paños;
   * - simplemente se comprueba si la pieza puede entrar
   *   girando 90°.
   */
  if (tela.apaisable && alto <= anchoFabrica) {
    return {
      fabricable: true,
      metrosLineales: ancho / 1000,
      orientacion: "apaisada",
    };
  }

  /*
   * REGLA PENDIENTE DE DEFINICIÓN
   *
   * Todavía no tenemos confirmación de:
   *
   * - qué ocurre cuando una tela no apaisable no entra;
   * - qué ocurre cuando ninguna orientación simple permite fabricar;
   * - cómo se calcula el consumo cuando existen cortes
   *   o distribuciones más complejas;
   * - cómo se aprovechan sobrantes;
   * - cómo se optimiza el desperdicio entre diferentes
   *   posibilidades de corte.
   *
   * Por lo tanto, no inventamos una fórmula.
   */

  return {
    fabricable: false,
    metrosLineales: 0,
    orientacion: null,
    motivo:
      "La medida de fabricación no entra en una orientación de tela validada.",
  };
}