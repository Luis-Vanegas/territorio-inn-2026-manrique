import { textoCampos } from '@/components/firmamento/panel/Bitacora';
import type { FilaBitacora } from '@/lib/db/bitacora.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';

/**
 * «Cambios en tu ficha»: la bitácora de UN negocio, leída por su dueño. Dice
 * qué cambió él y qué corrigió el equipo, con la fecha y los NOMBRES de los
 * campos («WhatsApp», «foto»), nunca lo que decían: la bitácora no guarda
 * valores (lib/db/bitacora.repo.ts).
 *
 * Quien llama pasa filas de un negocio que ya se comprobó de la sesión
 * (`obtenerPropio`). Aquí no sale el correo con el que firma cada persona del
 * equipo: el dueño ve «El equipo», no a quién.
 */

// [cuando lo hizo el dueño, cuando lo hizo el equipo]. Una acción sin pareja
// (convocatorias) no llega aquí: esas filas no llevan portafolio.
const ACCION: Record<string, readonly [string, string]> = {
  registrado: ['registraste tu negocio', 'registró tu negocio'],
  ficha_editada: ['editaste tu ficha', 'editó tu ficha'],
  categoria_corregida: ['corregiste la categoría', 'corrigió la categoría'],
  aprobado: ['aprobaste tu ficha', 'aprobó y publicó tu ficha'],
  rechazado: ['rechazaste tu ficha', 'no pudo publicar tu ficha'],
  archivado: ['archivaste tu ficha', 'archivó tu ficha'],
};

function frase(f: FilaBitacora): { quien: string; que: string } {
  const propio = f.actor_tipo === 'negocio';
  const quien = propio ? 'Tú' : f.actor_tipo === 'equipo' ? 'El equipo' : 'El sistema';
  const par = ACCION[f.accion];
  return { quien, que: par ? par[propio ? 0 : 1] : propio ? 'hiciste un cambio' : 'hizo un cambio' };
}

const SIN_CAMPOS = new Set(['aprobado', 'rechazado', 'archivado', 'registrado']);

export function CambiosFicha({ filas }: { filas: readonly FilaBitacora[] }) {
  if (filas.length === 0) {
    return (
      <p className="font-sans text-base leading-relaxed text-tinta/70">
        Todavía no hay cambios anotados en tu ficha. Cuando edites algo, o el equipo corrija un dato, queda aquí con
        su fecha.
      </p>
    );
  }

  return (
    <>
      <ol className="flex flex-col">
        {filas.map((f) => {
          const { quien, que } = frase(f);
          return (
            <li
              key={f.id}
              className="grid gap-x-4 gap-y-0.5 border-t border-tinta/12 py-3 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_minmax(0,1fr)]"
            >
              <time dateTime={f.creado_en.slice(0, 10)} className="font-sans text-sm leading-6 text-tinta/70">
                {fechaLarga(f.creado_en)}
              </time>
              <p className="min-w-0 break-words font-sans text-base leading-6 text-tinta">
                {quien} {que}
                {f.campos.length > 0 && !SIN_CAMPOS.has(f.accion) && (
                  <span className="text-tinta/70"> · {textoCampos(f.campos)}</span>
                )}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
        Anotamos qué campo cambió, no lo que decía: así tus datos no quedan copiados en el historial.
      </p>
    </>
  );
}
