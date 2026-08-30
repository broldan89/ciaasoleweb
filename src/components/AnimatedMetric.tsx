"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export function AnimatedMetric({
  valor,
  className,
}: {
  valor: string;
  className?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <span className={className}>{valor}</span>;
  }

  // Manejo de fracciones (ej. "12 / 45")
  if (valor.includes("/")) {
    const partes = valor.split("/");
    const num1 = parseFloat(partes[0].replace(/\D/g, ""));
    const num2 = parseFloat(partes[1].replace(/\D/g, ""));

    if (!isNaN(num1) && !isNaN(num2)) {
      return (
        <span className={className}>
          <CountUp target={num1} /> / <CountUp target={num2} />
        </span>
      );
    }
  }

  // Extraer secuencias numéricas
  const match = valor.match(/[\d.,]+/g);

  if (!match) {
    return <span className={className}>{valor}</span>;
  }

  const originalMatch = match[0];
  const cleanNumberStr = originalMatch.replace(/\./g, "").replace(",", ".");
  const targetNumber = parseFloat(cleanNumberStr);

  if (isNaN(targetNumber)) {
    return <span className={className}>{valor}</span>;
  }

  const prefijo = valor.substring(0, valor.indexOf(originalMatch));
  const sufijo = valor.substring(
    valor.indexOf(originalMatch) + originalMatch.length,
  );

  return (
    <span className={className}>
      {prefijo}
      <CountUp target={targetNumber} esMoneda={valor.includes("$")} />
      {sufijo}
    </span>
  );
}

function CountUp({
  target,
  esMoneda = false,
}: {
  target: number;
  esMoneda?: boolean;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (esMoneda) {
      return Math.round(latest).toLocaleString("es-AR");
    }
    return Number.isInteger(target)
      ? Math.round(latest).toString()
      : latest.toFixed(1).replace(".", ",");
  });

  useEffect(() => {
    const controls = animate(count, target, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [target, count]);

  return <motion.span>{rounded}</motion.span>;
}
