"use client";

// SVG ilustrativo de Manrique: no es cartografía precisa, es un trazo con carácter de dibujo a mano
// que se "dibuja solo" al cargar (pathLength animado). El color lo hereda del padre vía currentColor.

import { motion } from "framer-motion";

interface MapaManriqueProps {
  className?: string;
}

const BARRIOS = [
  { nombre: "Manrique Central", x: 300, y: 300 },
  { nombre: "Campo Valdés", x: 220, y: 190 },
  { nombre: "San Pablo", x: 420, y: 220 },
  { nombre: "La Cruz", x: 380, y: 420 },
  { nombre: "La Salle", x: 180, y: 400 },
];

export function MapaManrique({ className }: MapaManriqueProps) {
  return (
    <svg
      viewBox="0 0 640 640"
      className={className}
      role="img"
      aria-label="Mapa ilustrativo, dibujado a mano, de la Comuna 3 Manrique y sus barrios principales"
    >
      <motion.path
        d="M 120 80 L 200 55 L 320 40 Q 400 35 460 70 L 540 110 Q 580 150 560 210 L 590 280 Q 600 340 560 380 L 520 460 Q 480 520 410 540 L 340 580 Q 260 600 190 560 L 120 520 Q 70 480 60 410 L 40 320 Q 30 240 70 180 L 90 130 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, ease: "easeInOut" }}
      />
      <motion.path
        d="M 120 80 Q 220 220 300 300 Q 200 260 60 410 M 300 300 Q 380 260 540 110 M 300 300 Q 340 380 340 580 M 300 300 Q 220 340 120 520"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="3 7"
        opacity={0.5}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, delay: 1.2, ease: "easeInOut" }}
      />
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2 }}
        fontFamily="var(--font-jetbrains-mono)"
        fontSize={11}
        fill="currentColor"
      >
        {BARRIOS.map((barrio) => (
          <g key={barrio.nombre}>
            <circle cx={barrio.x} cy={barrio.y} r={4} />
            <text x={barrio.x + 10} y={barrio.y + 4}>
              {barrio.nombre}
            </text>
          </g>
        ))}
      </motion.g>
    </svg>
  );
}
