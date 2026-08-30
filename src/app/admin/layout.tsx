"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase/client";

const links = [
  { href: "/admin/dashboard", label: "Resumen" },
  { href: "/admin/ordenes", label: "Órdenes" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/taller", label: "Taller" },
];

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  async function handleLogout() {
    if (cerrandoSesion) return;

    setCerrandoSesion(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error);
      setCerrandoSesion(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

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
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

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

        <div className="border-t border-[var(--cs-line)] px-7 py-6">
          <Link
            href="/"
            className="block text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)] transition-colors hover:text-[var(--cs-ink)]"
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

          <button
            type="button"
            onClick={handleLogout}
            disabled={cerrandoSesion}
            className="inline-flex items-center gap-2 border-0 bg-transparent p-0 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)] transition-colors hover:text-[var(--cs-ink)] disabled:cursor-wait disabled:opacity-50"
            aria-label="Cerrar sesión"
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
            </svg>

            <span>
              {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
            </span>
          </button>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
