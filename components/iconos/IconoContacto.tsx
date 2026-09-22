type TipoIcono = 'whatsapp' | 'instagram' | 'facebook' | 'telefono' | 'correo';

/**
 * Íconos de contacto para TarjetaEmprendimiento. Trazos inline en vez de una
 * librería nueva (lucide, react-icons): son cinco glifos fijos que no
 * cambian — no vale la pena una dependencia para eso (mismo criterio que
 * "sin ORM" en AGENTS.md, aplicado a paquetes de UI).
 *
 * WhatsApp/Instagram/Facebook llevan su color de marca a propósito: el
 * pedido de diseño es que se reconozcan de un vistazo, que es lo opuesto a
 * la paleta mono-acento del resto del sitio. Teléfono/correo no tienen
 * marca propia, así que quedan en `currentColor` para heredar el tinta del
 * texto en vez de inventarles un color que no representa nada.
 */
export function IconoContacto({
  tipo,
  className = 'h-4 w-4',
}: {
  tipo: TipoIcono;
  className?: string;
}) {
  switch (tipo) {
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            fill="#25D366"
            d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.36a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2Zm5.8 14.15c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.12-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.2 0 .4 0 .57.01.18.01.43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.33.02.53-.1.2-.15.32-.29.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.2.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.7.8 1.99.95.29.14.48.21.55.33.07.12.07.68-.17 1.36Z"
          />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="ig-degradado" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#FED576" />
              <stop offset="26%" stopColor="#F47133" />
              <stop offset="61%" stopColor="#BC3081" />
              <stop offset="100%" stopColor="#4C63D2" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-degradado)" />
          <rect x="6.7" y="6.7" width="10.6" height="10.6" rx="3.4" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="17.3" cy="6.7" r="1.05" fill="#fff" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#1877F2" />
          <path
            fill="#fff"
            d="M15.4 8.4h-1.3c-.5 0-.6.2-.6.6v1.3h1.9l-.2 2h-1.7V17h-2.3v-4.7H9.6v-2h1.6V9c0-1.6.9-2.6 2.5-2.6h1.7v2Z"
          />
        </svg>
      );
    case 'telefono':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2-2c.3-.3.7-.4 1-.2 1 .4 2.2.6 3.3.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.3.6 3.3.1.4 0 .7-.2 1l-2 2Z" />
        </svg>
      );
    case 'correo':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
  }
}
