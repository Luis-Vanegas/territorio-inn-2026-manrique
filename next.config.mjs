/** @type {import('next').NextConfig} */

/**
 * Cabeceras de seguridad para todas las rutas.
 *
 * No hay Content-Security-Policy todavía, y es una omisión consciente: una CSP
 * mal armada rompe en silencio (las tiles del mapa, las fotos del Blob, los
 * estilos inline que emite Next) y una CSP con 'unsafe-inline' en scripts no
 * protege de nada. Hacerla bien pide nonces por request vía middleware y
 * probarla contra el sitio real. Está anotada como el siguiente paso en
 * docs/seguridad.md, no olvidada.
 */
const cabecerasSeguridad = [
  {
    // El panel de moderación no debe poder embeberse en un iframe ajeno: es
    // la defensa contra clickjacking sobre los botones de aprobar y rechazar.
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Impide que el navegador "adivine" el tipo de una respuesta. Sin esto,
    // un archivo subido que el navegador decida tratar como HTML se ejecuta.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Al salir del sitio se manda el origen, nunca la URL completa: una ruta
    // del panel no tiene por qué aparecer en los logs de un tercero.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Se apaga todo lo que el sitio no usa. `geolocation=(self)` queda
    // habilitado a propósito: es lo que permite "ver los que tengo cerca"
    // y elegir la ubicación en el registro.
    key: 'Permissions-Policy',
    value: 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
  },
  {
    // Dos años, subdominios incluidos. Vercel ya sirve solo HTTPS; esto evita
    // el primer request en texto plano de quien escribe el dominio a mano.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  // Apagado a propósito desde el upgrade a Next 16: bajo Strict Mode, el
  // remontaje de control que hace React en dev llega a `<MapContainer>`
  // (react-leaflet) como un "reappear" en vez de un unmount/mount limpio, y
  // Leaflet tira "Map container is already initialized" — bug abierto y sin
  // resolver en react-leaflet (github.com/PaulLeCam/react-leaflet#1069,
  // #1133), no algo arreglable desde este código. Solo afecta al dev server:
  // en producción React nunca duplica efectos, con o sin este flag.
  reactStrictMode: false,
  images: {
    // Las fotos de los portafolios viven en Vercel Blob, en un subdominio que
    // depende del store. Sin esta entrada, next/image rechaza la URL en runtime.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        pathname: '/portafolios/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
