"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCarrito } from "@/context/CarritoContext";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCarrito();
  const [usuario, setUsuario] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  const manejarCerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    router.push("/");
  };

  const esAdmin = usuario?.user_metadata?.rol === "admin";
  const esMayorista = usuario?.user_metadata?.rol === "mayorista";

  return (
    <div className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <Link href="/" className="text-2xl font-bold tracking-widest">
        CIAO SOLE
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={`hover:text-yellow-400 transition-colors ${pathname === "/" ? "text-yellow-400" : ""}`}
        >
          Catálogo
        </Link>

        <Link
          href="/cotizar"
          className={`hover:text-yellow-400 transition-colors ${pathname === "/cotizar" ? "text-yellow-400" : ""}`}
        >
          Carrito ({items.length})
        </Link>

        {usuario && (
          <Link
            href="/mis-cotizaciones"
            className={`hover:text-yellow-400 transition-colors ${pathname === "/mis-cotizaciones" ? "text-yellow-400" : ""}`}
          >
            Mis Cotizaciones
          </Link>
        )}

        {esAdmin && (
          <Link
            href="/admin/dashboard"
            className={`hover:text-yellow-400 transition-colors ${pathname === "/admin/dashboard" ? "text-yellow-400" : ""}`}
          >
            Panel Admin
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {usuario ? (
          <>
            <span className="text-sm text-gray-400">
              {esMayorista ? "Mayorista" : "Cliente"}
            </span>
            <button
              onClick={manejarCerrarSesion}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="hover:text-yellow-400 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="hover:text-yellow-400 transition-colors"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
