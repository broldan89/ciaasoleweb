"use client";

import Link from "next/link";

const metrics = [
  { label: "Órdenes activas", value: "12", detail: "En operación" },
  { label: "Cotizaciones", value: "5", detail: "Pendientes de revisión", accent: true },
  { label: "Sistemas en confección", value: "8", detail: "En taller" },
  { label: "Proyectos del mes", value: "24", detail: "Actividad comercial" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="border-b border-[var(--cs-line)] pb-8">
        <p className="cs-eyebrow">Ciao Sole · Resumen general</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="cs-display text-5xl sm:text-6xl">Dashboard.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--cs-muted)]">
              Una lectura rápida del estado comercial y operativo de la empresa.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-muted)]">
            Vista administrativa
          </span>
        </div>
      </header>

      <section className="grid gap-px border-x border-b border-[var(--cs-line)] bg-[var(--cs-line)] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[var(--cs-white)] p-6 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[var(--cs-muted)]">
              {metric.label}
            </p>
            <p className={`cs-display mt-4 text-5xl ${metric.accent ? "text-[var(--cs-gold-dark)]" : ""}`}>
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-[var(--cs-muted)]">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="cs-card p-7 sm:p-9">
          <p className="cs-eyebrow">Operación</p>
          <h2 className="cs-display mt-3 text-3xl">Gestión de pedidos de trabajo.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--cs-muted)]">
            Revisá cotizaciones, estados, especificaciones técnicas y próximos
            pasos de producción desde un único flujo.
          </p>
          <Link href="/admin/ordenes" className="cs-button mt-7">
            Ver órdenes
          </Link>
        </div>

        <div className="bg-[var(--cs-ink)] p-7 text-white sm:p-9">
          <p className="cs-eyebrow !text-[var(--cs-gold)]">Taller</p>
          <h2 className="cs-display mt-3 text-3xl">De la medida al corte.</h2>
          <p className="mt-4 text-sm leading-6 text-white/55">
            El módulo de producción será el puente entre la orden aprobada y la
            fabricación.
          </p>
          <Link href="/admin/taller" className="mt-7 inline-flex text-[10px] font-bold uppercase tracking-[.14em] text-[var(--cs-gold)] hover:text-white">
            Abrir taller →
          </Link>
        </div>
      </section>
    </div>
  );
}
