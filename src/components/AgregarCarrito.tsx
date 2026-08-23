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
      varianteId,
      nombre,
      cantidad: 1,
      precioUnitario: precio,
      total: precio,
    });
  };

  return (
    <button
      type="button"
      onClick={handleAgregar}
      className="inline-flex min-h-10 items-center justify-center border border-[var(--cs-ink)] bg-[var(--cs-ink)] px-4 text-[10px] font-bold uppercase tracking-[.12em] text-white transition-colors hover:border-[var(--cs-gold-dark)] hover:bg-[var(--cs-gold-dark)]"
    >
      Agregar
    </button>
  );
}
