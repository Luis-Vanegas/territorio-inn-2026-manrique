import 'server-only';
import { sql } from './neon';

export type TipoCampoPersonalizado = 'texto' | 'numero' | 'si_no' | 'seleccion';

export type DefinicionCampo = {
  id: string;
  slug: string;
  etiqueta: string;
  tipo: TipoCampoPersonalizado;
  opciones: string[] | null;
  requerido: boolean;
  ayuda: string | null;
  orden: number;
  activo: boolean;
};

/** Lo que ve el formulario público y las vistas de la vitrina: solo lo activo. */
export async function listarCamposActivos(): Promise<DefinicionCampo[]> {
  const rows = await sql`
    select id, slug, etiqueta, tipo, opciones, requerido, ayuda, orden, activo
    from definiciones_campo
    where activo = true
    order by orden, etiqueta
  `;
  return rows as DefinicionCampo[];
}

/** Lo que ve el admin: todo, para poder reactivar un campo desactivado. */
export async function listarTodosLosCampos(): Promise<DefinicionCampo[]> {
  const rows = await sql`
    select id, slug, etiqueta, tipo, opciones, requerido, ayuda, orden, activo
    from definiciones_campo
    order by activo desc, orden, etiqueta
  `;
  return rows as DefinicionCampo[];
}

export async function obtenerCampo(id: string): Promise<DefinicionCampo | null> {
  const rows = await sql`
    select id, slug, etiqueta, tipo, opciones, requerido, ayuda, orden, activo
    from definiciones_campo
    where id = ${id}
  `;
  return (rows[0] as DefinicionCampo) ?? null;
}

export type NuevoCampo = {
  slug: string;
  etiqueta: string;
  tipo: TipoCampoPersonalizado;
  opciones: string[] | null;
  requerido: boolean;
  ayuda: string | null;
};

export async function crearCampo(datos: NuevoCampo, creadoPor: string): Promise<string> {
  const rows = await sql`
    insert into definiciones_campo (slug, etiqueta, tipo, opciones, requerido, ayuda, orden, creado_por)
    values (
      ${datos.slug}, ${datos.etiqueta}, ${datos.tipo},
      ${datos.opciones ? JSON.stringify(datos.opciones) : null}::jsonb,
      ${datos.requerido}, ${datos.ayuda},
      (select coalesce(max(orden), 0) + 1 from definiciones_campo),
      ${creadoPor}
    )
    returning id
  `;
  return (rows[0] as { id: string }).id;
}

export type EdicionCampo = {
  etiqueta: string;
  opciones: string[] | null;
  requerido: boolean;
  ayuda: string | null;
};

/**
 * Edita etiqueta, opciones, requerido y ayuda. El slug y el tipo NO se
 * editan: son la clave con la que ya se guardaron valores en campos_extra de
 * registros existentes — cambiarlos rompería esos datos en silencio. Para un
 * cambio de tipo, la vía correcta es desactivar el campo y crear uno nuevo.
 */
export async function editarCampo(id: string, datos: EdicionCampo): Promise<void> {
  await sql`
    update definiciones_campo
    set etiqueta = ${datos.etiqueta},
        opciones = ${datos.opciones ? JSON.stringify(datos.opciones) : null}::jsonb,
        requerido = ${datos.requerido},
        ayuda = ${datos.ayuda}
    where id = ${id}
  `;
}

export async function cambiarActivo(id: string, activo: boolean): Promise<void> {
  await sql`update definiciones_campo set activo = ${activo} where id = ${id}`;
}
