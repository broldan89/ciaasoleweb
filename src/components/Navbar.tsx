"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [rol, setRol] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: perfil } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        setRol(perfil?.role);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setRol(data?.role));
      } else {
        setRol(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRol(null);
    router.push("/login");
  };

  return (
    <nav className="border-b p-4 flex justify-between items-center bg-black text-white">
      <Link href="/" className="font-bold text-xl">
        CIAO SOLE
      </Link>

      <div className="flex gap-4">
        <Link href="/cotizar/mis-cotizaciones">Mis Cotizaciones</Link>

        {rol === "admin" && <Link href="/admin/dashboard">Panel Admin</Link>}
      </div>

      <div className="flex gap-4">
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
