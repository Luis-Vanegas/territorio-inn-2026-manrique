import type { TipoRuta } from '@/lib/formalizacion';

/**
 * Ícono de trazos por `tipo` de paso (trámite/fondo/formación).
 *
 * Todos comparten `currentColor` y se pintan en `morado-texto` desde
 * TarjetaPaso: es una etiqueta que identifica el tipo, no una acción — mismo
 * criterio que "una función por color" en docs/decisiones-diseno.md (morado
 * = identidad, igual que la categoría en TarjetaEmprendimiento). Variar el
 * color por tipo se leería como arcoíris, justo lo que ese sistema evita.
 */
export function IconoTipoPaso({
  tipo,
  className = 'h-4 w-4',
}: {
  tipo: TipoRuta;
  className?: string;
}) {
  const comunes = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true as const,
  };

  switch (tipo) {
    case 'tramite':
      // Documento con un sello: un trámite es papeleo que termina en un sello.
      return (
        <svg {...comunes}>
          <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v5h5" />
          <circle cx="10.5" cy="15" r="2.4" />
          <path d="m9.3 15.2 1 1 1.8-2.2" />
        </svg>
      );
    case 'fondo':
      // Monedas apiladas: apoyo económico.
      return (
        <svg {...comunes}>
          <ellipse cx="9" cy="7.5" rx="5.5" ry="3" />
          <path d="M3.5 7.5v4.2c0 1.66 2.46 3 5.5 3s5.5-1.34 5.5-3V7.5" />
          <path d="M3.5 11.7v4.2c0 1.66 2.46 3 5.5 3s5.5-1.34 5.5-3v-4.2" />
        </svg>
      );
    case 'formacion':
      // Birrete: formación.
      return (
        <svg {...comunes}>
          <path d="m12 4 10 5-10 5L2 9Z" />
          <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
          <path d="M22 9v6" />
        </svg>
      );
  }
}
