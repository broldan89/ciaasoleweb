export type Role = "cliente" | "mayorista" | "admin";

export type MedidaCliente = {
  anchoCm: number;
  altoCm: number;
};

export type MedidasFabricacion = {
  tela: {
    anchoCm: number;
    altoCm: number;
  };
  cano: {
    anchoCm: number;
  };
  perfilContrapeso: {
    anchoCm: number;
  };
};

export type Tela = {
  id: string;
  nombre: string;
  anchoFabricaCm: number;
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