"use client";

// Cuenta desde 0 hasta el valor real cuando entra en viewport — el mismo
// "once: true" que ScrollReveal, mismo umbral, para que ambas animaciones
// disparen juntas y no se sientan como dos sistemas distintos.
//
// aria-hidden a propósito: un número que cambia en voz alta es ruido para un
// lector de pantalla. El valor accesible real lo da el `aria-label` que pone
// el padre (ComunaSection) con el texto ya formateado — esto es decoración.

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

export function NumeroAnimado({
  numero,
  decimales,
  sufijo = "",
  duracion = 1.4,
}: {
  numero: number;
  decimales: number;
  sufijo?: string;
  duracion?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const enVista = useInView(ref, { once: true, margin: "-80px" });
  const [texto, setTexto] = useState(formatear(0, decimales));

  useEffect(() => {
    if (!enVista) return;
    const controls = animate(0, numero, {
      duration: duracion,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setTexto(formatear(v, decimales)),
    });
    return () => controls.stop();
  }, [enVista, numero, decimales, duracion]);

  return (
    <span ref={ref} aria-hidden="true">
      {texto}
      {sufijo}
    </span>
  );
}

function formatear(valor: number, decimales: number): string {
  return valor.toLocaleString("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}
