"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Contenedor para tarjetas, paneles o cajas interactivas
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Botones con feedback táctil (Micro-interaction)
export function Button({ children, className = "", ...props }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Para tablas o listas: anima la entrada fila por fila de forma progresiva
export function StaggerList({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.div>
  );
}
