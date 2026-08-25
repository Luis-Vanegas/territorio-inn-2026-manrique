/**
 * URL pública del sitio, en un solo lugar.
 *
 * La necesitan tres consumidores que tienen que coincidir sí o sí: el
 * `metadataBase` del layout (resuelve las URLs relativas de Open Graph), el
 * `sitemap.ts` y el `robots.ts`. Si cada uno la arma por su cuenta, el día que
 * cambie el dominio uno queda viejo y nadie se entera hasta que un buscador
 * indexa el host equivocado.
 *
 * El orden de resolución no es casual:
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — el dominio propio, cuando exista. Manda siempre.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — el dominio estable de producción que
 *    expone Vercel. Se usa este y NO `VERCEL_URL`, que es distinto en cada
 *    despliegue: una tarjeta de Open Graph apuntando a la URL efímera de un
 *    deploy queda rota apenas se publica el siguiente.
 * 3. localhost — desarrollo.
 *
 * Los despliegues de preview quedan apuntando al dominio de producción a
 * propósito: Vercel ya los marca `noindex` con su propia cabecera, así que no
 * hay riesgo de que se indexen, y el canonical correcto es el de producción.
 */
export function urlSitio(): string {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicita) return explicita.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}
