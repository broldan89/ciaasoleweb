import type { Metadata } from "next";
import "./globals.css";
import { CarritoProvider } from "@/context/CarritoContext";

export const metadata: Metadata = {
  title: "CIAO SOLE",
  description: "Cortinas y persianas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <CarritoProvider>{children}</CarritoProvider>
      </body>
    </html>
  );
}
