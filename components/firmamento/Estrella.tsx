import { PALETA_NOCHE } from '@/lib/paleta';

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
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M12 1 L14 10 L23 12 L14 14 L12 23 L10 14 L1 12 L10 10Z" fill={color} />
    </svg>
  );
}
