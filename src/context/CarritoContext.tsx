"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface ItemCarrito {
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface CarritoContextType {
  items: ItemCarrito[];
  agregarItem: (item: ItemCarrito) => void;
  borrarItem: (varianteId: string) => void;
  borrarTodo: () => void;
  total: number;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  const agregarItem = (item: ItemCarrito) => {
    const existe = items.find((i) => i.varianteId === item.varianteId);
    if (existe) {
      setItems(
        items.map((i) =>
          i.varianteId === item.varianteId
            ? {
                ...i,
                cantidad: i.cantidad + item.cantidad,
                total: (i.cantidad + item.cantidad) * i.precioUnitario,
              }
            : i,
        ),
      );
    } else {
      setItems([...items, item]);
    }
  };

  const borrarItem = (varianteId: string) => {
    setItems(items.filter((i) => i.varianteId !== varianteId));
  };

  const borrarTodo = () => {
    setItems([]);
  };

  const total = items.reduce((acc, item) => acc + item.total, 0);

  return (
    <CarritoContext.Provider
      value={{ items, agregarItem, borrarItem, borrarTodo, total }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    return {
      items: [],
      agregarItem: () => {},
      borrarItem: () => {},
      borrarTodo: () => {},
      total: 0,
    };
  }
  return context;
}
