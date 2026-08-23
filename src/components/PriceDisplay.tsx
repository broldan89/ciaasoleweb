interface PriceDisplayProps {
  precio: number;
  esMayorista: boolean;
}

export default function PriceDisplay({ precio, esMayorista }: PriceDisplayProps) {
  return (
    <div className="text-right">
      <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[var(--cs-muted)]">
        {esMayorista ? "Precio mayorista" : "Desde"}
      </span>
      <span className="cs-display text-2xl text-[var(--cs-ink)]">
        ${Number(precio).toLocaleString("es-AR")}
      </span>
    </div>
  );
}
