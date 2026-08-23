"use client";

import { useState } from "react";

// --- 1. COMPONENTE DEL MODAL ---
function NuevaOrdenModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    clienteEmail: "",
    sistema: "Roller Individual",
    tela: "Screen 3% White",
    ancho: "",
    alto: "",
    cantidad: 1,
    precioUnitario: "",
  });

  if (!isOpen) return null;

  const BRAND = {
    yellow: "#F5A623",
    darkBg: "#0C0C0D",
    cardBg: "#141416",
    inputBg: "#1C1C1F",
    border: "#242428",
    textPrimary: "#F4F4F5",
    textMuted: "#8E8E93",
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: BRAND.inputBg,
    border: `1px solid ${BRAND.border}`,
    color: BRAND.textPrimary,
    padding: "0.6rem 0.8rem",
    fontSize: "12px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: "9px",
    fontFamily: "monospace",
    color: BRAND.textMuted,
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: "0.4rem",
    letterSpacing: "0.1em",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: BRAND.cardBg,
          border: `1px solid ${BRAND.border}`,
          width: "100%",
          maxWidth: "540px",
          padding: "2rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
            borderBottom: `1px solid ${BRAND.border}`,
            paddingBottom: "1rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "9px",
                fontFamily: "monospace",
                color: BRAND.yellow,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.2rem",
              }}
            >
              CONFIRMACIÓN DE CONFECCIÓN
            </span>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "300",
                color: BRAND.textPrimary,
                margin: 0,
              }}
            >
              Ingresar Nueva Orden
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: BRAND.textMuted,
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0 0.5rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
        >
          <div>
            <label style={labelStyle}>Email o Nombre del Cliente</label>
            <input
              type="email"
              required
              placeholder="ejemplo@estudio.com"
              value={formData.clienteEmail}
              onChange={(e) =>
                setFormData({ ...formData, clienteEmail: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label style={labelStyle}>Sistema de Cortinado</label>
              <select
                value={formData.sistema}
                onChange={(e) =>
                  setFormData({ ...formData, sistema: e.target.value })
                }
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="Roller Individual">Roller Individual</option>
                <option value="Roller Doble">Roller Doble</option>
                <option value="Banda Vertical">Banda Vertical</option>
                <option value="Panel Oriental">Panel Oriental</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Colección de Tela</label>
              <select
                value={formData.tela}
                onChange={(e) =>
                  setFormData({ ...formData, tela: e.target.value })
                }
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="Screen 3% White">Screen 3% White</option>
                <option value="Screen 5% Charcoal">Screen 5% Charcoal</option>
                <option value="Blackout Premium">Blackout Premium</option>
                <option value="Sunscreen Linen">Sunscreen Linen</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label style={labelStyle}>Ancho (cm)</label>
              <input
                type="number"
                placeholder="180"
                value={formData.ancho}
                onChange={(e) =>
                  setFormData({ ...formData, ancho: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Alto (cm)</label>
              <input
                type="number"
                placeholder="220"
                value={formData.alto}
                onChange={(e) =>
                  setFormData({ ...formData, alto: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Cantidad</label>
              <input
                type="number"
                min="1"
                value={formData.cantidad}
                onChange={(e) =>
                  setFormData({ ...formData, cantidad: Number(e.target.value) })
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Precio Unitario (USD / ARS)</label>
            <input
              type="number"
              placeholder="98"
              value={formData.precioUnitario}
              onChange={(e) =>
                setFormData({ ...formData, precioUnitario: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: `1px solid ${BRAND.border}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                border: `1px solid ${BRAND.border}`,
                color: BRAND.textMuted,
                padding: "0.6rem 1.2rem",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                backgroundColor: BRAND.yellow,
                border: "none",
                color: "#000000",
                padding: "0.6rem 1.4rem",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Crear Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- 2. VISTA PRINCIPAL DE ÓRDENES ---
export default function OrdenesCiaoSolePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState("todas");

  const BRAND = {
    yellow: "#F5A623",
    darkBg: "#0C0C0D",
    cardBg: "#141416",
    border: "#242428",
    textPrimary: "#F4F4F5",
    textMuted: "#8E8E93",
  };

  return (
    <div
      style={{
        backgroundColor: BRAND.darkBg,
        color: BRAND.textPrimary,
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header con Identidad Ciao Sole */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingBottom: "1.5rem",
            borderBottom: `1px solid ${BRAND.border}`,
            marginBottom: "2rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.4rem",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: BRAND.yellow,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  letterSpacing: "0.25em",
                  color: BRAND.yellow,
                  textTransform: "uppercase",
                }}
              >
                CIAO SOLE · CORTINADOS & CONTROL SOLAR
              </span>
            </div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: "300",
                color: BRAND.textPrimary,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Cotizaciones y Órdenes de Trabajo
            </h1>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              backgroundColor: BRAND.yellow,
              color: "#000000",
              border: "none",
              padding: "0.65rem 1.3rem",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            + Nueva Orden
          </button>
        </header>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "1rem",
          }}
        >
          <div style={{ position: "relative", width: "320px" }}>
            <input
              type="text"
              placeholder="Buscar por cliente, ref o ID..."
              style={{
                backgroundColor: BRAND.cardBg,
                border: `1px solid ${BRAND.border}`,
                color: BRAND.textPrimary,
                padding: "0.55rem 1rem",
                fontSize: "12px",
                width: "100%",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {["todas", "en proceso", "aprobadas"].map((tab) => (
              <span
                key={tab}
                onClick={() => setTabActiva(tab)}
                style={{
                  color:
                    tabActiva === tab ? BRAND.textPrimary : BRAND.textMuted,
                  borderBottom:
                    tabActiva === tab
                      ? `2px solid ${BRAND.yellow}`
                      : "2px solid transparent",
                  paddingBottom: "4px",
                  cursor: "pointer",
                  fontWeight: tabActiva === tab ? "600" : "400",
                }}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Ficha Técnica de la Orden */}
        <article
          style={{
            backgroundColor: BRAND.cardBg,
            border: `1px solid ${BRAND.border}`,
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "1.25rem",
              borderBottom: `1px solid ${BRAND.border}`,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  color: BRAND.yellow,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                OT #110ECB98
              </span>
              <h2
                style={{
                  fontSize: "14px",
                  color: BRAND.textPrimary,
                  margin: "0.25rem 0 0 0",
                  fontWeight: "400",
                }}
              >
                roldanbrian.data@gmail.com
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.65rem",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  letterSpacing: "0.05em",
                }}
              >
                Aprobada
              </span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: BRAND.textMuted,
                  fontSize: "11px",
                  textDecoration: "underline",
                  cursor: "pointer",
                  textUnderlineOffset: "4px",
                }}
              >
                Emitir Factura
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.5fr 1fr 1fr 1fr",
              gap: "1rem",
              padding: "1.25rem 0",
              borderBottom: `1px solid ${BRAND.border}`,
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: BRAND.textMuted,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.3rem",
                  letterSpacing: "0.1em",
                }}
              >
                Especificación / Variante
              </span>
              <div
                style={{
                  fontFamily: "monospace",
                  color: BRAND.textPrimary,
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                }}
              >
                110ecb98-d034-42c8-b823-260f7e586e24
              </div>
              <div
                style={{
                  color: BRAND.textMuted,
                  fontSize: "11px",
                  marginTop: "3px",
                }}
              >
                Sistema Roller Double · Tela Screen 3% White
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: BRAND.textMuted,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.3rem",
                  letterSpacing: "0.1em",
                }}
              >
                Precio Unit.
              </span>
              <span
                style={{ fontFamily: "monospace", color: BRAND.textPrimary }}
              >
                $98
              </span>
            </div>

            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: BRAND.textMuted,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.3rem",
                  letterSpacing: "0.1em",
                }}
              >
                Cantidad
              </span>
              <span
                style={{ fontFamily: "monospace", color: BRAND.textPrimary }}
              >
                12 un.
              </span>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: BRAND.textMuted,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.3rem",
                  letterSpacing: "0.1em",
                }}
              >
                Subtotal
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: BRAND.textPrimary,
                  fontWeight: "600",
                }}
              >
                $1.176
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              paddingTop: "1.25rem",
            }}
          >
            <span style={{ fontSize: "11px", color: BRAND.textMuted }}>
              Emitido el 22/08/2026
            </span>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: BRAND.textMuted,
                  textTransform: "uppercase",
                  display: "block",
                  letterSpacing: "0.1em",
                }}
              >
                Total Orden
              </span>
              <span
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "300",
                  color: BRAND.textPrimary,
                  fontFamily: "serif",
                  letterSpacing: "-0.02em",
                }}
              >
                $1.176{" "}
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "sans-serif",
                    color: BRAND.yellow,
                    fontWeight: "700",
                  }}
                >
                  ARS
                </span>
              </span>
            </div>
          </div>
        </article>

        {/* Modal renderizado */}
        <NuevaOrdenModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
}
