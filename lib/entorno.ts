/**
 * En qué entorno corre el sitio.
 *
 * Vercel expone `VERCEL_ENV` con tres valores: 'production' para el dominio de
 * producción, 'preview' para cualquier despliegue de rama o pull request, y
 * 'development' para `vercel dev`. Fuera de Vercel (`npm run dev` en la máquina
 * de alguien) la variable no existe: eso es 'local'.
 *
 * ── Por qué una función pura y no leer `process.env` acá adentro ──
 *
 * La tentación es leer `process.env.NEXT_PUBLIC_VERCEL_ENV` directamente, para
 * que el componente de cliente se resuelva solo. El problema es que las
 * variables `NEXT_PUBLIC_` se inyectan en tiempo de compilación y dependen de
 * que Vercel tenga prendido "exponer variables de sistema". Si esa opción está
 * apagada, la variable llega `undefined` **en producción** y el indicador
 * anunciaría "LOCAL" en el sitio real — justo lo contrario de lo que tiene que
 * hacer, y sin que nadie se entere hasta verlo.
 *
 * Con una función pura, el valor lo lee el layout, que es Server Component y
 * siempre ve `VERCEL_ENV` sin prefijo ni configuración extra. El resultado
 * viaja como prop. Cero dependencia de cómo esté configurado el proyecto.
 */

export type Entorno = 'produccion' | 'preproduccion' | 'local';

export function entornoDesde(vercelEnv: string | undefined): Entorno {
  switch (vercelEnv) {
    case 'production':
      return 'produccion';
    case 'preview':
      return 'preproduccion';
    // 'development' es `vercel dev`, que a efectos prácticos es local.
    default:
      return 'local';
  }
}

/** El indicador se muestra en todos lados MENOS en producción. */
export function debeMostrarIndicador(entorno: Entorno): boolean {
  return entorno !== 'produccion';
}

export const ETIQUETA_ENTORNO: Record<Entorno, string> = {
  produccion: 'PRODUCCIÓN',
  preproduccion: 'PREPRODUCCIÓN',
  local: 'LOCAL',
};

/**
 * Ámbar para preproducción: se parece a producción, hay que mirar dos veces.
 * Azul apagado para local: nadie confunde su propia máquina con el sitio real.
 */
export const COLOR_ENTORNO: Record<Entorno, string> = {
  produccion: '#1A1A1A',
  preproduccion: '#B45309',
  local: '#3F5C86',
};
