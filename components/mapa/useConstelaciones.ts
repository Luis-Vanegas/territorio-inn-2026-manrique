'use client';

import { useEffect, useState } from 'react';
import { cargarConstelaciones, type DatosConstelaciones } from '@/lib/geo/constelaciones';

export type EstadoCarga = 'cargando' | 'listo' | 'error';

/**
 * Pide el JSON de constelaciones (una sola descarga por visita, ver
 * `cargarConstelaciones`) y lo entrega al componente. `activo = false` lo deja
 * quieto: el buscador de la portada lo enciende recién cuando la persona
 * enfoca o escribe.
 */
export function useConstelaciones(activo = true): {
  datos: DatosConstelaciones | null;
  estado: EstadoCarga;
} {
  const [datos, setDatos] = useState<DatosConstelaciones | null>(null);
  const [estado, setEstado] = useState<EstadoCarga>('cargando');

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    cargarConstelaciones()
      .then((d) => {
        if (!vivo) return;
        setDatos(d);
        setEstado('listo');
      })
      .catch(() => vivo && setEstado('error'));
    return () => {
      vivo = false;
    };
  }, [activo]);

  return { datos, estado };
}
