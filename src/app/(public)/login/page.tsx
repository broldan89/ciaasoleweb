"use client";
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
    setEnviando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(`No se pudo iniciar sesión: ${error.message}`);
      console.error("Error de login:", error);
      setEnviando(false);
      return;
    }

    // Usamos el usuario directamente de la respuesta del login (data.user)
    const user = data.user;

    try {
      if (!user) return; // Seguridad extra

      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (perfilError) {
        console.error(
          "Error al obtener perfil:",
          JSON.stringify(perfilError, null, 2),
        );
        router.push("/cotizar/mis-cotizaciones");
        return;
      }

      router.push(
        perfil?.role === "admin"
          ? "/admin/dashboard"
          : "/cotizar/mis-cotizaciones",
      );
    } catch (error) {
      console.error(error);
    }
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
