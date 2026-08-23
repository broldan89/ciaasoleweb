"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("cliente");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { rol_solicitado: rol } },
    });

    if (error) {
      alert(`Error al registrarse: ${error.message}`);
      console.error("Error de registro:", error);
      setEnviando(false);
      return;
    }

    if (rol === "mayorista") {
      alert("Cuenta creada. Tu acceso mayorista queda pendiente de aprobación.");
    }

    router.push("/login");
  };

  return (
    <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[.85fr_1.15fr]">
      <section className="flex flex-col justify-center bg-[var(--cs-ivory)] px-6 py-16 sm:px-12 lg:px-16">
        <p className="cs-eyebrow">Crear cuenta</p>
        <h1 className="cs-display mt-4 max-w-xl text-5xl leading-none sm:text-6xl">
          Un proyecto empieza con una buena decisión.
        </h1>
        <p className="mt-6 max-w-lg text-sm leading-7 text-[var(--cs-muted)]">
          Registrate para solicitar cotizaciones, guardar proyectos y acceder a
          condiciones comerciales según tu perfil.
        </p>
      </section>

      <section className="flex items-center justify-center border-l border-[var(--cs-line)] bg-[var(--cs-paper)] px-6 py-16">
        <form onSubmit={manejarRegistro} className="w-full max-w-[460px]">
          <h2 className="cs-display text-4xl">Tus datos</h2>
          <p className="mt-3 text-sm text-[var(--cs-muted)]">
            La cuenta comienza como cliente. Las solicitudes mayoristas requieren aprobación.
          </p>

          <div className="mt-9 space-y-5">
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
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="cs-label" htmlFor="rol">Tipo de cuenta</label>
              <select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="cs-input"
              >
                <option value="cliente">Cliente</option>
                <option value="mayorista">Mayorista / Revendedor</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={enviando} className="cs-button mt-7 w-full disabled:cursor-not-allowed disabled:opacity-50">
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="mt-7 text-center text-sm text-[var(--cs-muted)]">
            ¿Ya tenés una cuenta?{" "}
            <Link href="/login" className="font-semibold text-[var(--cs-ink)] underline decoration-[var(--cs-gold)] underline-offset-4">
              Ingresá
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
