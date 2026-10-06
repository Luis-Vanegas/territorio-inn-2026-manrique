import 'server-only';

import { barrioDe } from '@/lib/geo/barrioOficial';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';
import { dentroDeManrique, metrosAlBorde } from '@/lib/geo/dentroDeManrique';
import type { FichaCalidad } from '@/lib/db/equipo.repo';

/**
 * Alertas de calidad de las fichas, calculadas al vuelo y sin tabla
 * (docs/firmamento-modulos.md, decisión 3): guardarlas duplicaría un dato que
 * se deriva del punto, el barrio y la categoría. Si alguien corrige la ficha,
 * la alerta desaparece sola en la siguiente carga.
 *
 * El orden es de gravedad: un punto fuera de la comuna saca el negocio del
 * territorio del proyecto; un barrio mal elegido ensucia los conteos por
 * barrio; «Otros» y la ficha incompleta son de calidad, no de exactitud.
 */

export type TipoAlerta = 'fuera' | 'barrio' | 'otros' | 'incompleta';

export type AlertaCalidad = {
  tipo: TipoAlerta;
  ficha: Pick<FichaCalidad, 'id' | 'nombre' | 'estado' | 'barrio' | 'categoria_nombre'>;
  texto: string;
  /** Solo en «otros»: lo que la persona escribió, para que el sugeridor proponga una categoría. */
  textoParaSugerir?: string;
};

const GRAVEDAD: Record<TipoAlerta, number> = { fuera: 0, barrio: 1, otros: 2, incompleta: 3 };

const sinTildes = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const BARRIOS = new Map(BARRIOS_COMUNA_3.map((b) => [sinTildes(b), b]));

const metros = (n: number) => `${Math.round(n).toLocaleString('es-CO')} m`;

export function alertasDeCalidad(fichas: readonly FichaCalidad[]): AlertaCalidad[] {
  const alertas: AlertaCalidad[] = [];

  for (const f of fichas) {
    const ficha = {
      id: f.id,
      nombre: f.nombre,
      estado: f.estado,
      barrio: f.barrio,
      categoria_nombre: f.categoria_nombre,
    };
    const dentro = dentroDeManrique(f.latitud, f.longitud);

    if (!dentro) {
      alertas.push({
        ficha,
        tipo: 'fuera',
        texto: `La ubicación cae fuera de la Comuna 3, a unos ${metros(metrosAlBorde(f.latitud, f.longitud))} del límite. Revisa el punto en el mapa de la ficha.`,
      });
    }

    // El oficial guardado (033) y, si la fila es anterior al relleno, el del punto.
    const oficial = f.barrio_oficial ?? (dentro ? barrioDe(f.latitud, f.longitud) : null);
    const declarado = BARRIOS.get(sinTildes(f.barrio));
    if (!declarado) {
      alertas.push({
        ficha,
        tipo: 'barrio',
        texto: oficial
          ? `«${f.barrio}» no es uno de los 15 barrios de la Comuna 3; el punto cae en ${oficial}.`
          : `«${f.barrio}» no es uno de los 15 barrios de la Comuna 3.`,
      });
    } else if (oficial && declarado !== oficial) {
      alertas.push({
        ficha,
        tipo: 'barrio',
        texto: `Dice estar en ${declarado}, pero el punto cae en ${oficial}. Puede ser el punto o el barrio.`,
      });
    }

    if (f.categoria_id === 'otros') {
      alertas.push({
        ficha,
        tipo: 'otros',
        texto: f.categoria_otra
          ? `Categoría «Otros» con el texto «${f.categoria_otra}».`
          : 'Categoría «Otros», sin texto que diga qué es.',
        textoParaSugerir: [f.nombre, f.descripcion, f.categoria_otra].filter(Boolean).join(' '),
      });
    }

    const falta = [!f.tiene_foto && 'foto', !f.tiene_whatsapp && 'WhatsApp'].filter(Boolean);
    if (falta.length > 0) {
      alertas.push({
        ficha,
        tipo: 'incompleta',
        texto: `Le falta ${falta.join(' y ')}: sin eso la ficha se ve vacía y nadie puede escribirle.`,
      });
    }
  }

  return alertas.sort((a, b) => GRAVEDAD[a.tipo] - GRAVEDAD[b.tipo] || a.ficha.nombre.localeCompare(b.ficha.nombre, 'es'));
}
