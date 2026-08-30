"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Edit3, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Tela = {
  id: string;
  nombre: string;
  ancho_fabrica_mm: number;
  apaisable: boolean;
  is_active: boolean;
};

type FormularioTela = {
  nombre: string;
  ancho_fabrica_mm: string;
  apaisable: boolean;
};

const FORMULARIO_INICIAL: FormularioTela = {
  nombre: "",
  ancho_fabrica_mm: "",
  apaisable: false,
};

export default function TelasPage() {
  const [telas, setTelas] = useState<Tela[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioTela>(FORMULARIO_INICIAL);

  const [telaEditando, setTelaEditando] = useState<string | null>(null);

  async function cargarTelas() {
    setCargando(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("telas")
      .select("id, nombre, ancho_fabrica_mm, apaisable, is_active")
      .order("nombre", { ascending: true });

    if (supabaseError) {
      console.error("Error cargando telas:", supabaseError);
      setError("No se pudieron cargar las telas.");
      setTelas([]);
      setCargando(false);
      return;
    }

    setTelas(data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargarTelas();
  }, []);

  function actualizarFormulario(
    campo: keyof FormularioTela,
    valor: string | boolean,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setTelaEditando(null);
    setError(null);
  }

  function comenzarEdicion(tela: Tela) {
    setTelaEditando(tela.id);

    setFormulario({
      nombre: tela.nombre,
      ancho_fabrica_mm: String(tela.ancho_fabrica_mm),
      apaisable: tela.apaisable,
    });

    setError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function guardarTela(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    const nombre = formulario.nombre.trim();
    const ancho = Number(formulario.ancho_fabrica_mm);

    if (!nombre) {
      setError("El nombre de la tela es obligatorio.");
      return;
    }

    if (!Number.isFinite(ancho) || ancho <= 0) {
      setError("El ancho de fábrica debe ser mayor a 0 mm.");
      return;
    }

    setGuardando(true);

    const datos = {
      nombre,
      ancho_fabrica_mm: ancho,
      apaisable: formulario.apaisable,
    };

    if (telaEditando) {
      const { error: supabaseError } = await supabase
        .from("telas")
        .update(datos)
        .eq("id", telaEditando);

      if (supabaseError) {
        console.error("Error actualizando tela:", supabaseError);
        setError("No se pudo actualizar la tela.");
        setGuardando(false);
        return;
      }
    } else {
      const { error: supabaseError } = await supabase
        .from("telas")
        .insert(datos);

      if (supabaseError) {
        console.error("Error creando tela:", supabaseError);
        setError("No se pudo crear la tela.");
        setGuardando(false);
        return;
      }
    }

    limpiarFormulario();
    setGuardando(false);

    await cargarTelas();
  }

  async function cambiarEstado(tela: Tela) {
    setError(null);

    const nuevoEstado = !tela.is_active;

    const { error: supabaseError } = await supabase
      .from("telas")
      .update({
        is_active: nuevoEstado,
      })
      .eq("id", tela.id);

    if (supabaseError) {
      console.error("Error cambiando estado de tela:", supabaseError);

      setError("No se pudo cambiar el estado de la tela.");
      return;
    }

    setTelas((actuales) =>
      actuales.map((item) =>
        item.id === tela.id
          ? {
              ...item,
              is_active: nuevoEstado,
            }
          : item,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-6 py-10 text-[#252525] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#777]">
              Administración
            </p>

            <h1 className="text-3xl font-light tracking-tight md:text-4xl">
              Telas
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#666]">
              Configuración de telas utilizadas por el sistema de cotización.
            </p>
          </div>

          <div className="text-sm text-[#777]">
            {telas.length}{" "}
            {telas.length === 1 ? "tela registrada" : "telas registradas"}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X size={17} />
            <span>{error}</span>
          </div>
        )}

        <section className="mb-10 rounded-2xl border border-[#e5e3df] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:p-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">
                {telaEditando ? "Editar tela" : "Nueva tela"}
              </h2>

              <p className="mt-1 text-sm text-[#777]">
                Definí las características industriales necesarias para el
                cotizador.
              </p>
            </div>

            {telaEditando && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="text-sm text-[#666] transition hover:text-[#222]"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form
            onSubmit={guardarTela}
            className="grid gap-6 md:grid-cols-[1fr_220px_auto] md:items-end"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Nombre</span>

              <input
                type="text"
                value={formulario.nombre}
                onChange={(event) =>
                  actualizarFormulario("nombre", event.target.value)
                }
                placeholder="Ej. Screen 5%"
                className="w-full rounded-xl border border-[#dcdad6] bg-[#faf9f7] px-4 py-3 text-sm outline-none transition focus:border-[#999] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Ancho de fábrica
              </span>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formulario.ancho_fabrica_mm}
                  onChange={(event) =>
                    actualizarFormulario("ancho_fabrica_mm", event.target.value)
                  }
                  placeholder="2500"
                  className="w-full rounded-xl border border-[#dcdad6] bg-[#faf9f7] px-4 py-3 pr-14 text-sm outline-none transition focus:border-[#999] focus:bg-white"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#888]">
                  mm
                </span>
              </div>
            </label>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[#252525] px-5 text-sm font-medium text-white transition hover:bg-[#3b3b3b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {telaEditando ? (
                <>
                  <Check size={17} />
                  {guardando ? "Guardando..." : "Guardar"}
                </>
              ) : (
                <>
                  <Plus size={17} />
                  {guardando ? "Creando..." : "Agregar tela"}
                </>
              )}
            </button>

            <label className="flex cursor-pointer items-center gap-3 md:col-span-3">
              <input
                type="checkbox"
                checked={formulario.apaisable}
                onChange={(event) =>
                  actualizarFormulario("apaisable", event.target.checked)
                }
                className="h-4 w-4 rounded border-[#bbb]"
              />

              <span className="text-sm">Esta tela permite armado apaisado</span>

              <span className="text-xs text-[#888]">
                Se utilizará en el cálculo de orientación del cotizador.
              </span>
            </label>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e5e3df] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#e9e7e3] px-6 py-5 md:px-8">
            <h2 className="text-lg font-medium">Telas registradas</h2>
          </div>

          {cargando ? (
            <div className="px-6 py-16 text-center text-sm text-[#777]">
              Cargando telas...
            </div>
          ) : telas.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-[#777]">
                Todavía no hay telas registradas.
              </p>

              <p className="mt-2 text-xs text-[#999]">
                La primera tela puede cargarse desde el formulario superior.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-[#e9e7e3] bg-[#faf9f7] text-xs uppercase tracking-[0.12em] text-[#888]">
                    <th className="px-6 py-4 font-medium md:px-8">Tela</th>

                    <th className="px-6 py-4 font-medium">Ancho fábrica</th>

                    <th className="px-6 py-4 font-medium">Apaisable</th>

                    <th className="px-6 py-4 font-medium">Estado</th>

                    <th className="px-6 py-4 text-right font-medium md:px-8">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {telas.map((tela) => (
                    <tr
                      key={tela.id}
                      className="border-b border-[#efedea] last:border-b-0"
                    >
                      <td className="px-6 py-5 md:px-8">
                        <span className="font-medium">{tela.nombre}</span>
                      </td>

                      <td className="px-6 py-5 text-sm text-[#555]">
                        {tela.ancho_fabrica_mm.toLocaleString("es-AR")} mm
                      </td>

                      <td className="px-6 py-5">
                        {tela.apaisable ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0eee9] px-3 py-1 text-xs font-medium text-[#444]">
                            <Check size={13} />
                            Sí
                          </span>
                        ) : (
                          <span className="text-sm text-[#999]">No</span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {tela.is_active ? (
                          <span className="text-sm text-[#444]">Activa</span>
                        ) : (
                          <span className="text-sm text-[#999]">Inactiva</span>
                        )}
                      </td>

                      <td className="px-6 py-5 md:px-8">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => comenzarEdicion(tela)}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#dedcd8] px-3 py-2 text-xs font-medium transition hover:bg-[#f7f6f3]"
                          >
                            <Edit3 size={14} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => cambiarEstado(tela)}
                            className="rounded-lg border border-[#dedcd8] px-3 py-2 text-xs font-medium transition hover:bg-[#f7f6f3]"
                          >
                            {tela.is_active ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
