import type { NombreIcono } from '@/lib/firmamento/navegacion';

/**
 * Iconos de línea del menú de los paneles. Decorativos (`aria-hidden`): el
 * nombre del ítem está en el texto. Trazo `currentColor`, así toman el color del
 * ítem (activo, inactivo, foco) sin una regla aparte.
 */
const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  inicio: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5" />,
  ficha: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </>
  ),
  regalo: (
    <>
      <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
      <path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5C12 6 10.5 4.5 9 4.5S6.8 6.3 8 7.5c.8.8 2.4 1 4 1Zm0 0c0-2.5 1.5-4 3-4s2.2 1.8 1 3c-.8.8-2.4 1-4 1Z" />
    </>
  ),
  mapa: <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 0v14m6-12v14" />,
  escudo: <path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-2.5Zm-3 8.5 2.2 2.2L15.5 10" />,
  megafono: <path d="M4 10v4h3l7 4V6l-7 4H4Zm13-1.5a5 5 0 0 1 0 7M7 14l1.5 5.5h2.5L10 15.5" />,
  datos: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" />
      <path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" />
    </>
  ),
  cerebro: (
    <path d="M9.5 4A3.5 3.5 0 0 0 6 7.5 3.5 3.5 0 0 0 4.5 11 3.5 3.5 0 0 0 6 14.5 3.5 3.5 0 0 0 9.5 20H12V4H9.5Zm5 0A3.5 3.5 0 0 1 18 7.5 3.5 3.5 0 0 1 19.5 11 3.5 3.5 0 0 1 18 14.5a3.5 3.5 0 0 1-3.5 5.5H12V4h2.5Z" />
  ),
  ojo: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  grafica: <path d="M4 4v16h16M8 16v-4m4 4V8m4 8v-6" />,
  personas: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5M15.5 5.2a3 3 0 0 1 0 5.6M17 14.6c2 .5 3.5 2.3 3.5 4.9" />
    </>
  ),
  buzon: <path d="M3.5 13.5 6 5h12l2.5 8.5V19h-17v-5.5Zm0 0H8l1.5 2.5h5l1.5-2.5h4.5" />,
  maletin: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V5.5h6v2M3.5 12.5h17" />
    </>
  ),
  ajustes: <path d="M4 7h10m4 0h2M4 17h4m4 0h8M14 4.5v5M8 14.5v5" />,
  libro: <path d="M4 5.5C6.5 4.5 9.5 4.5 12 6v13.5c-2.5-1.5-5.5-1.5-8-.5V5.5Zm16 0c-2.5-1-5.5-1-8 .5v13.5c2.5-1.5 5.5-1.5 8-.5V5.5Z" />,
  chat: <path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5H4.5v-10Z" />,
  mas: (
    <>
      <circle cx="6" cy="12" r="1.25" />
      <circle cx="12" cy="12" r="1.25" />
      <circle cx="18" cy="12" r="1.25" />
    </>
  ),
};

export function IconoPanel({ nombre, tamano = 20 }: { nombre: NombreIcono; tamano?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
