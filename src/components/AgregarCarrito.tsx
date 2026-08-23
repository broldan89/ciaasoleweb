"use client";
import { useCarrito } from "@/context/CarritoContext";

export default function AgregarCarrito({
  varianteId,
  nombre,
  precio,
}: {
  varianteId: string;
  nombre: string;
  precio: number;
}) {
  const { agregarItem } = useCarrito();

  const handleAgregar = () => {
    agregarItem({
      varianteId: varianteId,
      nombre: nombre,
      cantidad: 1,
      precioUnitario: precio,
      total: precio, // O calculado según tu lógica (precio * cantidad)
    });
  };

  return (
    <button
      onClick={handleAgregar}
      className="px-4 py-1.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-700 transition-colors duration-200 rounded-none"
    >
      Agregar
    </button>
  );
}
