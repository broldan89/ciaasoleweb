"use client";
import { useCarrito } from "@/context/CarritoContext";

interface AgregarCarritoProps {
  varianteId: string;
  nombre: string;
  precio: number;
}

export default function AgregarCarrito({
  varianteId,
  nombre,
  precio,
}: AgregarCarritoProps) {
  const { agregarItem } = useCarrito();

  const manejarClick = () => {
    agregarItem({
      varianteId,
      nombre,
      cantidad: 1,
      precioUnitario: precio,
      total: precio,
    });
  };

  return (
    <button
      onClick={manejarClick}
      className="bg-yellow-400 text-black font-bold px-4 py-2 rounded mt-2"
    >
      Agregar al carrito
    </button>
  );
}
