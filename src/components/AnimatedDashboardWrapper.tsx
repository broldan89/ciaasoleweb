"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function AnimatedCard({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.015)" }}
      className={`transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedProgressBar({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const porcentaje = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--cs-line)]">
      <motion.div
        className="h-full bg-[var(--cs-muted)] opacity-60"
        initial={{ width: 0 }}
        animate={{ width: `${porcentaje}%` }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
