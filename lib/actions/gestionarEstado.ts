'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { invalidarVitrina } from '@/lib/db/cache';
import {
  actualizarPortafolioSchema,
  desdeFormDataEdicion,
} from '@/lib/validation/portafolio.schema';
import {
  actualizarPorToken,
  archivarPorToken,
  listarCategorias,
  tokenPropio,
  type EdicionAplicada,
} from '@/lib/db/portafolios.repo';
import { registrarEnBitacora, camposConArchivos, type EntradaBitacora } from '@/lib/db/bitacora.repo';
import { guardarSugerenciaCategoria } from '@/lib/db/sugerencias.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';
import { borrarFoto, extraerArchivoValidado } from '@/lib/blob/fotos';
import { reemplazarArchivos } from '@/lib/blob/reemplazar';
import { sesionActual } from '@/lib/auth/usuario';
import { respuestaASugerencia, sugerenciaDesdeFormData } from '@/lib/validation/sugerenciaCategoria.schema';

export type EstadoEdicion =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje?: string; errores?: Record<string, string[]> };

/**
 * Autoservicio del dueño de una ficha, por sus DOS puertas con la misma regla:
 *
 *   - el enlace con token (`/aliados/estado/[token]`): el token es la única
 *     credencial, no hay sesión. `actualizarPorToken` y `archivarPorToken` solo
 *     tocan la fila cuyo token_publico matchea; un token equivocado no encuentra
 *     nada.
 *   - la cuenta de Google (`/firmamento/negocio/ficha`): `actualizarFichaDeCuenta`
 *     y `borrarFichaDeCuenta` revalidan la sesión y resuelven el token del
 *     negocio con `tokenPropio` (que filtra por `usuario_id` de la sesión, no
 *     por un id del formulario) y siguen el mismo camino, así que no hay una
 *     segunda ruta de SQL que se desincronice.
 *
 * La edición de una ficha APROBADA publica directo (sigue aprobada); una
 * pendiente o rechazada sigue el flujo de revisión. Ver `actualizarPorToken`.
 *
 * Se llaman con la clave ya aplicada (`actualizarPortafolio.bind(null, token)`)
 * para calzar con la firma que espera `useActionState`:
 * `(prevState, formData) => State`.
 */

type Actor = Pick<EntradaBitacora, 'actor_tipo' | 'actor'>;

/** Quien edita por enlace no tiene otra identidad que el token; quien entra con Google, su id de cuenta. */
const ACTOR_ENLACE: Actor = { actor_tipo: 'negocio', actor: null };

async function editarFicha(
  token: string,
  formData: FormData,
  actor: Actor,
  rutasExtra: string[],
): Promise<EstadoEdicion> {
  const ip = ipDesdeHeaders(await headers());

  const limite = await verificarLimite(ip, 'estado');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Prueba de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip, 'estado');

  const parsed = actualizarPortafolioSchema.safeParse(desdeFormDataEdicion(formData));
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors };
  }
  const datos = parsed.data;

  const validacionFoto = extraerArchivoValidado(formData, 'foto', 'La foto');
  if (!validacionFoto.ok) {
    return { estado: 'error', errores: { foto: [validacionFoto.mensaje] } };
  }
  const foto = validacionFoto.archivo;

  const validacionMenu = extraerArchivoValidado(formData, 'menu', 'El menú');
  if (!validacionMenu.ok) {
    return { estado: 'error', errores: { menu: [validacionMenu.mensaje] } };
  }
  const menu = validacionMenu.archivo;

  let edicion: EdicionAplicada | null;
  try {
    edicion = await actualizarPorToken(token, {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      categoria_id: datos.categoria_id,
      categoria_otra: datos.categoria_otra,
      direccion: datos.direccion,
      barrio: datos.barrio,
      latitud: datos.latitud,
      longitud: datos.longitud,
      punto_referencia: datos.punto_referencia,
      whatsapp: datos.whatsapp,
      correo: datos.correo,
      instagram: datos.instagram,
      facebook: datos.facebook,
      horario: datos.horario,
      medios_pago: datos.medios_pago,
      productos: datos.productos,
    });
  } catch (error) {
    console.error('[actualizarPortafolio] update falló', error);
    return { estado: 'error', mensaje: 'No pudimos guardar los cambios. Intenta de nuevo.' };
  }

  if (!edicion) {
    return {
      estado: 'error',
      mensaje: 'No encontramos ese registro: puede que el enlace esté mal copiado o que ya lo hayas borrado.',
    };
  }
  const { id } = edicion;

  // Igual que en el registro: la foto es lo último y lo que menos importa
  // perder. A diferencia del registro, acá sí hay a dónde volver a mostrar el
  // aviso: esta misma respuesta.
  const avisos = await reemplazarArchivos(id, { foto, menu }, 'actualizarPortafolio');

  // Sugeridor de categoría (telemetría, como en el registro): si falla, la
  // edición ya está guardada. Solo la categoría inferida, nunca el texto.
  try {
    const sugerencia = sugerenciaDesdeFormData(formData);
    if (sugerencia && (await listarCategorias()).some((c) => c.id === sugerencia.categoria_inferida)) {
      await guardarSugerenciaCategoria({
        portafolio_id: id,
        categoria_inferida: sugerencia.categoria_inferida,
        confianza: sugerencia.confianza,
        aceptada: respuestaASugerencia(sugerencia.categoria_inferida, formData.get('categoria_id')),
      });
    }
  } catch (error) {
    console.error('[actualizarPortafolio] guardado de la sugerencia falló', error);
  }

  await registrarEnBitacora({
    ...actor,
    accion: 'ficha_editada',
    portafolio_id: id,
    campos: camposConArchivos(edicion.campos, { foto, menu }),
  });

  revalidatePath('/aliados');
  invalidarVitrina();
  revalidatePath('/admin/aliados');
  for (const ruta of rutasExtra) revalidatePath(ruta);

  // Una ficha aprobada sigue aprobada: el cambio se ve al instante. Las demás
  // siguen en revisión y aquí no prometemos nada que no pase.
  const base =
    edicion.estado === 'aprobado'
      ? 'Guardado. Tus cambios ya están publicados.'
      : 'Guardado. Tu ficha está en revisión; apenas la aprobemos aparece en el mapa.';
  return {
    estado: 'ok',
    mensaje: avisos.length > 0 ? `${base} ${avisos.join(' ')}` : base,
  };
}

