"use client";

import Link from "next/link";

export default function DashboardPage() {
  const BRAND = {
    yellow: "#F5A623",
    cardBg: "#141416",
    border: "#242428",
    textPrimary: "#F4F4F5",
    textMuted: "#8E8E93",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          paddingBottom: "1.5rem",
          borderBottom: `1px solid ${BRAND.border}`,
          marginBottom: "2rem",
        }}
      >
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
            CIAO SOLE · RESUMEN GENERAL
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
          Dashboard Principal
        </h1>
      </header>

      {/* Métricas Rápidas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        <div
          style={{
            backgroundColor: BRAND.cardBg,
            border: `1px solid ${BRAND.border}`,
            padding: "1.5rem",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: BRAND.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              display: "block",
            }}
          >
            Órdenes Activas
          </span>
          <p
            style={{
              fontSize: "2.2rem",
              fontWeight: "300",
              margin: "0.5rem 0 0 0",
              color: BRAND.textPrimary,
              fontFamily: "serif",
            }}
          >
            12
          </p>
        </div>

        <div
          style={{
            backgroundColor: BRAND.cardBg,
            border: `1px solid ${BRAND.border}`,
            padding: "1.5rem",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: BRAND.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              display: "block",
            }}
          >
            Cotizaciones Pendientes
          </span>
          <p
            style={{
              fontSize: "2.2rem",
              fontWeight: "300",
              margin: "0.5rem 0 0 0",
              color: BRAND.yellow,
              fontFamily: "serif",
            }}
          >
            5
          </p>
        </div>

        <div
          style={{
            backgroundColor: BRAND.cardBg,
            border: `1px solid ${BRAND.border}`,
            padding: "1.5rem",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: BRAND.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              display: "block",
            }}
          >
            Sistemas en Confección
          </span>
          <p
            style={{
              fontSize: "2.2rem",
              fontWeight: "300",
              margin: "0.5rem 0 0 0",
              color: BRAND.textPrimary,
              fontFamily: "serif",
            }}
          >
            8
          </p>
        </div>
      </div>

      {/* Acceso Rápido a Trabajo */}
      <div
        style={{
          backgroundColor: BRAND.cardBg,
          border: `1px solid ${BRAND.border}`,
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "400",
              margin: "0 0 0.25rem 0",
              color: BRAND.textPrimary,
            }}
          >
            Gestión de Pedidos de Trabajo
          </h3>
          <p style={{ fontSize: "12px", color: BRAND.textMuted, margin: 0 }}>
            Revisá las especificaciones técnicas de telas, medidas y estados de
            producción.
          </p>
        </div>

        <Link
          href="/admin/ordenes"
          style={{
            backgroundColor: BRAND.yellow,
            color: "#000000",
            padding: "0.6rem 1.2rem",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Ver Órdenes ↗
        </Link>
      </div>
    </div>
  );
}
