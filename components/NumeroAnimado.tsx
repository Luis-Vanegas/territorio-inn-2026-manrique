"use client";

// Cuenta desde 0 hasta el valor real cuando entra en viewport — el mismo
// "once: true" que ScrollReveal, mismo umbral, para que ambas animaciones
// disparen juntas y no se sientan como dos sistemas distintos.
//
// El HTML servido de entrada ya trae el valor final (sin JS, o antes de que
// el efecto corra, se ve el número real — nunca un "0" a medio cargar). La
// animación de conteo es una mejora visual que solo se dispara al entrar en
// vista, y se salta por completo si el usuario prefiere menos movimiento.
//
// aria-hidden a propósito: un número que cambia en voz alta es ruido para un
// lector de pantalla. El valor accesible real lo da el `aria-label` que pone
// el padre (ComunaSection) con el texto ya formateado — esto es decoración.

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

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
  const prefiereMenosMovimiento = useReducedMotion();
  const [texto, setTexto] = useState(formatear(numero, decimales));

  useEffect(() => {
    if (!enVista || prefiereMenosMovimiento) return;
    const controls = animate(0, numero, {
      duration: duracion,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setTexto(formatear(v, decimales)),
    });
    return () => controls.stop();
  }, [enVista, numero, decimales, duracion, prefiereMenosMovimiento]);

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
