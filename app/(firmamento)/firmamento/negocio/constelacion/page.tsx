import type { Metadata } from 'next';

import { MapaAliados } from '@/components/MapaAliados';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { listarAprobados, obtenerPropio, type Portafolio } from '@/lib/db/portafolios.repo';
import { posiblesAlianzas } from '@/lib/firmamento/alianzas';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { fechaLarga, type DatosConstelaciones } from '@/lib/geo/constelaciones';
import {
  constelacionDe,
  etiquetaConstelacion,
  lineaMezcla,
  vecinosDeConstelacion,
} from '@/lib/geo/comerciosOsm';
import { distanciaMetros, formatearDistancia } from '@/lib/geo/distancia';
import { urlSitio } from '@/lib/sitio';
// Import estático: solo viaja en el bundle del SERVIDOR (cuenta qué hay cerca).
// El navegador sigue pidiendo el JSON por fetch para dibujar la capa del mapa.
import datosOsmJson from '@/public/firmamento/constelaciones.json';
import { Invitar } from '../_components/Invitar';
import { ListaVecinos, type Vecino } from '../_components/ListaVecinos';
import { SelectorNegocio } from '../_components/SelectorNegocio';
import { SinNegocio } from '../_components/SinNegocio';

export const metadata: Metadata = { title: 'Mi constelación' };

export const dynamic = 'force-dynamic';

const datosOsm = datosOsmJson as unknown as DatosConstelaciones;

/** Hasta dónde se considera «cerca» un aliado de la plataforma. */
const METROS_ALIADOS_CERCA = 1500;

const tarjeta = 'min-w-0 rounded-xl border border-tinta/12 bg-hueso p-5';