export async function actualizarPortafolio(
  token: string,
  _anterior: EstadoEdicion,
  formData: FormData,
): Promise<EstadoEdicion> {
  return editarFicha(token, formData, ACTOR_ENLACE, [`/aliados/estado/${token}`, '/firmamento/negocio']);
}

/** Edición desde el panel (`/firmamento/negocio/ficha`): misma regla, otra puerta. */
export async function actualizarFichaDeCuenta(
  portafolioId: string,
  _anterior: EstadoEdicion,
  formData: FormData,
): Promise<EstadoEdicion> {
  const sesion = await sesionActual();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const token = await tokenPropio(sesion.id, portafolioId);
  if (!token) return { estado: 'error', mensaje: 'No encontramos ese negocio en tu cuenta.' };

  return editarFicha(token, formData, { actor_tipo: 'negocio', actor: sesion.id }, ['/firmamento/negocio', `/aliados/estado/${token}`]);
}

/**
 * Borrado propio. Mismo criterio que `moderarPortafolio` al archivar: se
 * libera el Blob de la foto para no seguir pagando por ni exponiendo una
 * imagen de un negocio que ya pidió salir.
 */
async function borrarFicha(token: string, actor: Actor, rutasExtra: string[]): Promise<EstadoEdicion> {
  const ip = ipDesdeHeaders(await headers());

  const limite = await verificarLimite(ip, 'estado');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Prueba de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip, 'estado');

  let resultado: {
    id: string;
    foto_blob_pathname: string | null;
    menu_blob_pathname: string | null;
  } | null;
  try {
    resultado = await archivarPorToken(token);
  } catch (error) {
    console.error('[borrarPortafolio] falló', error);
    return { estado: 'error', mensaje: 'No pudimos borrar el registro. Intenta de nuevo.' };
  }

  if (!resultado) {
    return {
      estado: 'error',
      mensaje: 'No encontramos ese registro, o ya estaba borrado.',
    };
  }

  if (resultado.foto_blob_pathname) {
    try {
      await borrarFoto(resultado.foto_blob_pathname);
    } catch (error) {
      console.error('[borrarPortafolio] no se pudo borrar la foto', error);
    }
  }

  if (resultado.menu_blob_pathname) {
    try {
      await borrarFoto(resultado.menu_blob_pathname);
    } catch (error) {
      console.error('[borrarPortafolio] no se pudo borrar el menú', error);
    }
  }

  await registrarEnBitacora({
    ...actor,
    accion: 'archivado',
    portafolio_id: resultado.id,
  });

  revalidatePath('/aliados');
  invalidarVitrina();
  revalidatePath('/admin/aliados');
  for (const ruta of rutasExtra) revalidatePath(ruta);

  return { estado: 'ok', mensaje: 'Tu negocio se borró del directorio.' };
}

export async function borrarPortafolio(token: string): Promise<EstadoEdicion> {
  return borrarFicha(token, ACTOR_ENLACE, [`/aliados/estado/${token}`, '/firmamento/negocio']);
}

export async function borrarFichaDeCuenta(portafolioId: string): Promise<EstadoEdicion> {
  const sesion = await sesionActual();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const token = await tokenPropio(sesion.id, portafolioId);
  if (!token) return { estado: 'error', mensaje: 'No encontramos ese negocio en tu cuenta.' };

  return borrarFicha(token, { actor_tipo: 'negocio', actor: sesion.id }, ['/firmamento/negocio', `/aliados/estado/${token}`]);
}
