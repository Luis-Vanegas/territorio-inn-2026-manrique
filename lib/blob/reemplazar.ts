import 'server-only';

import { adjuntarFoto, adjuntarMenu } from '@/lib/db/portafolios.repo';
import { blobConfigurado, borrarFoto, subirFoto, subirMenu } from '@/lib/blob/fotos';

/**
 * Sube la foto y/o el menú nuevos de una ficha que ya existe y borra los que
 * reemplazan. Lo usan las dos ediciones (la del dueño y la del moderador):
 * estaba copiado en las dos actions, y es justo el código del bug de la foto
 * que no se podía reemplazar — una copia arreglada y otra no lo traería de vuelta.
 *
 * Va después de guardar los datos y nunca tira: la foto es lo que menos importa
 * perder. Devuelve los avisos para sumar al mensaje de la respuesta.
 */
export async function reemplazarArchivos(
  id: string,
  archivos: { foto: File | null; menu: File | null },
  origen: string,
): Promise<string[]> {
  const avisos: string[] = [];

  const tipos = [
    { archivo: archivos.foto, subir: subirFoto, adjuntar: adjuntarFoto, nombre: 'La foto', clave: 'foto' },
    { archivo: archivos.menu, subir: subirMenu, adjuntar: adjuntarMenu, nombre: 'El menú', clave: 'menú' },
  ];

  for (const { archivo, subir, adjuntar, nombre, clave } of tipos) {
    if (!archivo) continue;

    let ok = false;
    if (blobConfigurado()) {
      try {
        const subida = await subir(archivo, id);
        if (subida) {
          const { pathnameAnterior } = await adjuntar(id, subida.url, subida.pathname);
          ok = true;
          // La URL nueva ya quedó guardada — recién ahora se borra la vieja
          // (se sube con addRandomSuffix, así que es un blob distinto). Si
          // esto falla, el blob viejo queda huérfano pero nadie apunta a él:
          // no vale la pena revertir el guardado por eso.
          if (pathnameAnterior && pathnameAnterior !== subida.pathname) {
            try {
              await borrarFoto(pathnameAnterior);
            } catch (error) {
              console.error(`[${origen}] no se pudo borrar ${clave} anterior`, error);
            }
          }
        }
      } catch (error) {
        console.error(`[${origen}] subida de ${clave} falló`, error);
      }
    }

    if (!ok) avisos.push(`${nombre} no se pudo subir — prueba de nuevo.`);
  }

  return avisos;
}
