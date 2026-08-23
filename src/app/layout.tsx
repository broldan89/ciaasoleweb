import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ciao Sole",
  description: "Sistema de gestión y cotización",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#FBFBFB",
          color: "#1D1D1F",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
