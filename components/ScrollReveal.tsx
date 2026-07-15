"use client";

// Wrapper compartido: fade + slide sutil al entrar en viewport. Evita repetir el mismo boilerplate
// de useInView en cada sección. Una sola vez ("once: true") — no se re-anima al volver a scrollear.

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  const ref = useRef(null);
  const enVista = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={enVista ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
