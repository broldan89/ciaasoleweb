"use client";

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111111",
        color: "#FFFFFF",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid #222222",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: "14px", letterSpacing: "0.05em" }}>
          CIAO SOLE // ADMIN
        </strong>
        <Link
          href="/"
          style={{ color: "#888888", fontSize: "12px", textDecoration: "none" }}
        >
          Volver a la web ↗
        </Link>
      </header>
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}
