import 'server-only';

import fuentesJson from '@/pipeline/fuentes_convocatorias.json';
import {
  historialCorridas,
  respondio,
  ultimaCorrida,
  type CorridaVigia,
  type EstadoVigia,
  type FuenteVigia,
  type ResumenCorrida,
} from '@/lib/db/vigia.repo';

/**
 * Lo que lee el panel del equipo (Convocatorias › «Fuentes del vigía»): la lista de
 * fuentes que el vigía vigila (`pipeline/fuentes_convocatorias.json`, import
 * estático) mezclada con el estado de su última corrida (`vigia.repo.ts`).
 *
 * La lista sale del JSON y no de la base a propósito: una fuente nueva que aún no
 * corrió tiene que verse como «Sin informe aún», no desaparecer; y una fuente que
 * se sacó del JSON no sigue figurando como vigilada.
 */

type FuenteConfigurada = { id: string; nombre: string; entidad: string; url: string };

export const FUENTES_VIGIA: readonly FuenteConfigurada[] = (
  fuentesJson as unknown as { fuentes: FuenteConfigurada[] }
).fuentes.map(({ id, nombre, entidad, url }) => ({ id, nombre, entidad, url }));

/** Una fila de la tabla: la fuente configurada + su estado en la última corrida, si lo hay. */
export type FilaFuenteVigia = {
  id: string;
  nombre: string;
  entidad: string;
  url: string;
  /** null = la última corrida no la incluyó (fuente nueva). */
  estado: EstadoVigia | null;
  httpStatus: number | null;
  candidatas: number;
  nuevas: number;
  ultimaRespuesta: string | null;
  /** Texto corto de un fallo; viene de terceros: se imprime como texto, nunca como HTML. */
  error: string | null;
};

export type VigiaVista = {
  corrida: Pick<CorridaVigia, 'id' | 'iniciadaEn' | 'terminadaEn' | 'origen' | 'totalFuentes' | 'totalNuevas'> | null;
  filas: FilaFuenteVigia[];
  respondieron: number;
  historial: ResumenCorrida[];
};

function armar(corrida: CorridaVigia | null, historial: ResumenCorrida[]): VigiaVista {
  const porId = new Map<string, FuenteVigia>((corrida?.fuentes ?? []).map((f) => [f.fuenteId, f]));
  const filas = FUENTES_VIGIA.map((f): FilaFuenteVigia => {
    const e = porId.get(f.id);
    return {
      ...f,
      estado: e?.estado ?? null,
      httpStatus: e?.httpStatus ?? null,
      candidatas: e?.candidatas ?? 0,
      nuevas: e?.nuevas ?? 0,
      ultimaRespuesta: e?.ultimaRespuesta ?? null,
      error: e?.error ?? null,
    };
  });
  return {
    corrida: corrida && {
      id: corrida.id,
      iniciadaEn: corrida.iniciadaEn,
      terminadaEn: corrida.terminadaEn,
      origen: corrida.origen,
      totalFuentes: corrida.totalFuentes,
      totalNuevas: corrida.totalNuevas,
    },
    filas,
    respondieron: filas.filter((f) => f.estado !== null && respondio(f.estado)).length,
    historial,
  };
}

/** Sin caché: el panel se lee por request y la corrida diaria cambia el estado. */
export async function leerVigiaEquipo(): Promise<VigiaVista> {
  const [corrida, historial] = await Promise.all([ultimaCorrida(), historialCorridas(10)]);
  return armar(corrida, historial);
}
