import { PALETA_NOCHE } from '@/lib/paleta';

/**
 * Horizonte de ladera con la aguja de la iglesia (DESIGN.md › Firmamento ›
 * Motivos). Cada luz de casa es uno de los comercios de OpenStreetMap: su
 * posición de oeste a este sale de su longitud. La altura dentro de la ladera
 * es solo reparto visual (no es un dato).
 *
 * Decorativo: `aria-hidden`; el texto de la página dice lo mismo con palabras.
 * Sin movimiento ni JavaScript.
 */

const ANCHO = 1200;
const ALTO = 170;

// Perfil de la ladera: [x, y] de la cresta, de oeste a este.
const PERFIL: [number, number][] = [
  [0, 60], [80, 67], [160, 70], [240, 67], [320, 62], [400, 60], [480, 63],
  [560, 72], [640, 80], [720, 85], [800, 84], [880, 80], [960, 78], [1040, 82],
  [1120, 91], [1200, 101],
];

function alturaCresta(x: number): number {
  for (let i = 1; i < PERFIL.length; i++) {
    const [x1, y1] = PERFIL[i - 1]!;
    const [x2, y2] = PERFIL[i]!;
    if (x <= x2) return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
  }
  return PERFIL[PERFIL.length - 1]![1];
}

export function Horizonte({ posiciones }: { posiciones: number[] }) {
  const ladera = `M0 ${ALTO} ${PERFIL.map(([x, y]) => `L${x} ${y}`).join(' ')} L${ANCHO} ${ALTO} Z`;

  const luces = posiciones.map((p, i) => {
    const x = Math.round(20 + p * (ANCHO - 40));
    const cresta = alturaCresta(x);
    // Reparto determinista (sin azar): mismo HTML en servidor y cliente.
    const t = ((i * 7919) % 97) / 97;
    const y = Math.round(cresta + 10 + t * (ALTO - cresta - 20));
    const opacidad = 0.45 + (((i * 31) % 11) / 11) * 0.5;
    return { x, y, opacidad: Math.round(opacidad * 100) / 100, clave: i };
  });

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      aria-hidden="true"
      focusable="false"
      className="block h-auto w-full"
    >
      <path d={ladera} fill={PALETA_NOCHE['noche-2']} />
      {/* La aguja de la iglesia: nave y torre sobre la cresta. */}
      <g fill={PALETA_NOCHE['noche-3']}>
        <rect x="662" y="60" width="52" height="30" />
        <rect x="684" y="34" width="10" height="32" />
        <path d="M682 36 L689 8 L696 36 Z" />
      </g>
      {luces.map((l) => (
        <rect
          key={l.clave}
          x={l.x}
          y={l.y}
          width="2.6"
          height="2.6"
          fill={PALETA_NOCHE.sodio}
          opacity={l.opacidad}
        />
      ))}
    </svg>
  );
}
