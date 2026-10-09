import 'server-only';
import { sql } from './neon';

/**
 * Los clientes de cada negocio (migración 031).
 *
 * ── La regla de este archivo ──
 *
 * TODA consulta cruza con `portafolios` y filtra `p.usuario_id = ${usuarioId}`.
 * Los ids de cliente y de negocio llegan del navegador, así que se pueden
 * inventar: el único dato en el que se confía es el `usuarioId` de la sesión
 * firmada. Si una consulta no lleva ese filtro, un aliado podría leer o borrar
 * los clientes de otro. `scripts/verificar-clientes.mjs` falla si alguna lo
 * olvida.
 *
 * ponytail: solo la puerta de la sesión de Google. Quien entra por el enlace
 * del negocio (registro asistido) no tiene este módulo; se suma si alguien de
 * campo lo pide, con el mismo filtro por `token_publico`.
 */

export type EtapaCliente = 'interesado' | 'seguimiento' | 'compro' | 'no_compro';

export type ClienteNegocio = {
  id: string;
  nombre: string;
  telefono: string | null;
  nota: string | null;
  etapa: EtapaCliente;
  /** 'YYYY-MM-DD'. Texto y no Date: una columna `date` como Date se corre de día por la zona horaria. */
  proximo_contacto: string | null;
};

export type DatosCliente = Omit<ClienteNegocio, 'id'>;

/** Tope por negocio: sobra para un micronegocio y le pone techo a un script que llene la tabla. */
export const MAXIMO_CLIENTES = 300;

export async function listarClientes(usuarioId: string, portafolioId: string): Promise<ClienteNegocio[]> {
  const rows = await sql`
    select c.id, c.nombre, c.telefono, c.nota, c.etapa,
           to_char(c.proximo_contacto, 'YYYY-MM-DD') as proximo_contacto
    from clientes_negocio c
    join portafolios p on p.id = c.portafolio_id
    where c.portafolio_id = ${portafolioId} and p.usuario_id = ${usuarioId}
    order by c.proximo_contacto asc nulls last, c.creado_en desc
  `;
  return rows as ClienteNegocio[];
}

export type ResultadoCrearCliente = 'creado' | 'tope' | 'no_disponible';

/**
 * `insert … select` y no `insert … values`: si el negocio no es de este
 * usuario, está archivado o ya llegó al tope, el select no devuelve filas y no
 * se inserta nada. Dueño y cupo se comprueban en la misma sentencia que escribe.
 * Si no se insertó, una segunda lectura dice por qué, para no culpar al tope
 * cuando el negocio ya no está disponible.
 */
export async function crearCliente(
  usuarioId: string,
  portafolioId: string,
  datos: DatosCliente,
): Promise<ResultadoCrearCliente> {
  const rows = await sql`
    insert into clientes_negocio (portafolio_id, nombre, telefono, nota, etapa, proximo_contacto)
    select p.id, ${datos.nombre}, ${datos.telefono}, ${datos.nota}, ${datos.etapa}, ${datos.proximo_contacto}
    from portafolios p
    where p.id = ${portafolioId} and p.usuario_id = ${usuarioId} and p.estado <> 'archivado'
      and (select count(*) from clientes_negocio c where c.portafolio_id = p.id) < ${MAXIMO_CLIENTES}
    returning id
  `;
  if (rows.length > 0) return 'creado';

  const negocio = await sql`
    select (select count(*) from clientes_negocio c where c.portafolio_id = p.id)::int as total
    from portafolios p
    where p.id = ${portafolioId} and p.usuario_id = ${usuarioId} and p.estado <> 'archivado'
  `;
  const total = (negocio[0] as { total: number } | undefined)?.total;
  return total !== undefined && total >= MAXIMO_CLIENTES ? 'tope' : 'no_disponible';
}

export async function actualizarCliente(
  usuarioId: string,
  clienteId: string,
  datos: DatosCliente,
): Promise<boolean> {
  const rows = await sql`
    update clientes_negocio c
    set nombre = ${datos.nombre}, telefono = ${datos.telefono}, nota = ${datos.nota},
        etapa = ${datos.etapa}, proximo_contacto = ${datos.proximo_contacto}, actualizado_en = now()
    from portafolios p
    where c.id = ${clienteId} and p.id = c.portafolio_id and p.usuario_id = ${usuarioId}
      and p.estado <> 'archivado'
    returning c.id
  `;
  return rows.length > 0;
}

export async function borrarCliente(usuarioId: string, clienteId: string): Promise<boolean> {
  const rows = await sql`
    delete from clientes_negocio c
    using portafolios p
    where c.id = ${clienteId} and p.id = c.portafolio_id and p.usuario_id = ${usuarioId}
    returning c.id
  `;
  return rows.length > 0;
}
