/**
 * Única fuente de verdad del tema en el cliente. El tema vive en el DOM
 * (`data-theme` de <html>, lo pone components/TemaInicial.tsx antes de pintar y
 * lo cambia `fijarTema`), no en React. Un solo MutationObserver a nivel de
 * módulo avisa a todos los suscriptores (selector, mapas); se crea con el
 * primero y se apaga con el último.
 *
 * Si falta `data-theme` (sin JS o antes del script inline) manda
 * `prefers-color-scheme`, igual que el bloque @media de styles/globals.css.
 */
import { useSyncExternalStore } from 'react';

const oyentes = new Set<() => void>();
let observador: MutationObserver | null = null;
let consulta: MediaQueryList | null = null;

function avisar() {
  oyentes.forEach((cb) => cb());
}

function suscribir(cb: () => void) {
  if (oyentes.size === 0) {
    observador = new MutationObserver(avisar);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    consulta = window.matchMedia('(prefers-color-scheme: dark)');
    consulta.addEventListener('change', avisar);
  }
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
    if (oyentes.size === 0) {
      observador?.disconnect();
      consulta?.removeEventListener('change', avisar);
      observador = consulta = null;
    }
  };
}

export function leerTemaOscuro(): boolean {
  const tema = document.documentElement.getAttribute('data-theme');
  if (tema) return tema === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// En el servidor no hay DOM; el script inline corrige el atributo antes de hidratar.
export function useTemaOscuro(): boolean {
  return useSyncExternalStore(suscribir, leerTemaOscuro, () => false);
}

export function fijarTema(tema: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', tema);
  // Fuerza un reflow: sin esto, Chromium no siempre repinta un color con
  // `transition-colors` cuyo valor solo cambió porque una variable CSS
  // heredada del <html> cambió; el color queda "pegado" al anterior hasta el
  // próximo repaint por otro motivo (hover, resize).
  void document.documentElement.offsetHeight;
  localStorage.setItem('tema', tema);
}
