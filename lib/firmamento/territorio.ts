import 'server-only';

import datosOsmJson from '@/public/firmamento/constelaciones.json';
import type { FichaCalidad } from '@/lib/db/equipo.repo';
import { barrioDe } from '@/lib/geo/barrioOficial';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';
import type { Constelacion, DatosConstelaciones, EstrellaOsm } from '@/lib/geo/constelaciones';
import {
  aplanarComercios,
  constelacionDe,
  METROS_MISMO_NEGOCIO,
  nombreCategoriaOsm,
} from '@/lib/geo/comerciosOsm';
import { dentroDeManrique } from '@/lib/geo/dentroDeManrique';
import { distanciaMetros } from '@/lib/geo/distancia';

/**
 * Territorio del panel del equipo: dónde está la red de aliados y dónde no,
 * contra los comercios de OpenStreetMap (`public/firmamento/constelaciones.json`,
 * import estático: solo viaja en el bundle del servidor, como en
 * `app/(site)/firmamento/datos.ts`).
 *
 * Los comercios de OSM NO son aliados: son locales que alguien mapeó. La
 * cobertura es una aproximación (aliados ÷ comercios mapeados), no un censo, y
 * la pantalla lo dice. Un aliado «está en» una constelación con la misma regla
 * de su ficha (`constelacionDe`: centroide más cercano y dentro de su radio p90).
 */

export const OSM = datosOsmJson as unknown as DatosConstelaciones & {
  metodo: {
    algoritmo: string;
    min_cluster_size: number;
    min_samples: number;
    cluster_selection_method: string;
    crs_distancias: string;
    semilla: number;
  };
  validaciones: Record<string, number>;
  comparacion_eom_leaf: Record<'leaf' | 'eom', { constelaciones: number; puntos_sueltos: number; cumulo_mayor: number }>;
  sensibilidad_min_cluster_size: {
    seleccion: string;
    min_cluster_size: number;
    constelaciones: number;
    puntos_sueltos: number;
    cumulo_mayor: number;
  }[];
};

type Punto = Pick<FichaCalidad, 'latitud' | 'longitud'>;

/** Aliados publicados dentro de la comuna ÷ comercios de OSM. `null` si no hay comercios. */
export function cobertura(aprobados: readonly Punto[]) {
  const dentro = aprobados.filter((a) => dentroDeManrique(a.latitud, a.longitud)).length;
  const comercios = OSM.resumen.total_comercios;
  return { dentro, comercios, porcentaje: comercios > 0 ? (dentro / comercios) * 100 : null };
}

export type FilaTerritorio = {
  id: string;
  codigo: string;
  nombre: string;
  comercios: number;
  aliados: number;
  /** Comercios mapeados menos aliados, nunca negativo. Es la prioridad de la brigada. */
  sinRegistrar: number;
  /** El barrio con más comercios de la constelación. */
  barrio: string | null;
};

export type FilaBarrio = { barrio: string; comercios: number; aliados: number };

function barrioDominante(c: Constelacion): string | null {
  const conteo = new Map<string, number>();
  for (const e of c.estrellas) if (e.barrio) conteo.set(e.barrio, (conteo.get(e.barrio) ?? 0) + 1);
  return [...conteo].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function territorio(aprobados: readonly Punto[]) {
  const porConstelacion = new Map<string, number>();
  let fueraDeConstelacion = 0;
  const aliadosPorBarrio = new Map<string, number>();

  for (const a of aprobados) {
    const c = constelacionDe({ lat: a.latitud, lon: a.longitud }, OSM.constelaciones);
    if (c) porConstelacion.set(c.id, (porConstelacion.get(c.id) ?? 0) + 1);
    else fueraDeConstelacion++;
    const b = barrioDe(a.latitud, a.longitud);
    if (b) aliadosPorBarrio.set(b, (aliadosPorBarrio.get(b) ?? 0) + 1);
  }

  const constelaciones: FilaTerritorio[] = OSM.constelaciones
    .map((c) => {
      const aliados = porConstelacion.get(c.id) ?? 0;
      return {
        id: c.id,
        codigo: c.codigo ?? c.id.toUpperCase(),
        nombre: c.nombre ?? c.id,
        comercios: c.tamano,
        aliados,
        sinRegistrar: Math.max(0, c.tamano - aliados),
        barrio: barrioDominante(c),
      };
    })
    .sort((a, b) => b.sinRegistrar - a.sinRegistrar || a.codigo.localeCompare(b.codigo));

  const comerciosPorBarrio = new Map<string, number>();
  for (const e of aplanarComercios(OSM)) {
    if (e.barrio) comerciosPorBarrio.set(e.barrio, (comerciosPorBarrio.get(e.barrio) ?? 0) + 1);
  }
  const barrios: FilaBarrio[] = BARRIOS_COMUNA_3.map((barrio) => ({
    barrio,
    comercios: comerciosPorBarrio.get(barrio) ?? 0,
    aliados: aliadosPorBarrio.get(barrio) ?? 0,
  })).sort((a, b) => b.comercios - b.aliados - (a.comercios - a.aliados) || a.barrio.localeCompare(b.barrio, 'es'));

  return { constelaciones, barrios, fueraDeConstelacion };
}

export type FilaBrigada = {
  prioridad: number;
  constelacion: string;
  comercio: string;
  categoria: string;
  direccion: string | null;
  barrio: string | null;
  latitud: number;
  longitud: number;
  posible_aliado: boolean;
};

/**
 * Plan de brigada: los comercios de OSM de cada constelación, en el orden de
 * prioridad (más locales sin registrar primero), para salir a hacer registro
 * asistido. `posible_aliado` marca los que están a `METROS_MISMO_NEGOCIO` m o
 * menos de un aliado publicado: probablemente ya están en la red.
 *
 * Todo es dato público de OSM (nombre, categoría, dirección, punto); de los
 * aliados solo se usa la ubicación para esa marca, y no sale en el archivo.
 */
export function planDeBrigada(aprobados: readonly Punto[]): FilaBrigada[] {
  const { constelaciones } = territorio(aprobados);
  const porId = new Map(OSM.constelaciones.map((c) => [c.id, c]));
  const cercaDeAliado = (e: EstrellaOsm) =>
    aprobados.some(
      (a) => distanciaMetros([e.lat, e.lon], [a.latitud, a.longitud]) <= METROS_MISMO_NEGOCIO,
    );

  return constelaciones.flatMap((fila, i) =>
    (porId.get(fila.id)?.estrellas ?? []).map((e) => ({
      prioridad: i + 1,
      constelacion: `${fila.codigo} · ${fila.nombre}`,
      comercio: e.nombre ?? 'Sin nombre en OSM',
      categoria: nombreCategoriaOsm(e.categoria),
      direccion: e.detalle?.direccion ?? null,
      barrio: e.barrio ?? null,
      latitud: e.lat,
      longitud: e.lon,
      posible_aliado: cercaDeAliado(e),
    })),
  );
}
