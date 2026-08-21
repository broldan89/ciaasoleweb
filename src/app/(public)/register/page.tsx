"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("cliente");
  const router = useRouter();

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          rol,
        },
      },
    });

    if (error) {
      alert("Error al registrarse");
      return;
    }

    router.push("/login");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <form
        onSubmit={manejarRegistro}
        className="bg-white p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Registrarse</h2>
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
        <div className="mb-4">
          <label className="block mb-1">Tipo de cuenta</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="cliente">Cliente</option>
            <option value="mayorista">Mayorista / Revendedor</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-yellow-400 text-black font-bold p-2 rounded"
        >
          Crear cuenta
        </button>
      </form>
    </div>
  );
}
