import Navbar from "@/components/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--cs-paper)] text-[var(--cs-ink)]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
