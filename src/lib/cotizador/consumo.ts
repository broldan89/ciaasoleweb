import type {
  EvaluacionOrientacion,
  MedidasFabricacion,
  ResultadoConsumo,
  Tela,
} from "./types";

function evaluarOrientacion(
  orientacion: "normal" | "apaisada",
  anchoCm: number,
  altoCm: number,
  anchoFabricaCm: number,
): EvaluacionOrientacion {
  const anchoRequeridoCm =
    orientacion === "normal" ? anchoCm : altoCm;
  const largoRequeridoCm =
    orientacion === "normal" ? altoCm : anchoCm;
  const metrosLineales = largoRequeridoCm / 100;
  const entra = anchoRequeridoCm <= anchoFabricaCm;

  return {
    orientacion,
    entra,
    anchoRequeridoCm,
    largoRequeridoCm,
    metrosLineales,
    ...(entra
      ? {}
      : {
          motivo: `Necesita ${anchoRequeridoCm.toLocaleString("es-AR", {
            maximumFractionDigits: 2,
          })} cm de ancho y la tela dispone de ${anchoFabricaCm.toLocaleString(
            "es-AR",
            { maximumFractionDigits: 2 },
          )} cm.`,
        }),
  };
}

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
      motivo:
        "Las medidas de fabricación o el ancho de fábrica no son válidos.",
      evaluaciones: [],
    };
  }

  const evaluaciones: EvaluacionOrientacion[] = [
    evaluarOrientacion("normal", ancho, alto, anchoFabrica),
  ];

  if (tela.apaisable) {
    evaluaciones.push(
      evaluarOrientacion("apaisada", ancho, alto, anchoFabrica),
    );
  }

  const validas = evaluaciones.filter(
    (evaluacion) => evaluacion.entra,
  );

  if (!validas.length) {
    return {
      fabricable: false,
      metrosLineales: 0,
      orientacion: null,
      motivo: tela.apaisable
        ? "La medida no entra ni en orientación normal ni en orientación apaisada para el ancho disponible de la tela."
        : "La medida supera el ancho disponible de la tela y la tela no admite fabricación apaisada.",
      evaluaciones,
    };
  }

  const mejor = validas.reduce((actual, candidato) => {
    if (candidato.metrosLineales < actual.metrosLineales) {
      return candidato;
    }

    return actual;
  });

  return {
    fabricable: true,
    metrosLineales: mejor.metrosLineales,
    orientacion: mejor.orientacion,
    evaluaciones,
  };
}
