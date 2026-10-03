import 'server-only';
import { sql } from './neon';

/**
 * Bitácora (migración 033): qué pasó, quién y sobre qué. Guarda NOMBRES de
 * campos, nunca valores: si guardara el WhatsApp viejo duplicaría datos
 * personales, y borrarlo de la ficha no lo borraría de verdad.
 *
 * Quién lee: el equipo, todo (`listarBitacora` sin filtro); el negocio, solo la
 * de su ficha (quien llama resuelve el `portafolioId` desde su sesión o token).
 * Una entidad, nada.
 */

export type ActorTipo = 'negocio' | 'equipo' | 'entidad' | 'sistema';

export type EntradaBitacora = {
  actor_tipo: ActorTipo;
  /** Email del equipo o id de usuario; null = sistema o dueño por enlace. */
  actor: string | null;
  accion: string;
  portafolio_id?: string | null;
  convocatoria_id?: string | null;
  campos?: readonly string[];
};

/**
 * NUNCA lanza: la bitácora acompaña a la acción, no la condiciona. Si falla, se
 * loguea y la acción principal sigue (mismo criterio que la telemetría del
 * sugeridor). Que el try/catch viva acá y no en cada acción evita que una
 * acción nueva lo olvide y tumbe un registro por una fila de historial.
 */
export async function registrarEnBitacora(entrada: EntradaBitacora): Promise<void> {
  try {
    await sql`
      insert into bitacora (actor_tipo, actor, accion, portafolio_id, convocatoria_id, campos)
      values (
        ${entrada.actor_tipo}, ${entrada.actor}, ${entrada.accion},
        ${entrada.portafolio_id ?? null}, ${entrada.convocatoria_id ?? null},
        ${[...(entrada.campos ?? [])]}::text[]
      )
    `;
  } catch (error) {
    console.error(
      `[bitacora] no se pudo registrar «${entrada.accion}»`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Suma `foto`/`menu` a los campos de una edición cuando vino un archivo nuevo:
 * se suben aparte del update (lib/blob/reemplazar.ts), así que el diff del SQL
 * no los ve. Se anota el intento: si la subida falló, la persona ya recibió el aviso.
 */
export function camposConArchivos(
  campos: readonly string[],
  archivos: { foto: unknown; menu: unknown },
): string[] {
  return [...campos, ...(archivos.foto ? ['foto'] : []), ...(archivos.menu ? ['menu'] : [])];
}

export type FilaBitacora = {
  id: number;
  /** AAAA-MM-DD HH:MI en hora de Bogotá (texto: nada de `Date`). */
  creado_en: string;
  actor_tipo: ActorTipo;
  actor: string | null;
  accion: string;
  portafolio_id: string | null;
  /** Nombre del negocio (para la vista global del equipo); null si no aplica. */
  portafolio_nombre: string | null;
  convocatoria_id: string | null;
  campos: string[];
};

export const POR_PAGINA_BITACORA = 30;

/**
 * Paginada de a `POR_PAGINA_BITACORA`, la más reciente primero. Con
 * `portafolioId` es la historia de una ficha; sin él, la global del equipo.
 * `hayMas` sale de pedir una fila de más, sin un count(*) aparte.
 */
export async function listarBitacora(opciones: {
  portafolioId?: string;
  pagina?: number;
}): Promise<{ filas: FilaBitacora[]; hayMas: boolean }> {
  const pagina = Math.max(1, Math.floor(opciones.pagina ?? 1));
  const desde = (pagina - 1) * POR_PAGINA_BITACORA;
  const portafolioId = opciones.portafolioId ?? null;

  const rows = (await sql`
    select b.id::int as id,
      to_char(b.creado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI') as creado_en,
      b.actor_tipo, b.actor, b.accion, b.portafolio_id,
      p.nombre as portafolio_nombre,
      b.convocatoria_id, b.campos
    from bitacora b
    left join portafolios p on p.id = b.portafolio_id
    where (${portafolioId}::uuid is null or b.portafolio_id = ${portafolioId}::uuid)
    order by b.creado_en desc, b.id desc
    limit ${POR_PAGINA_BITACORA + 1} offset ${desde}
  `) as FilaBitacora[];

  return { filas: rows.slice(0, POR_PAGINA_BITACORA), hayMas: rows.length > POR_PAGINA_BITACORA };
}
