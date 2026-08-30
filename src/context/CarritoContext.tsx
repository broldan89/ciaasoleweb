"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface ItemCarrito {
  id: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface CarritoContextType {
  items: ItemCarrito[];
  agregarItem: (item: Omit<ItemCarrito, "id">) => void;
  borrarItem: (id: string) => void;
  borrarTodo: () => void;
  total: number;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  const agregarItem = (item: Omit<ItemCarrito, "id">) => {
    const nuevoId = crypto.randomUUID();

    setItems((actuales) => [
      ...actuales,
      {
        ...item,
        id: nuevoId,
      },
    ]);
  };

  const borrarItem = (id: string) => {
    setItems((actuales) => actuales.filter((item) => item.id !== id));
  };

  const borrarTodo = () => {
    setItems([]);
  };

  const total = items.reduce((acc, item) => acc + item.total, 0);

  return (
    <CarritoContext.Provider
      value={{
        items,
        agregarItem,
        borrarItem,
        borrarTodo,
        total,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);

  if (!context) {
    throw new Error("useCarrito debe utilizarse dentro de un CarritoProvider.");
  }

  return context;
}
