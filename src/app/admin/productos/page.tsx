"use client";

export default function ProductosPage() {
  const BRAND = {
    yellow: "#F5A623",
    cardBg: "#141416",
    border: "#242428",
    textPrimary: "#F4F4F5",
    textMuted: "#8E8E93",
  };

  const productos = [
    {
      id: "1",
      nombre: "Sistema Roller Individual",
      tela: "Screen 3% White",
      precio: "$98 / m²",
    },
    {
      id: "2",
      nombre: "Sistema Roller Doble",
      tela: "Blackout Premium + Screen 5%",
      precio: "$165 / m²",
    },
    {
      id: "3",
      nombre: "Banda Vertical",
      tela: "Sunscreen Linen",
      precio: "$110 / m²",
    },
  ];

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
            CATÁLOGO · CONTROL SOLAR
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
          Productos y Colecciones de Telas
        </h1>
      </header>

      {/* Lista de Productos Estilo Showroom */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {productos.map((prod) => (
          <div
            key={prod.id}
            style={{
              backgroundColor: BRAND.cardBg,
              border: `1px solid ${BRAND.border}`,
              padding: "1.25rem 1.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: BRAND.yellow,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.2rem",
                }}
              >
                SISTEMA #{prod.id}
              </span>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "400",
                  color: BRAND.textPrimary,
                  margin: 0,
                }}
              >
                {prod.nombre}
              </h3>
              <span
                style={{
                  fontSize: "12px",
                  color: BRAND.textMuted,
                  marginTop: "0.2rem",
                  display: "block",
                }}
              >
                {prod.tela}
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
                  letterSpacing: "0.1em",
                }}
              >
                Sugerido
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontFamily: "monospace",
                  color: BRAND.textPrimary,
                  fontWeight: "600",
                }}
              >
                {prod.precio}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
