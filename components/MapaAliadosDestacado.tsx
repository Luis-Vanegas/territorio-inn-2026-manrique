'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapaAliados } from './MapaAliados';
import { BotonConstelacion, useConstelacionElegida } from './firmamento/MapaEstelar';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { Coordenada } from '@/lib/geo/constantes';

type EstadoGeo = 'pidiendo' | 'listo' | 'sin_permiso';

export type ConstelacionLista = { id: string; codigo: string; nombre: string; tamano: number };

/**
 * Mapa del inicio, con ubicación automática al montar.
 *
 * A diferencia de VitrinaAliados (que pide el permiso solo cuando la persona
 * toca un botón — un permiso que salta sin gesto se deniega por reflejo, y
 * Chrome castiga al sitio que lo pide así), acá el pedido es automático a
 * pedido explícito: la idea es que la primera impresión del sitio ya muestre
 * qué tan cerca está el visitante de los negocios.
 *
 * Si el navegador deniega el permiso o no responde, el mapa se queda con el
 * encuadre de siempre (todo Manrique) y aparece un botón chico para volver a
 * intentarlo a mano — sin eso, alguien que tocó "bloquear" sin querer, o cuyo
 * GPS tardó en arrancar, se queda sin forma de recuperar la función.
 *
 * `estado` arranca siempre en 'pidiendo', server y cliente por igual: chequear
 * `'geolocation' in navigator` en el cuerpo del componente (en vez de dentro
 * del efecto) rendería distinto en el servidor —sin `navigator`— que en el
 * cliente, y React tira error de hidratación por la diferencia.
 *
 * Al lado (debajo en el celular) va la lista de constelaciones: tocar una la
 * enciende en el mapa. El estado es el de `useConstelacionElegida`, el mismo de
 * los paneles: no hay un segundo mapa ni una segunda lógica.
 */
export function MapaAliadosDestacado({
  portafolios,
  constelaciones,
}: {
  portafolios: Portafolio[];
  constelaciones: ConstelacionLista[];
}) {
  const { elegida, elegir, fijar, caja } = useConstelacionElegida();
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const [estado, setEstado] = useState<EstadoGeo>('pidiendo');

  // Sin setState sincrónico en el cuerpo: solo suscribe el callback async de
  // la API del navegador, que es donde React espera que se actualice el estado.
  const solicitar = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion([pos.coords.latitude, pos.coords.longitude]);
        setEstado('listo');
      },
      () => setEstado('sin_permiso'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) solicitar();
    // Automático solo al montar — el reintento manual lo dispara el botón de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reintentar = useCallback(() => {
    setEstado('pidiendo');
    solicitar();
  }, [solicitar]);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
      <div ref={caja} className="min-w-0 scroll-mt-24 lg:col-span-8">
        <MapaAliados
          portafolios={portafolios}
          ubicacionUsuario={ubicacion}
          variante="portada"
          constelacionElegida={elegida}
          alElegirConstelacion={fijar}
        />
      {estado === 'sin_permiso' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={reintentar}
            className="inline-flex min-h-[44px] items-center gap-2 border border-tinta/55 px-3 py-1.5 font-sans text-xs text-tinta/60 transition-colors hover:border-azul-texto hover:text-azul-texto"
          >
            <span aria-hidden="true">◎</span>
            Ver los que tengo cerca
          </button>
          <span className="max-w-md font-sans text-xs leading-relaxed text-tinta/65">
            Si lo presionas y das permiso a tu ubicación, te mostramos qué negocios tienes cerca y a qué
            distancia. Tu ubicación se usa solo en tu navegador. No se envía ni se guarda.
          </span>
        </div>
      )}
      </div>

      <section aria-labelledby="titulo-lista-constelaciones" className="min-w-0 lg:col-span-4">
        <h2 id="titulo-lista-constelaciones" className="font-sans text-sm font-medium text-tinta">
          {constelaciones.length} constelaciones · toca una para verla
        </h2>
        <ul className="mt-2 max-h-[34rem] divide-y divide-tinta/10 overflow-y-auto border-y border-tinta/10">
          {constelaciones.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-1.5">
              <BotonConstelacion codigo={c.codigo} activa={c.id === elegida} alAlternar={() => elegir(c.id)} />
              <span className="min-w-0 break-words font-sans text-sm leading-snug text-tinta">
                {c.nombre}
                <span className="block text-xs tabular-nums text-tinta/65">{c.tamano} comercios</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
