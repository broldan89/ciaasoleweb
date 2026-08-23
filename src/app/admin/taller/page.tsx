"use client";

import { useState } from "react";

interface OTProcesada {
  id: string;
  numero_ot: number;
  cliente: string;
  sistema: string;
  tela: string;
  nominal: string;
  corteTela: string;
  corteTubo: string;
  corteZocalo: string;
  mando: string;
  caida: string;
  soporte: string;
  estado: "pendiente" | "corte_tela" | "armado" | "qc_aprobado";
}

export default function TallerProduccionPage() {
  const BRAND = {
    yellow: "#F5A623",
    darkBg: "#0C0C0D",
    cardBg: "#141416",
    cardHeader: "#1C1C1F",
    border: "#242428",
    textPrimary: "#F4F4F5",
    textMuted: "#8E8E93",
    green: "#10B981",
  };

  const [ordenes, setOrdenes] = useState<OTProcesada[]>([
    {
      id: "1",
      numero_ot: 1042,
      cliente: "Estudio Arquitectura A3",
      sistema: "Roller Doble",
      tela: "Screen 3% White / Blackout Premium",
      nominal: "1800 x 2200 mm",
      corteTela: "1765 x 2500 mm",
      corteTubo: "1770 mm",
      corteZocalo: "1765 mm",
      mando: "Izquierdo (Cadena Metálica)",
      caida: "Por detrás",
      soporte: "Doble Blanco 38mm",
      estado: "pendiente",
    },
    {
      id: "2",
      numero_ot: 1043,
      cliente: "Residencia Martinez",
      sistema: "Roller Individual",
      tela: "Screen 5% Charcoal",
      nominal: "2400 x 1800 mm",
      corteTela: "2365 x 2100 mm",
      corteTubo: "2370 mm",
      corteZocalo: "2365 mm",
      mando: "Derecho (Cadena Plástica)",
      caida: "Por delante",
      soporte: "Simple Negro",
      estado: "corte_tela",
    },
  ]);

  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");

  const avanzarEstado = (id: string) => {
    setOrdenes((prev) =>
      prev.map((ot) => {
        if (ot.id !== id) return ot;
        if (ot.estado === "pendiente") return { ...ot, estado: "corte_tela" };
        if (ot.estado === "corte_tela") return { ...ot, estado: "armado" };
        if (ot.estado === "armado") return { ...ot, estado: "qc_aprobado" };
        return ot;
      }),
    );
  };

  const ordenesFiltradas = ordenes.filter((ot) => {
    if (filtroEtapa === "todas") return true;
    return ot.estado === filtroEtapa;
  });

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "900px",
        margin: "0 auto",
        color: BRAND.textPrimary,
      }}
    >
      {/* Header Operativo */}
      <header
        style={{
          paddingBottom: "1.2rem",
          borderBottom: `1px solid ${BRAND.border}`,
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.3rem",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: BRAND.yellow,
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              letterSpacing: "0.2em",
              color: BRAND.yellow,
              textTransform: "uppercase",
            }}
          >
            MÓDULO DE FÁBRICA & DESPIECE
          </span>
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: "400", margin: 0 }}>
          Terminal de Producción
        </h1>
      </header>

      {/* Filtros de Taller */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
        }}
      >
        {[
          { key: "todas", label: "Todas" },
          { key: "pendiente", label: "1. Mesa de Corte" },
          { key: "corte_tela", label: "2. Ensamblado" },
          { key: "armado", label: "3. Control Calidad" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFiltroEtapa(tab.key)}
            style={{
              backgroundColor:
                filtroEtapa === tab.key ? BRAND.yellow : BRAND.cardBg,
              color: filtroEtapa === tab.key ? "#000000" : BRAND.textMuted,
              border: `1px solid ${filtroEtapa === tab.key ? BRAND.yellow : BRAND.border}`,
              padding: "0.6rem 1rem",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tarjetas de Trabajo */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {ordenesFiltradas.map((ot) => (
          <article
            key={ot.id}
            style={{
              backgroundColor: BRAND.cardBg,
              border: `1px solid ${BRAND.border}`,
              overflow: "hidden",
            }}
          >
            {/* Cabecera */}
            <div
              style={{
                backgroundColor: BRAND.cardHeader,
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${BRAND.border}`,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    color: BRAND.yellow,
                    fontWeight: "700",
                    letterSpacing: "0.15em",
                  }}
                >
                  OT #{ot.numero_ot}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: BRAND.textMuted,
                    marginLeft: "0.75rem",
                  }}
                >
                  {ot.cliente}
                </span>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  padding: "0.3rem 0.6rem",
                  backgroundColor:
                    ot.estado === "qc_aprobado"
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(245, 166, 35, 0.15)",
                  color:
                    ot.estado === "qc_aprobado" ? BRAND.green : BRAND.yellow,
                  border: `1px solid ${ot.estado === "qc_aprobado" ? BRAND.green : BRAND.yellow}`,
                }}
              >
                {ot.estado.replace("_", " ")}
              </span>
            </div>

            {/* Especificaciones */}
            <div
              style={{
                padding: "1.25rem",
                borderBottom: `1px solid ${BRAND.border}`,
              }}
            >
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: BRAND.textPrimary,
                  marginBottom: "0.2rem",
                }}
              >
                {ot.sistema} —{" "}
                <span style={{ color: BRAND.yellow }}>{ot.tela}</span>
              </div>
              <div style={{ fontSize: "12px", color: BRAND.textMuted }}>
                Medida Nominal Solicitada:{" "}
                <strong style={{ color: BRAND.textPrimary }}>
                  {ot.nominal}
                </strong>
              </div>
            </div>

            {/* RECETA DE CORTE */}
            <div
              style={{
                padding: "1.25rem",
                backgroundColor: "#0E0E10",
                borderBottom: `1px solid ${BRAND.border}`,
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  color: BRAND.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  display: "block",
                  marginBottom: "0.8rem",
                }}
              >
                RECETA DE CORTE DE MATERIALES
              </span>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    borderLeft: `3px solid ${BRAND.yellow}`,
                    paddingLeft: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: BRAND.textMuted,
                      display: "block",
                    }}
                  >
                    Corte de Tela
                  </span>
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontFamily: "monospace",
                      fontWeight: "700",
                      color: BRAND.textPrimary,
                    }}
                  >
                    {ot.corteTela}
                  </span>
                </div>

                <div
                  style={{
                    borderLeft: `3px solid ${BRAND.textMuted}`,
                    paddingLeft: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: BRAND.textMuted,
                      display: "block",
                    }}
                  >
                    Tubo Aluminio
                  </span>
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontFamily: "monospace",
                      fontWeight: "700",
                      color: BRAND.textPrimary,
                    }}
                  >
                    {ot.corteTubo}
                  </span>
                </div>

                <div
                  style={{
                    borderLeft: `3px solid ${BRAND.textMuted}`,
                    paddingLeft: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: BRAND.textMuted,
                      display: "block",
                    }}
                  >
                    Zócalo Contrapeso
                  </span>
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontFamily: "monospace",
                      fontWeight: "700",
                      color: BRAND.textPrimary,
                    }}
                  >
                    {ot.corteZocalo}
                  </span>
                </div>
              </div>
            </div>

            {/* ESPECIFICACIONES DE ARMADO */}
            <div
              style={{
                padding: "1.25rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
                fontSize: "11px",
                color: BRAND.textMuted,
                borderBottom: `1px solid ${BRAND.border}`,
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    color: BRAND.textMuted,
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                >
                  COMANDO
                </span>
                <strong style={{ color: BRAND.textPrimary, fontSize: "12px" }}>
                  {ot.mando}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    display: "block",
                    color: BRAND.textMuted,
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                >
                  CAÍDA PAÑO
                </span>
                <strong style={{ color: BRAND.textPrimary, fontSize: "12px" }}>
                  {ot.caida}
                </strong>
              </div>
              <div>
                <span
                  style={{
                    display: "block",
                    color: BRAND.textMuted,
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                >
                  SOPORTES
                </span>
                <strong style={{ color: BRAND.textPrimary, fontSize: "12px" }}>
                  {ot.soporte}
                </strong>
              </div>
            </div>

            {/* BOTÓN 1-TAP */}
            <div
              style={{
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {ot.estado !== "qc_aprobado" ? (
                <button
                  onClick={() => avanzarEstado(ot.id)}
                  style={{
                    backgroundColor: BRAND.yellow,
                    color: "#000000",
                    border: "none",
                    padding: "0.8rem 1.5rem",
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {ot.estado === "pendiente" && "➔ Iniciar Corte de Materiales"}
                  {ot.estado === "corte_tela" && "➔ Enviar a Ensamblado"}
                  {ot.estado === "armado" && "✔ Aprobar Control de Calidad"}
                </button>
              ) : (
                <div
                  style={{
                    color: BRAND.green,
                    fontSize: "11px",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    fontWeight: "700",
                  }}
                >
                  ✔ LISTO PARA DESPACHO / INSTALACIÓN
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
