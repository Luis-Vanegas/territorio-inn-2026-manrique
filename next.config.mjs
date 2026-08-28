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
  experimental: {
    serverActions: {
      // El default de Next son 1 MB, y todo el sitio promete fotos de hasta 5 MB
      // (`TAMANO_MAX_FOTO` en lib/validation/portafolio.schema.ts). Sin esta línea
      // cualquier foto de celular —2 a 6 MB— se estrellaba con un 413 "Body exceeded
      // 1 MB limit" DESPUÉS de que la persona llenó el formulario entero, y la
      // pantalla de error le echaba la culpa a la base de datos.
      //
      // El límite cuenta el body crudo, incluido lo que multipart/form-data suma en
      // boundaries y metadatos de cada campo, así que va por encima de los 5 MB del
      // archivo para dejar margen.
      bodySizeLimit: '6mb',
    },
  },
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
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        pathname: '/servicios/**',
      },
    ],
    // Solo AVIF y WebP, y en pocos anchos: cada combinación de ancho×formato
    // es una transformación facturable en Vercel y una entrada más de cache.
    // Los anchos declarados cubren los `sizes` que el sitio usa de verdad
    // (208px en tarjeta, 100vw en móvil) — pedir la escalera completa por
    // defecto genera variantes que nadie llega a solicitar.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [128, 208, 384],
    // Las fotos son inmutables por id: si cambia, cambia el id del registro.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  async headers() {
    return [{ source: '/:path*', headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
