import 'server-only';

import type { Portafolio, PortafolioAdmin } from '@/lib/db/portafolios.repo';
import type { Constelacion, DatosConstelaciones } from '@/lib/geo/constelaciones';
import { constelacionDe, vecinosDeConstelacion, type ComercioVecino } from '@/lib/geo/comerciosOsm';
import { distanciaMetros } from '@/lib/geo/distancia';
// Import estático: solo viaja en el bundle del SERVIDOR (cuenta qué hay cerca).
// El navegador sigue pidiendo el JSON por fetch para dibujar la capa del mapa.
import datosOsmJson from '@/public/firmamento/constelaciones.json';

/**
 * Lo que rodea a un negocio en el mapa: su constelación (o la más cercana si es
 * una estrella suelta), los aliados aprobados a la redonda y los comercios de
 * OSM de su grupo. Lo comparten «Dónde estás» del inicio y «Mi constelación»:
 * las dos pantallas tienen que decir lo mismo con las mismas cuentas.
 *
 * Solo lee lo público (la vitrina aprobada y OpenStreetMap) más la ficha propia.
 */

export const datosOsm = datosOsmJson as unknown as DatosConstelaciones;

/** Hasta dónde se considera «cerca» un aliado de la plataforma. */
export const METROS_ALIADOS_CERCA = 1500;

export type AliadoCerca = { aliado: Portafolio; metros: number };
export type ConstelacionCerca = { constelacion: Constelacion; metros: number };

export type EntornoNegocio = {
  constelacion: Constelacion | null;
  /** Aliados aprobados (sin el propio) a menos de `METROS_ALIADOS_CERCA`, del más cercano al más lejano. */
  aliadosCerca: AliadoCerca[];
  /** Comercios con nombre de OSM en su constelación; vacío si es una estrella suelta. */
  comerciosCerca: ComercioVecino[];
  /** Las constelaciones más cercanas a su punto (la propia incluida, si la tiene). */
  cercanas: ConstelacionCerca[];
  /** Lo que se dibuja: los aliados publicados y el propio negocio, aunque aún no esté publicado. */
  enElMapa: Portafolio[];
};

export function entornoDeNegocio(portafolio: PortafolioAdmin, aprobados: Portafolio[], maxCercanas = 6): EntornoNegocio {
  const punto = { lat: portafolio.latitud, lon: portafolio.longitud };
  const constelacion = constelacionDe(punto, datosOsm.constelaciones);
  const vecinosOsm = vecinosDeConstelacion(punto, datosOsm, Number.MAX_SAFE_INTEGER, portafolio.nombre);

  const aliadosCerca = aprobados
    .filter((a) => a.id !== portafolio.id)
    .map((aliado) => ({ aliado, metros: distanciaMetros([punto.lat, punto.lon], [aliado.latitud, aliado.longitud]) }))
    .filter((a) => a.metros <= METROS_ALIADOS_CERCA)
    .sort((a, b) => a.metros - b.metros);

  const cercanas = datosOsm.constelaciones
    .map((c) => ({ constelacion: c, metros: distanciaMetros([punto.lat, punto.lon], [c.centroide.lat, c.centroide.lon]) }))
    .sort((a, b) => a.metros - b.metros)
    .slice(0, maxCercanas);

  // El propio negocio va sin su WhatsApp: no tiene sentido ofrecerse a sí mismo un
  // enlace que además contaría como un contacto en sus propios números. Tampoco
  // viaja nada de moderación al navegador.
  const {
    estado: _estado,
    motivo_rechazo: _motivo,
    moderado_por: _moderadoPor,
    moderado_en: _moderadoEn,
    foto_blob_pathname: _fotoBlob,
    menu_blob_pathname: _menuBlob,
    ...propioPublico
  } = portafolio;
  const enElMapa: Portafolio[] = [
    ...aprobados.filter((a) => a.id !== portafolio.id),
    { ...propioPublico, whatsapp: null },
  ];

  return { constelacion, aliadosCerca, comerciosCerca: vecinosOsm?.comercios ?? [], cercanas, enElMapa };
}
