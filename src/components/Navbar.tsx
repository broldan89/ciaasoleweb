"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  const cargarPerfil = async (userId: string) => {
    const { data: perfil, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener el rol del usuario:", error);
      setRole(null);
      return;
    }

    setRole(perfil?.role ?? null);
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        await cargarPerfil(user.id);
      } else {
        setRole(null);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        await cargarPerfil(currentUser.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setRole(null);

    router.push("/login");
  };

  return (
    <nav className="border-b p-4 flex justify-between items-center bg-black text-white">
      <Link href="/" className="font-bold text-xl">
        CIAO SOLE
      </Link>

      <div className="flex gap-4">
        {user && <Link href="/cotizar/mis-cotizaciones">Mis Cotizaciones</Link>}

        {role === "admin" && <Link href="/admin/dashboard">Panel Admin</Link>}
      </div>

      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <span className="text-gray-400">{user.email}</span>

            <button onClick={handleLogout} className="text-red-500">
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
}
