"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
        minHeight: "100vh",
        backgroundColor: BRAND.darkBg,
        color: BRAND.textPrimary,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* NAVBAR PÚBLICA */}
      <header
        style={{
          backgroundColor: BRAND.darkBg,
          borderBottom: `1px solid ${BRAND.border}`,
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src="/logo.png"
            alt="Ciao Sole"
            style={{
              height: "40px",
              width: "auto",
              objectFit: "contain",
              filter: "invert(1) hue-rotate(180deg) brightness(1.2)",
            }}
          />
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link
            href="/cotizar"
            style={{
              color:
                pathname === "/cotizar" ? BRAND.textPrimary : BRAND.textMuted,
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Cotizador
          </Link>

          <Link
            href="/cotizar/mis-cotizaciones"
            style={{
              color: pathname.includes("mis-cotizaciones")
                ? BRAND.textPrimary
                : BRAND.textMuted,
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Mis Cotizaciones
          </Link>

          <Link
            href="/admin/dashboard"
            style={{
              backgroundColor: BRAND.yellow,
              color: "#000000",
              textDecoration: "none",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.6rem 1.2rem",
              borderRadius: "2px",
            }}
          >
            Panel Admin ↗
          </Link>
        </nav>
      </header>

      {/* CONTENIDO DE LAS PÁGINAS PÚBLICAS */}
      <main>{children}</main>
    </div>
  );
}
