import Link from "next/link";
import { redirect } from "next/navigation";

import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase-server";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.role === "admin") {
    redirect("/admin/dashboard");
  }

  const links = [
    { href: "/panel", label: "Resumen" },
    { href: "/panel/cotizaciones", label: "Cotizaciones" },
    { href: "/panel/pedidos", label: "Pedidos" },
  ];

  return (
    <div className="min-h-screen bg-[var(--cs-ivory)] text-[var(--cs-ink)] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-[var(--cs-line)] bg-[var(--cs-paper)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--cs-line)] px-7 py-7">
          <Logo variant="light" size={34} />
          <p className="mt-4 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--cs-muted)]">
            Mi cuenta
          </p>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--cs-muted)]">
            Mis proyectos
          </p>

          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block border-l-2 border-transparent px-3 py-3 text-xs font-semibold uppercase tracking-[.1em] text-[var(--cs-muted)] transition-colors hover:border-[var(--cs-gold)] hover:text-[var(--cs-ink)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-[var(--cs-line)] px-7 py-6">
          <Link
            href="/cotizar"
            className="block text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-gold-dark)] transition-colors hover:text-[var(--cs-ink)]"
          >
            + Nueva cotización
          </Link>
          <Link
            href="/"
            className="mt-4 block text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)] transition-colors hover:text-[var(--cs-ink)]"
          >
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-[68px] items-center justify-between border-b border-[var(--cs-line)] bg-[var(--cs-paper)] px-5 sm:px-8 lg:px-10">
          <div className="min-w-0">
            <p className="cs-eyebrow">CIAO SOLE / MI CUENTA</p>
            <p className="mt-1 max-w-[220px] truncate text-xs text-[var(--cs-muted)] sm:max-w-none">
              {user.email}
            </p>
          </div>

          <LogoutButton />
        </header>

        <div className="border-b border-[var(--cs-line)] bg-[var(--cs-paper)] px-5 py-3 lg:hidden">
          <nav className="flex gap-5 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cotizar"
              className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[.12em] text-[var(--cs-gold-dark)]"
            >
              Nueva cotización
            </Link>
          </nav>
        </div>

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
