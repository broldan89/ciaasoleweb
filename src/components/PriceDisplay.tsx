"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface PriceDisplayProps {
  precioPublico: number;
  precioMayorista: number;
}

export default function PriceDisplay({
  precioPublico,
  precioMayorista,
}: PriceDisplayProps) {
  const [usuario, setUsuario] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  const esMayorista = usuario?.user_metadata?.rol === "mayorista";
  const precio = esMayorista ? precioMayorista : precioPublico;

  return (
    <div className="mt-4">
      <span className="text-2xl font-bold">${precio}</span>
      {esMayorista && (
        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          Precio mayorista
        </span>
      )}
    </div>
  );
}
