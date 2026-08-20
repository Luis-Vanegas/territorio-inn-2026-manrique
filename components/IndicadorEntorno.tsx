'use client';

import { useState } from 'react';
import {
  debeMostrarIndicador,
  ETIQUETA_ENTORNO,
  COLOR_ENTORNO,
  type Entorno,
} from '@/lib/entorno';

/**
 * Marca visible de que esto NO es producción.
 *
 * Un despliegue de preproducción es idéntico al real: mismo diseño, mismos
 * textos, y —si comparte base de datos— hasta los mismos registros. La única
 * diferencia está en la URL, que nadie mira. Este punto es lo que evita que
 * alguien apruebe un registro creyendo que está en el sitio vivo, o que
 * muestre preproducción en una reunión pensando que es producción.
 *
 * Decisiones de diseño, en orden de importancia:
 *
 *  1. **El entorno llega como prop desde el layout**, que es Server Component.
 *     Leerlo acá adentro exigiría `NEXT_PUBLIC_VERCEL_ENV`, que depende de una
 *     opción de Vercel: si está apagada, este cartel diría "LOCAL" en el sitio
 *     real. Ver el comentario largo en `lib/entorno.ts`.
 *  2. **No se renderiza en producción.** No es que se oculte con CSS: la
 *     función devuelve `null` y el nodo no llega nunca al HTML. Un indicador
 *     que se esconde con una clase termina apareciendo el día que alguien
 *     toca esa clase.
 *  3. **Se puede minimizar, no cerrar.** Queda como un punto de 10px en la
 *     esquina. Si se pudiera cerrar del todo, alguien lo cerraría el primer
 *     día y el aviso dejaría de existir justo cuando hace falta.
 *  4. **Abajo a la izquierda**, que es la esquina más vacía del sitio, y con
 *     `pointer-events-none` sobre el contenedor para no tapar ningún control.
 *  5. **`aria-hidden`**: es información para quien mira la pantalla mientras
 *     desarrolla, no contenido del sitio. Anunciárselo a un lector de
 *     pantalla en cada página sería ruido.
 */
export function IndicadorEntorno({ entorno }: { entorno: Entorno }) {
  const [minimizado, setMinimizado] = useState(false);

  if (!debeMostrarIndicador(entorno)) return null;

  const etiqueta = ETIQUETA_ENTORNO[entorno];
  const color = COLOR_ENTORNO[entorno];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-3 left-3 z-[200] flex items-center"
    >
      <button
        type="button"
        onClick={() => setMinimizado((m) => !m)}
        style={{
          borderColor: color,
          color: minimizado ? undefined : color,
          // La geometría del punto va inline y no en clases: `rounded-full` y
          // `h-3.5` dependen de que Tailwind las genere, y los estilos base del
          // proyecto ya pisan el radio de los <button>. Inline es determinista.
          ...(minimizado
            ? { width: 12, height: 12, borderRadius: 9999, padding: 0 }
            : {}),
        }}
        className={`pointer-events-auto flex shrink-0 items-center border bg-hueso/95 font-mono text-[10px] uppercase tracking-wider shadow-sm backdrop-blur-sm transition-colors ${
          minimizado ? '' : 'gap-2 px-2.5 py-1.5'
        }`}
        title={
          minimizado
            ? `${etiqueta} — clic para expandir`
            : `${etiqueta} — este no es el sitio de producción. Clic para minimizar.`
        }
      >
        {minimizado ? (
          <span
            aria-hidden="true"
            style={{ backgroundColor: color, borderRadius: 9999 }}
            className="block h-full w-full"
          />
        ) : (
          <>
            <span
              aria-hidden="true"
              style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 9999 }}
              className="block shrink-0"
            />
            {etiqueta}
          </>
        )}
      </button>
    </div>
  );
}
