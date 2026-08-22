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
  const [rol, setRol] = useState<string | null>(null);

  const cargarPerfil = async (usuarioId: string) => {
    // El rol real vive en `profiles`, no en user_metadata (ese campo lo
    // puede editar el propio usuario desde el navegador). RLS permite
    // que cada usuario lea únicamente su propia fila acá.
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", usuarioId)
      .single();
    setRol(perfil?.role ?? null);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
      if (data.user) cargarPerfil(data.user.id);
    });

    // Antes solo se chequeaba la sesión una vez al montar el componente.
    // Como el login navega con router.push (sin recargar la página), el
    // navbar se quedaba mostrando "Login/Registrarse" aunque el login
    // hubiera funcionado. Este listener reacciona a cada cambio real de
    // sesión (login, logout, refresh de token).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
      if (session?.user) {
        cargarPerfil(session.user.id);
      } else {
        setRol(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const manejarCerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setRol(null);
    router.push("/");
  };

  const esAdmin = rol === "admin";
  const esMayorista = rol === "mayorista";

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
            href="/cotizar/mis-cotizaciones"
            className={`hover:text-yellow-400 transition-colors ${pathname === "/cotizar/mis-cotizaciones" ? "text-yellow-400" : ""}`}
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
              {esAdmin ? "Admin" : esMayorista ? "Mayorista" : "Cliente"}
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
