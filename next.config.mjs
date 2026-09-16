/** @type {import('next').NextConfig} */

/**
 * Content-Security-Policy, en modo REPORTE.
 *
 * ── Por qué Report-Only y no aplicada ──
 *
 * Una CSP aplicada que se equivoca en un origen rompe el sitio EN SILENCIO: el
 * mapa se queda gris, las fotos no cargan, y nadie ve un error salvo en la
 * consola del navegador. Este sitio carga teselas de mapa, fotos de Vercel
 * Blob, avatares de Google y los estilos inline que emite Next, así que la
 * lista de orígenes hay que descubrirla contra el sitio real, no adivinarla.
 *
 * En modo reporte, el navegador NO bloquea nada: solo anota en su consola cada
 * cosa que la política habría frenado. Eso permite recorrer el sitio, juntar
 * las violaciones legítimas, ajustar la lista, y recién entonces cambiar la
 * cabecera a `Content-Security-Policy` para que empiece a bloquear.
 *
 * ── El pendiente real: los scripts ──
 *
 * `script-src` lleva 'unsafe-inline' porque Next emite scripts inline para
 * hidratar la página. Con eso, la política NO protege contra XSS, que es lo
 * único que de verdad importa de una CSP. Quitarlo pide nonces por request
 * generados en un middleware, y eso es un cambio de arquitectura, no una
 * línea. Mientras tanto esta política sí acota de dónde salen imágenes,
 * conexiones, marcos y formularios — que es real y es barato.
 *
 * No la pases a modo bloqueo sin antes recorrer el sitio entero con la consola
 * abierta: el registro con mapa y foto, la vitrina, y el panel de moderación.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' y 'unsafe-eval': los emite Next para hidratar. Ver arriba.
  //
  // va.vercel-scripts.com sirve @vercel/analytics y @vercel/speed-insights, los
  // dos paquetes que ya están en package.json y se montan en el layout. También
  // lo encontró el modo reporte: sin este origen, las dos métricas se cortan en
  // silencio y el panel de Vercel queda vacío sin que nadie sepa por qué.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  // Tailwind y Next inyectan estilos inline; sin esto no queda nada con forma.
  "style-src 'self' 'unsafe-inline'",
  // data: para los SVG en línea; blob: para la previsualización de la foto
  // antes de subirla.
  //
  // El origen del mapa es ArcGIS, NO OpenStreetMap: sale de `TESELAS.url` en
  // lib/geo/constantes.ts. Se descubrió con la política en modo reporte, que
  // marcó 67 violaciones al abrir /aliados — con la política aplicada, el mapa
  // se habría quedado gris sin un solo error visible. Si algún día se cambia
  // el proveedor de teselas, hay que cambiar este origen en el mismo commit.
  // El avatar de Google no siempre sale de lh3: rota entre lh3..lh6 según el
  // centro de datos, así que va con comodín. Un origen fijo funciona hasta que
  // a alguien le toca lh5 y su foto no carga solo para esa persona.
  //
  // i.ytimg.com sirve las miniaturas de los videos de /formalizacion: se
  // muestran antes de que la persona haga clic en reproducir. Ver frame-src.
  "img-src 'self' data: blob: https://services.arcgisonline.com https://*.public.blob.vercel-storage.com https://*.googleusercontent.com https://i.ytimg.com",
  "font-src 'self' data:",
  // A dónde puede hablar el navegador: el propio sitio y la telemetría de
  // Vercel. El asesor NO va acá — esa llamada sale del servidor, no del cliente.
  "connect-src 'self' https://*.vercel-insights.com https://*.vercel-analytics.com",
  // Único origen permitido: youtube-nocookie.com, y solo para los videos de
  // /formalizacion. El iframe NO se monta al cargar la página — recién entra
  // al DOM cuando la persona hace clic en reproducir (VideoEmbebido.tsx) — así
  // que visitar la página no le pide nada a YouTube. Todo lo demás sigue
  // vetado: nunca un iframe del propio sitio ni de ningún otro origen.
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  // Refuerza X-Frame-Options con la versión moderna del mismo control.
  "frame-ancestors 'none'",
  // Los formularios solo pueden enviarse al propio sitio. Corta el truco de
  // inyectar un formulario que postea las credenciales a otro dominio.
  "form-action 'self'",
  // Impide que un <base> inyectado reescriba todas las URLs relativas.
  "base-uri 'self'",
  // Sin `upgrade-insecure-requests`: el navegador lo IGNORA en una política de
  // solo reporte y ensucia la consola con un error por carga de página, que es
  // justo lo que no queremos mientras usamos la consola para juntar
  // violaciones reales. **Reponelo al pasar a modo bloqueo** — ahí sí hace
  // algo. Mientras tanto, HSTS ya cubre el mismo caso.
].join('; ');

/**
 * Cabeceras de seguridad para todas las rutas.
 */
const cabecerasSeguridad = [
  {
    // Report-Only: anota, no bloquea. Ver el comentario largo de arriba.
    key: 'Content-Security-Policy-Report-Only',
    value: csp,
  },
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
    ],
    // Solo AVIF y WebP, y en pocos anchos: cada combinación de ancho×formato
    // es una transformación facturable en Vercel y una entrada más de cache.
    // Los anchos declarados cubren los `sizes` que el sitio usa de verdad
    // (208px en tarjeta, 100vw en móvil) — pedir la escalera completa por
    // defecto genera variantes que nadie llega a solicitar.
    formats: ['image/avif', 'image/webp'],
    // Next 16 cambió el default de `qualities` a `[75]`, y un `quality` que no
    // esté en esta lista NO falla: se degrada en silencio al valor más cercano.
    // El 90 es para las fotos del carrusel del inicio, que son grandes y con
    // mucho detalle de color — a 75 el ladrillo y las fachadas pintadas salen
    // con artefactos. El resto del sitio sigue en 75.
    qualities: [75, 90],
    deviceSizes: [640, 828, 1080, 1200, 1600],
    imageSizes: [128, 208, 384],
    // Las fotos son inmutables por id: si cambia, cambia el id del registro.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  async headers() {
    return [{ source: '/:path*', headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
