"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const links = [
  { href: "/admin/dashboard", label: "Resumen" },
  { href: "/admin/ordenes", label: "Órdenes" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/taller", label: "Taller" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--cs-ivory)] text-[var(--cs-ink)] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-[var(--cs-line)] bg-[var(--cs-paper)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--cs-line)] px-7 py-7">
          <Logo variant="light" size={34} />
          <p className="mt-4 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--cs-muted)]">
            Administración
          </p>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--cs-muted)]">
            Operación
          </p>
          <div className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between border-l-2 px-3 py-3 text-xs font-semibold uppercase tracking-[.1em] transition-colors ${
                    active
                      ? "border-[var(--cs-gold)] bg-[var(--cs-ivory)] text-[var(--cs-ink)]"
                      : "border-transparent text-[var(--cs-muted)] hover:border-[var(--cs-line)] hover:text-[var(--cs-ink)]"
                  }`}
                >
                  {link.label}
                  {active && <span className="text-[var(--cs-gold)]">→</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[var(--cs-line)] p-6">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)] hover:text-[var(--cs-ink)]"
          >
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-[68px] items-center justify-between border-b border-[var(--cs-line)] bg-[var(--cs-paper)] px-5 sm:px-8 lg:px-10">
          <div>
            <p className="cs-eyebrow">CIAO SOLE / BACK OFFICE</p>
          </div>
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)] hover:text-[var(--cs-ink)] lg:hidden">
            Sitio ↗
          </Link>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
