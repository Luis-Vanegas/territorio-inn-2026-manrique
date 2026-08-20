'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { contarVisita } from '@/lib/interacciones';

/**
 * Suma una visita por página abierta del sitio público.
 *
 * Va montado en el layout de (site), así que no cuenta /admin. Se dispara del
 * lado del cliente y no en el render del servidor a propósito: los bots que no
 * ejecutan JavaScript quedan afuera, y un prefetch de Next tampoco infla el
 * número.
 *
 * El ref evita contar dos veces la misma ruta — tanto por el doble efecto de
 * StrictMode en desarrollo como por cualquier re-render del layout.
 */
export function ContadorVisitas() {
  const pathname = usePathname();
  const ultimaContada = useRef<string | null>(null);

  useEffect(() => {
    if (ultimaContada.current === pathname) return;
    ultimaContada.current = pathname;
    contarVisita();
  }, [pathname]);

  return null;
}
