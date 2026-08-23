"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(`No se pudo iniciar sesión: ${error.message}`);
      console.error("Error de login:", error);
      setEnviando(false);
      return;
    }

    const user = data.user;

    if (!user) {
      alert("No se pudo obtener el usuario autenticado.");
      setEnviando(false);
      return;
    }

    try {
      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (perfilError) {
        console.error("Error al obtener perfil:", JSON.stringify(perfilError, null, 2));
        router.push("/cotizar/mis-cotizaciones");
        return;
      }

      router.push(perfil?.role === "admin" ? "/admin/dashboard" : "/cotizar/mis-cotizaciones");
    } catch (error) {
      console.error("Error inesperado después del login:", error);
      router.push("/cotizar/mis-cotizaciones");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-2">
      <section className="hidden bg-[var(--cs-ink)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="cs-eyebrow !text-[var(--cs-gold)]">Ciao Sole</p>
          <h1 className="cs-display mt-6 max-w-lg text-6xl leading-[.98]">
            Un espacio para cada proyecto.
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-white/50">
          Accedé a tus cotizaciones, precios según tu perfil y herramientas de
          trabajo desde una única plataforma.
        </p>
      </section>

      <section className="flex items-center justify-center bg-[var(--cs-paper)] px-6 py-16">
        <form onSubmit={handleLogin} className="w-full max-w-[420px]">
          <p className="cs-eyebrow">Acceso</p>
          <h2 className="cs-display mt-3 text-5xl">Bienvenido.</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--cs-muted)]">
            Ingresá para continuar con tus proyectos y cotizaciones.
          </p>

          <div className="mt-10 space-y-5">
            <div>
              <label className="cs-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cs-input"
                required
              />
            </div>

            <div>
              <label className="cs-label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cs-input"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={enviando} className="cs-button mt-7 w-full disabled:cursor-not-allowed disabled:opacity-50">
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>

          <p className="mt-7 text-center text-sm text-[var(--cs-muted)]">
            ¿Todavía no tenés una cuenta?{" "}
            <Link href="/register" className="font-semibold text-[var(--cs-ink)] underline decoration-[var(--cs-gold)] underline-offset-4">
              Registrate
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
