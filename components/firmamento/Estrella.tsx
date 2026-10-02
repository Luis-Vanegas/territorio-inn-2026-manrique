import { PALETA_NOCHE } from '@/lib/paleta';
import { ESTRELLA_PATH, ESTRELLA_VIEWBOX } from '@/components/mapa/formas';

/**
 * Estrella de cuatro puntas (DESIGN.md › Firmamento › Motivos): un negocio, y
 * el sello que acompaña a cada indicador. Decorativa: el dato lo dice el texto.
 */
export function Estrella({
  tamano = 22,
  color = PALETA_NOCHE.sodio,
  className,
}: {
  tamano?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={ESTRELLA_VIEWBOX}
      width={tamano}
      height={tamano}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={ESTRELLA_PATH} fill={color} />
    </svg>
  );
}
