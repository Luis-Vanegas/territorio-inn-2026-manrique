import type { Metadata } from 'next';

import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { enlaceWhatsapp } from '@/lib/contacto';
import { listarAprobados, obtenerPropio, type Portafolio } from '@/lib/db/portafolios.repo';
import { posiblesAlianzas } from '@/lib/firmamento/alianzas';
import { datosOsm, entornoDeNegocio } from '@/lib/firmamento/entorno';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { revisarUbicacion } from '@/lib/firmamento/ubicacion';
import { fechaHoyBogota, formatearNumero } from '@/lib/formato';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { etiquetaConstelacion, lineaMezcla } from '@/lib/geo/comerciosOsm';
import { formatearDistancia } from '@/lib/geo/distancia';
import { urlSitio } from '@/lib/sitio';
import { AvisoUbicacion } from '../_components/AvisoUbicacion';
import { Invitar } from '../_components/Invitar';
import { ExplorarConstelaciones } from './_components/ExplorarConstelaciones';
import { ListaVecinos, type Vecino } from '../_components/ListaVecinos';
import { SelectorNegocio } from '../_components/SelectorNegocio';
import { SinNegocio } from '../_components/SinNegocio';

export const metadata: Metadata = { title: 'Mi constelación' };

export const dynamic = 'force-dynamic';

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

  const primerNombre = nombre.trim().split(/\s+/)[0] ?? nombre;
  // El mensaje de «cómo conectarme»: va ya escrito en el enlace de WhatsApp de cada aliado cercano.
  const mensajeAlianza = `Hola, soy ${primerNombre}, de ${portafolio.nombre}. Estamos cerca en Manrique y creo que podemos ayudarnos a que más vecinos nos encuentren. ¿Hablamos?`;

  const entorno = entornoDeNegocio(portafolio, aprobados);
  const { constelacion, enElMapa } = entorno;

  // Aliados de la plataforma a la redonda: no son de OSM, son de la vitrina.
  const aliadosCerca: Vecino[] = entorno.aliadosCerca.map(({ aliado: a, metros }) => ({
    clave: `aliado-${a.id}`,
    nombre: a.nombre,
    categoria: a.categoria_id,
    metros,
    esAliado: true,
    direccion: a.direccion,
    contacto: a.whatsapp ? `${enlaceWhatsapp(a.whatsapp)}?text=${encodeURIComponent(mensajeAlianza)}` : null,
  }));

  const comerciosCerca: Vecino[] = entorno.comerciosCerca.map(({ comercio, metros }) => ({
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
  const masCercana = constelacion ? null : (entorno.cercanas[0] ?? null);

  const mensajeInvitar = `Hola, soy ${primerNombre}, de ${portafolio.nombre}. Estamos en Constelaciones, el mapa de los negocios de Manrique, y me encantaría verte ahí. Registra el tuyo gratis aquí: ${urlSitio()}/firmamento/negocio/registro`;

  const hoy = fechaHoyBogota();
  const masDeOsm = comerciosCerca.length - 6;

  return (
    <div className="flex flex-col gap-5">
      <SelectorNegocio negocios={negocios} actual={actual} />
      <AvisoUbicacion revision={revisarUbicacion(portafolio)} barrio={portafolio.barrio} />

      {/* La ventana: quién tengo cerca, en cifras y en el mapa (el de siempre; no hay un segundo mapa). */}
      <VentanaNoche
        titulo={constelacion ? 'Eres parte de una constelación' : 'Por ahora eres una estrella suelta'}
        id="tu-constelacion"
        descripcion={
          constelacion ? (
            <>
              {etiquetaConstelacion(constelacion)}. Qué hay en ella: {lineaMezcla(constelacion)}.
            </>
          ) : (
            <>
              Tu negocio queda lejos de todos los grupos
              {masCercana && (
                <>
                  {' '}(el más cercano, {masCercana.constelacion.codigo ?? 'otro'}, está a{' '}
                  <span className="tabular-nums">{formatearDistancia(masCercana.metros)}</span>)
                </>
              )}
              . Los negocios fuera de las vías comerciales son justo los que Constelaciones quiere hacer visibles.
            </>
          )
        }
      >
        <GrupoCifras
          columnas={3}
          fuente="aliados aprobados de Constelaciones y comercios de OpenStreetMap (ODbL); distancias en línea recta"
          fecha={`aliados al ${hoy}, mapa abierto al ${fechaLarga(datosOsm.osm_base)}`}
        >
          <Kpi
            valor={formatearNumero(aliadosCerca.length)}
            numero={aliadosCerca.length}
            etiqueta="Aliados a menos de 1,5 km"
            aclaracion="Otros negocios de la red, ya registrados."
          />
          <Kpi
            valor={constelacion ? formatearNumero(comerciosCerca.length) : '—'}
            numero={constelacion ? comerciosCerca.length : undefined}
            tono="estrella"
            etiqueta="Comercios en tu constelación"
            aclaracion={constelacion ? 'Con nombre en OpenStreetMap; no son aliados.' : 'Aún no estás dentro de un grupo.'}
          />
          <Kpi
            valor={formatearNumero(alianzas.length)}
            numero={alianzas.length}
            tono="estrella"
            etiqueta="Posibles alianzas"
            aclaracion="Rubros que se complementan con el tuyo."
          />
        </GrupoCifras>

        <div className="mt-5">
          <ExplorarConstelaciones
            portafolios={enElMapa}
            seleccionado={portafolio.id}
            propia={constelacion?.id ?? null}
            cercanas={entorno.cercanas.map(({ constelacion: c, metros }) => ({
              id: c.id,
              codigo: c.codigo ?? c.id,
              etiqueta: etiquetaConstelacion(c),
              metros,
            }))}
          />
        </div>
      </VentanaNoche>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <Tarjeta
            titulo="Posibles alianzas"
            id="alianzas"
            plegable
            abierta
            resumen={`${alianzas.length} cerca`}
          >
            <p className="font-sans text-sm leading-relaxed text-tinta/70">
              Negocios cercanos de un rubro que se complementa con el tuyo: quien le compra a uno suele necesitar al
              otro. Es una sugerencia por categoría, no una garantía.
            </p>
            <div className="mt-2">
              <ListaVecinos
                vecinos={alianzas.slice(0, 3)}
                etiquetaVacia="No encontramos cerca un rubro que se complemente con el tuyo. Invita a tus vecinos y esto crece."
              />
            </div>
          </Tarjeta>

          <Tarjeta
            titulo="Aliados cerca de ti"
            id="aliados-cerca"
            ancla="lista-aliados-cerca"
            plegable
            resumen={`${aliadosCerca.length} a menos de 1,5 km`}
          >
            <ListaVecinos
              vecinos={aliadosCerca.slice(0, 4)}
              etiquetaVacia="Todavía no hay otros aliados a menos de 1,5 km. Puedes ser quien traiga a los demás."
            />
          </Tarjeta>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Tarjeta titulo="Invita a tus vecinos" id="invitar" plegable abierta resumen="el mensaje ya está escrito">
            <p className="mb-3 font-sans text-sm leading-relaxed text-tinta/70">
              Cada vecino que se registra hace más fácil que los clientes encuentren la cuadra entera.
            </p>
            <Invitar mensaje={mensajeInvitar} />
          </Tarjeta>

          {constelacion && (
            <Tarjeta
              titulo="Otros negocios de tu constelación"
              id="vecinos-osm"
              plegable
              resumen={`${comerciosCerca.length} con nombre`}
            >
              <ListaVecinos
                vecinos={comerciosCerca.slice(0, 6)}
                etiquetaVacia="OpenStreetMap no tiene otros comercios con nombre en tu constelación."
              />
              {masDeOsm > 0 && (
                <p className="mt-2 font-sans text-sm text-tinta/70">Y {masDeOsm} más con nombre en esta constelación.</p>
              )}
              <p className="mt-3 font-sans text-xs leading-relaxed text-tinta/70">
                Fuente: © colaboradores de OpenStreetMap (ODbL) · datos al {fechaLarga(datosOsm.osm_base)}
              </p>
            </Tarjeta>
          )}

          <Tarjeta titulo="¿Qué es una constelación?" id="que-es" plegable>
            <p className="font-sans text-base leading-relaxed text-tinta/70">
              Es un grupo de comercios muy cercanos entre sí, según el mapa abierto de OpenStreetMap. Sus clientes
              suelen ser los mismos: gente que pasa a pie por la cuadra. Por eso aliarte con quien está cerca, con un
              rubro que se complementa, te trae clientes sin salir de la cuadra.
            </p>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
