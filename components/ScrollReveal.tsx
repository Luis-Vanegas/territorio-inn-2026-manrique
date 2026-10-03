"use client";

// Wrapper compartido: fade + slide sutil al entrar en viewport. Evita repetir el mismo boilerplate
// de useInView en cada sección. Una sola vez ("once: true") — no se re-anima al volver a scrollear.

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  const ref = useRef(null);
  const enVista = useInView(ref, { once: true, margin: "-80px" });
  // Quien activó "menos movimiento" en el sistema operativo suele tener
  // trastornos vestibulares: el fade+slide se cambia por aparición directa.
  const prefiereMenosMovimiento = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      // Marca para el CSS de respaldo (styles/globals.css): sin JS el estado
      // oculto no puede quedarse en el HTML del servidor.
      data-reveal
      className={className}
      // `initial` constante: useReducedMotion da false en el servidor y true en el
      // cliente, y un `initial` que dependa de él rompe la hidratación.
      initial={{ opacity: 0, y: 16 }}
      animate={prefiereMenosMovimiento || enVista ? { opacity: 1, y: 0 } : {}}
      transition={prefiereMenosMovimiento ? { duration: 0 } : { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
