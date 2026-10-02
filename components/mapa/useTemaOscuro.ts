'use client';

import { useSyncExternalStore } from 'react';

// El tema vive en el atributo data-theme de <html> (components/TemaInicial.tsx
// y SelectorTema). Un solo observador compartido por los mapas: cuando la
// persona cambia el tema con el selector, las teselas cambian sin recargar.
function suscribir(aviso: () => void) {
  const obs = new MutationObserver(aviso);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}

const leer = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function useTemaOscuro(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}
