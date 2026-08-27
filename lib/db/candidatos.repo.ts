import 'server-only';
import { sql } from './neon';

/**
 * Repositorio del módulo Empleo.
 *
 * A diferencia de `servicios.repo.ts`, no hay un repo "privado" hermano: acá
 * no se guarda nada que no se publique. Ver `lib/validation/candidato.schema.ts`.
 */

export type Candidato = {
  id: string;
  nombre: string;
  telefono: string;
  nivel_formacion: string;
  programa: string | null;
  graduado: boolean | null;
  experiencia: string;
  busca: string;
  creado_en: string;
};

const COLUMNAS = `
  id, nombre, telefono, nivel_formacion, programa, graduado, experiencia, busca,
  to_char(creado_en, 'YYYY-MM-DD') as creado_en
`;

/** Los aprobados para la vitrina, más recientes primero. */
export async function listarCandidatosAprobados(): Promise<Candidato[]> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS)}
    from candidatos
    where estado = 'aprobado'
    order by creado_en desc
  `;
  return rows as Candidato[];
}

export type NuevoCandidato = {
  nombre: string;
  telefono: string;
  nivel_formacion: string;
  programa: string | null;
  graduado: boolean | null;
  experiencia: string;
  busca: string;
  version_terminos: string;
};

/** Inserta como 'pendiente'. No se publica hasta que un moderador lo apruebe. */
export async function crearCandidato(datos: NuevoCandidato): Promise<{ id: string }> {
  const rows = (await sql`
    insert into candidatos (
      nombre, telefono, nivel_formacion, programa, graduado, experiencia, busca,
      acepto_terminos, acepto_habeas_data, version_terminos
    ) values (
      ${datos.nombre}, ${datos.telefono}, ${datos.nivel_formacion}, ${datos.programa},
      ${datos.graduado}, ${datos.experiencia}, ${datos.busca},
      true, true, ${datos.version_terminos}
    )
    returning id
  `) as { id: string }[];

  const fila = rows[0];
  if (!fila) throw new Error('El insert de candidato no devolvió id');
  return fila;
}

/** Cola de moderación. */
export type CandidatoPendiente = Candidato;

export async function listarCandidatosPendientes(): Promise<CandidatoPendiente[]> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS)}
    from candidatos
    where estado = 'pendiente'
    order by creado_en
  `;
  return rows as CandidatoPendiente[];
}

export async function moderarCandidato(
  id: string,
  estado: 'aprobado' | 'rechazado',
  moderador: string,
  motivo?: string,
): Promise<void> {
  await sql`
    update candidatos
    set estado = ${estado}::portafolio_estado,
        motivo_rechazo = ${motivo ?? null},
        moderado_por = ${moderador},
        moderado_en = now(),
        actualizado_en = now()
    where id = ${id}
  `;
}

/** Conteo para el home y el panel, sin traer filas. */
export async function contarCandidatosAprobados(): Promise<number> {
  const rows = (await sql`
    select count(*)::int as total from candidatos where estado = 'aprobado'
  `) as { total: number }[];
  return rows[0]?.total ?? 0;
}
