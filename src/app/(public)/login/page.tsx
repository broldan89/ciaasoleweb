"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Antes esto fallaba en silencio: si el login no funcionaba (mail
      // mal escrito, contraseña incorrecta, email sin confirmar) el botón
      // "no hacía nada" porque nunca se mostraba el error real.
      alert(`No se pudo iniciar sesión: ${error.message}`);
      console.error("Error de login:", error);
      setEnviando(false);
      return;
    }

    // Redirige según el rol real (tabla profiles, no user_metadata) — así
    // un admin va directo al panel en vez de a "mis cotizaciones".
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    router.push(perfil?.role === "admin" ? "/admin/dashboard" : "/cotizar/mis-cotizaciones");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Acceso</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-yellow-400 text-black font-bold p-2 rounded disabled:opacity-50"
        >
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
        <div className="mt-4 text-center text-sm text-gray-600">
          <a href="/register" className="underline">
            Registrarse
          </a>
        </div>
      </form>
    </div>
  );
}