export default async function NegocioConstelacionPage() {
  const { usuarioId, nombre } = await exigirNegocio();
  const { negocios, actual } = await negocioActivo(usuarioId);

  if (!actual) {
    return <SinNegocio aviso="Cuando registres tu negocio, aquí ves con quién compartes cuadra en el mapa." />;
  }

  const [portafolio, aprobados] = await Promise.all([
    obtenerPropio(usuarioId, actual.id),
    // Lectura pública y cacheada: la misma lista de la vitrina.
    listarAprobados().catch((e) => {
      console.error('[panel negocio] aliados cercanos falló', e instanceof Error ? e.message : e);
      return [] as Portafolio[];
    }),
  ]);
  if (!portafolio) return <SinNegocio aviso="No encontramos ese negocio en tu cuenta." />;

  const punto = { lat: portafolio.latitud, lon: portafolio.longitud };
  const constelacion = constelacionDe(punto, datosOsm.constelaciones);
  const vecinosOsm = vecinosDeConstelacion(punto, datosOsm, Number.MAX_SAFE_INTEGER, portafolio.nombre);

  // Aliados de la plataforma a la redonda: no son de OSM, son de la vitrina.
  const aliadosCerca: Vecino[] = aprobados
    .filter((a) => a.id !== portafolio.id)
    .map((a) => ({
      clave: `aliado-${a.id}`,
      nombre: a.nombre,
      categoria: a.categoria_id,
      metros: distanciaMetros([punto.lat, punto.lon], [a.latitud, a.longitud]),
      esAliado: true,
      direccion: a.direccion,
    }))
    .filter((a) => a.metros <= METROS_ALIADOS_CERCA)
    .sort((a, b) => a.metros - b.metros);

  const comerciosCerca: Vecino[] = (vecinosOsm?.comercios ?? []).map(({ comercio, metros }) => ({
    clave: `osm-${comercio.osm}`,
    nombre: comercio.nombre ?? 'Comercio sin nombre',
    categoria: comercio.categoria,
    metros,
    esAliado: false,
    direccion: comercio.detalle?.direccion ?? null,
  }));

  // Posibles alianzas: rubros complementarios (lib/firmamento/alianzas.ts), de más cerca a más lejos.
  const alianzas = posiblesAlianzas(
    portafolio.categoria_id,
    [...aliadosCerca, ...comerciosCerca].sort((a, b) => a.metros - b.metros),
    5,
  );

  // Sin constelación: decir cuál es la más cercana y a cuánto, no inventar una.
  const masCercana = constelacion
    ? null
    : datosOsm.constelaciones
        .map((c) => ({ c, metros: distanciaMetros([punto.lat, punto.lon], [c.centroide.lat, c.centroide.lon]) }))
        .sort((a, b) => a.metros - b.metros)[0] ?? null;

  // El mapa recibe a los aliados publicados y al propio negocio (aunque aún no esté
  // publicado), sin su WhatsApp: no tiene sentido ofrecerse a sí mismo un enlace
  // que además contaría como un contacto en sus propios números.
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

  const primerNombre = nombre.trim().split(/\s+/)[0] ?? nombre;
  const mensajeInvitar = `Hola, soy ${primerNombre}, de ${portafolio.nombre}. Estamos en Constelaciones, el mapa de los negocios de Manrique, y me encantaría verte ahí. Registra el tuyo gratis aquí: ${urlSitio()}/aliados/registro`;

  return (
    <div className="mx-auto max-w-6xl">
      <SelectorNegocio negocios={negocios} actual={actual} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="tu-constelacion" className={tarjeta}>
            <h2 id="tu-constelacion" className="font-display text-2xl font-medium text-tinta">
              {constelacion ? 'Eres parte de una constelación' : 'Por ahora eres una estrella suelta'}
            </h2>
            {constelacion ? (
              <>
                <p className="mt-2 font-sans text-base leading-relaxed text-tinta">{etiquetaConstelacion(constelacion)}</p>
                <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
                  Qué hay en tu constelación: {lineaMezcla(constelacion)}.
                </p>
                <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
                  Una constelación es un grupo de comercios que están muy cerca unos de otros, según el mapa abierto
                  de OpenStreetMap. Sus clientes suelen ser los mismos: gente que pasa a pie por la cuadra.
                </p>
              </>
            ) : (
              <p className="mt-2 font-sans text-base leading-relaxed text-tinta/70">
                Una constelación es un grupo de comercios muy cercanos entre sí, según el mapa abierto de OpenStreetMap.
                Tu negocio queda lejos de todos los grupos
                {masCercana && (
                  <>
                    {' '}(el más cercano, {masCercana.c.codigo ?? 'otro'}, está a{' '}
                    <span className="tabular-nums">{formatearDistancia(masCercana.metros)}</span>)
                  </>
                )}
                . Los negocios fuera de las vías comerciales son justo los que Constelaciones quiere hacer visibles.
              </p>
            )}
          </section>

          {/* El mapa de siempre (el de /aliados y /firmamento), en una ventana de noche; no hay un segundo mapa. */}
          <VentanaNoche titulo="Tu cuadra en el mapa" id="mapa">
            <MapaAliados
              portafolios={enElMapa}
              noche
              seleccionado={portafolio.id}
              constelacionElegida={constelacion?.id}
              hrefLista="/aliados#listado"
            />
          </VentanaNoche>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="alianzas" className={tarjeta}>
            <h2 id="alianzas" className="font-display text-2xl font-medium text-tinta">
              Posibles alianzas
            </h2>
            <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
              Negocios cercanos de un rubro que se complementa con el tuyo: quien le compra a uno suele necesitar al
              otro. Es una sugerencia por categoría, no una garantía.
            </p>
            <div className="mt-2">
              <ListaVecinos
                vecinos={alianzas}
                etiquetaVacia="No encontramos cerca un rubro que se complemente con el tuyo. Invita a tus vecinos y esto crece."
              />
            </div>
          </section>

          <section aria-labelledby="aliados-cerca" className={tarjeta}>
            <h2 id="aliados-cerca" className="font-display text-2xl font-medium text-tinta">
              Aliados cerca de ti
            </h2>
            <div className="mt-2">
              <ListaVecinos
                vecinos={aliadosCerca.slice(0, 6)}
                etiquetaVacia="Todavía no hay otros aliados a menos de 1,5 km. Puedes ser quien traiga a los demás."
              />
            </div>
          </section>

          {constelacion && (
            <section aria-labelledby="vecinos-osm" className={tarjeta}>
              <h2 id="vecinos-osm" className="font-display text-2xl font-medium text-tinta">
                Otros negocios de tu constelación
              </h2>
              <div className="mt-2">
                <ListaVecinos
                  vecinos={comerciosCerca.slice(0, 6)}
                  etiquetaVacia="OpenStreetMap no tiene otros comercios con nombre en tu constelación."
                />
              </div>
              {comerciosCerca.length > 6 && (
                <p className="mt-2 font-sans text-sm text-tinta/70">
                  Y {comerciosCerca.length - 6} más con nombre en esta constelación.
                </p>
              )}
              <p className="mt-3 font-sans text-xs leading-relaxed text-tinta/70 tabular-nums">
                Fuente: © colaboradores de OpenStreetMap (ODbL) · datos al {fechaLarga(datosOsm.osm_base)}
              </p>
            </section>
          )}

          <section aria-labelledby="invitar" className={tarjeta}>
            <h2 id="invitar" className="font-display text-2xl font-medium text-tinta">
              Invita a tus vecinos
            </h2>
            <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
              Cada vecino que se registra hace más fácil que los clientes encuentren la cuadra entera.
            </p>
            <div className="mt-3">
              <Invitar mensaje={mensajeInvitar} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
