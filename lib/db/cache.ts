import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';

/**
 * Caché de las lecturas públicas (vitrina, conteos, categorías, campos).
 *
 * Por qué existe: las rutas públicas son `force-dynamic` y cada visita hacía de
 * 3 a 5 consultas a Neon. La base se cobra por tiempo despierta, no por carga,
 * así que leer siempre de la base era lo que más caro salía. Ahora la lectura
 * sale de la caché de Next y solo se vuelve a la base cuando algo cambia.
 *
 * Por qué NO se repite el error de `revalidate = 300` (ver /aliados): aquel
 * caché no tenía invalidación y un negocio aprobado tardaba cinco minutos en
 * verse. Acá cada escritura que cambia lo público llama `invalidarVitrina()`,
 * con expiración inmediata, así que lo aprobado aparece en la visita siguiente.
 *
 * `revalidate: 600` es solo la red de seguridad para lo que cambia por fuera de
 * las acciones (un `update` a mano, `seed-demo.mjs`): como mucho 10 minutos
 * viejo. Toda acción nueva que escriba en portafolios, categorías o campos
 * personalizados debe llamar `invalidarVitrina()`.
 */

const ETIQUETA = 'vitrina';

export function cachearVitrina<A extends unknown[], R>(
  lectura: (...args: A) => Promise<R>,
  clave: string,
): (...args: A) => Promise<R> {
  return unstable_cache(lectura, [clave], { tags: [ETIQUETA], revalidate: 600 });
}

export function invalidarVitrina(): void {
  revalidateTag(ETIQUETA, { expire: 0 });
}
