import Navbar from "@/components/Navbar";
import { CarritoProvider } from "@/context/CarritoContext";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CarritoProvider>
      <div className="min-h-screen bg-[var(--cs-paper)] text-[var(--cs-ink)]">
        <Navbar />
        <main>{children}</main>
      </div>
    </CarritoProvider>
  );
}
