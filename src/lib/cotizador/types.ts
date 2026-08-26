export type Role = "cliente" | "revendedor" | "admin";

export type MedidaCliente = {
  anchoMm: number;
  altoMm: number;
};

export type MedidasFabricacion = {
  tela: {
    anchoMm: number;
    altoMm: number;
  };
  cano: {
    anchoMm: number;
  };
  perfilContrapeso: {
    anchoMm: number;
  };
};

export type Tela = {
  id: string;
  nombre: string;
  anchoFabricaMm: number;
  apaisable: boolean;
};

export type OrientacionTela = "normal" | "apaisada";

export type ResultadoConsumo =
  | {
      fabricable: true;
      metrosLineales: number;
      orientacion: OrientacionTela;
    }
  | {
      fabricable: false;
      metrosLineales: 0;
      orientacion: null;
      motivo: string;
    };

export type ResultadoPrecio = {
  costo: number;
  margenBase: number;
  margenComercial: number;
  precioFinal: number;
};