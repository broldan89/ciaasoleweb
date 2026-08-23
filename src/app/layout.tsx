import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Aquí importamos el componente

export const metadata: Metadata = {
  title: "Ciao Sole",
  description: "Ciao Sole Web",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
