'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapaAliados } from './MapaAliados';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { Coordenada } from '@/lib/geo/constantes';

type EstadoGeo = 'pidiendo' | 'listo' | 'sin_permiso';

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
 */
export function MapaAliadosDestacado({ portafolios }: { portafolios: Portafolio[] }) {
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
    <div>
      <div className="h-[380px] w-full overflow-hidden border border-tinta/12 sm:h-[460px] lg:h-[520px]">
        <MapaAliados portafolios={portafolios} ubicacionUsuario={ubicacion} />
      </div>

      {estado === 'sin_permiso' && (
        <button
          type="button"
          onClick={reintentar}
          className="mt-3 inline-flex items-center gap-2 border border-tinta/20 px-3 py-1.5 font-mono text-xs text-tinta/60 transition-colors hover:border-terracota hover:text-terracota"
        >
          <span aria-hidden="true">◎</span>
          Ver los que tengo cerca
        </button>
      )}
    </div>
  );
}
