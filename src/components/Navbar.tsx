"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import Logo from "@/components/Logo";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--cs-line)] bg-[rgba(251,250,247,.94)] backdrop-blur-md">
      <div className="cs-section flex h-[76px] items-center justify-between gap-8">
        <Logo variant="light" size={38} />

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--cs-charcoal)] transition-colors hover:text-[var(--cs-gold-dark)]"
          >
            Inicio
          </Link>
          <Link
            href="/cotizar"
            className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--cs-charcoal)] transition-colors hover:text-[var(--cs-gold-dark)]"
          >
            Cotizar
          </Link>
          {user && (
            <Link
              href="/cotizar/mis-cotizaciones"
              className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--cs-charcoal)] transition-colors hover:text-[var(--cs-gold-dark)]"
            >
              Mis cotizaciones
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--cs-charcoal)] transition-colors hover:text-[var(--cs-gold-dark)]"
            >
              Administración
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <span className="max-w-48 truncate text-xs text-[var(--cs-muted)]">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="border-l border-[var(--cs-line)] pl-4 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-charcoal)] hover:text-[var(--cs-gold-dark)]"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-charcoal)] hover:text-[var(--cs-gold-dark)]"
              >
                Ingresar
              </Link>
              <Link href="/register" className="cs-button !min-h-[40px] !px-5 !text-[10px]">
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center border border-[var(--cs-line)] md:hidden"
        >
          <span className="text-sm">{menuOpen ? "×" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[var(--cs-line)] bg-[var(--cs-paper)] md:hidden">
          <nav className="cs-section flex flex-col py-4">
            <Link href="/" onClick={() => setMenuOpen(false)} className="border-b border-[var(--cs-line)] py-4 text-xs font-semibold uppercase tracking-[.14em]">
              Inicio
            </Link>
            <Link href="/cotizar" onClick={() => setMenuOpen(false)} className="border-b border-[var(--cs-line)] py-4 text-xs font-semibold uppercase tracking-[.14em]">
              Cotizar
            </Link>
            {user && (
              <Link href="/cotizar/mis-cotizaciones" onClick={() => setMenuOpen(false)} className="border-b border-[var(--cs-line)] py-4 text-xs font-semibold uppercase tracking-[.14em]">
                Mis cotizaciones
              </Link>
            )}
            {role === "admin" && (
              <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="border-b border-[var(--cs-line)] py-4 text-xs font-semibold uppercase tracking-[.14em]">
                Administración
              </Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="py-4 text-left text-xs font-semibold uppercase tracking-[.14em]">
                Cerrar sesión
              </button>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="py-4 text-xs font-semibold uppercase tracking-[.14em]">
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
