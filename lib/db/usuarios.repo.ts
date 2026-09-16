import 'server-only';
import { sql } from './neon';

export type Usuario = {
  id: string;
  correo: string;
  nombre: string;
  foto_url: string | null;
  creado_en: string;
  ultimo_acceso: string;
};

/**
 * Crea la cuenta o actualiza la existente, y devuelve el usuario.
 *
 * ── Por qué un solo upsert y no "buscar, y si no está, crear" ──
 *
 * Dos pestañas entrando a la vez con la misma cuenta pasan las dos por el
 * "no existe" antes de que ninguna inserte, y la segunda choca contra el
 * índice único. Es raro, pero pasa justo el día de la demostración. El
 * `on conflict` lo vuelve imposible en vez de improbable.
 *
 * El conflicto se resuelve por `google_sub` y no por correo: es el
 * identificador estable de Google. Si la persona cambia el correo de su cuenta,
 * sigue siendo la misma y se le actualiza el correo en vez de crearle una
 * cuenta nueva que no encontraría su propio negocio.
 *
 * Nombre y foto se refrescan en cada ingreso: si los cambió en Google, es
 * porque quiere que se vean así.
 */
export type ResultadoIngreso =
  | { estado: 'ok'; usuario: Usuario }
  /** El correo ya pertenece a OTRA cuenta de Google. Nunca se deja entrar. */
  | { estado: 'correo_tomado' };

export async function ingresarConGoogle(datos: {
  google_sub: string;
  correo: string;
  nombre: string;
  foto_url: string | null;
}): Promise<ResultadoIngreso> {
  try {
    const rows = await sql`
      insert into usuarios (google_sub, correo, nombre, foto_url)
      values (${datos.google_sub}, ${datos.correo}, ${datos.nombre}, ${datos.foto_url})
      on conflict (google_sub) do update set
        correo        = excluded.correo,
        nombre        = excluded.nombre,
        foto_url      = excluded.foto_url,
        ultimo_acceso = now()
      returning id, correo, nombre, foto_url, creado_en, ultimo_acceso
    `;
    return { estado: 'ok', usuario: rows[0] as Usuario };
  } catch (error) {
    // ── 23505: violación de índice único ──
    //
    // La tabla tiene DOS índices únicos, `google_sub` y `correo`, y el
    // `on conflict` de arriba solo resuelve el primero. Este catch existe para
    // el segundo: una cuenta de Google distinta llega con un correo que ya está
    // registrado. Pasa cuando Google Workspace recicla una dirección, o cuando
    // alguien cambió el correo de su cuenta y otro tomó el que dejó libre.
    //
    // ── Por qué NO se resuelve con `on conflict (correo)` ──
    //
    // Sería la corrección obvia y sería un agujero de suplantación. Ese
    // `on conflict` haría que la cuenta nueva SE APODERE de la fila existente
    // —con sus negocios adentro— solo por traer el mismo correo. La identidad
    // acá es `google_sub`, el identificador inmutable de Google, nunca el
    // correo, que es un dato que cambia de manos.
    //
    // Así que no se entra. Se rechaza y alguien del equipo lo mira.
    if (
      error instanceof Error &&
      (error as { code?: string }).code === '23505' &&
      /correo/.test(error.message)
    ) {
      console.error(
        `[usuarios] ingreso rechazado: el correo ya pertenece a otra cuenta de Google` +
          ` (sub que intentó entrar: ${datos.google_sub})`,
      );
      return { estado: 'correo_tomado' };
    }
    throw error;
  }
}

/**
 * Los negocios de una cuenta. Devuelve lo mínimo para listarlos en el panel
 * y personalizar /formalizacion; el detalle completo se lee por token o por
 * id cuando la persona abre uno.
 *
 * `formalidad` NO vive en `portafolios` — vive en `aliados_investigacion`
 * (migración 010), la tabla privada del paso 4 del registro, uno a uno por
 * `portafolio_id`. Hace falta el mismo `left join` que ya usa
 * `obtenerContextoAsesor` en portafolios.repo.ts. `left` y no `join`: el paso
 * 4 es opcional, así que un negocio sin fila ahí tiene que seguir apareciendo
 * en la lista, solo que con `formalidad: null`.
 */
export async function negociosDe(usuarioId: string): Promise<
  { id: string; nombre: string; estado: string; token_publico: string; formalidad: string | null }[]
> {
  const rows = await sql`
    select p.id, p.nombre, p.estado, p.token_publico, i.formalidad
    from portafolios p
    left join aliados_investigacion i on i.portafolio_id = p.id
    where p.usuario_id = ${usuarioId}
    order by p.creado_en desc
  `;
  return rows as {
    id: string;
    nombre: string;
    estado: string;
    token_publico: string;
    formalidad: string | null;
  }[];
}

/**
 * Vincula un negocio ya existente a una cuenta — el caso de quien se registró
 * por enlace y después entra con Google.
 *
 * El `usuario_id is null` del WHERE no es opcional: sin él, quien conozca el
 * token de otro negocio podría reclamarlo como propio. Con él, un negocio ya
 * reclamado no se puede robar, y la función devuelve false en vez de fallar.
 */
export async function vincularNegocio(token: string, usuarioId: string): Promise<boolean> {
  const rows = await sql`
    update portafolios
    set usuario_id = ${usuarioId}
    where token_publico = ${token} and usuario_id is null
    returning id
  `;
  return rows.length > 0;
}
