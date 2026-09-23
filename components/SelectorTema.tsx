// Toggle de modo claro/oscuro. 'use client' porque lee/escribe
// document.documentElement y localStorage — no hay forma de hacer esto en un
// Server Component. Sin librería (next-themes): el script inline de
// app/layout.tsx ya resuelve el estado inicial sin flash, esto solo alterna.
//
// useSyncExternalStore en vez de useState+useEffect: el tema vive en el DOM
// (data-theme), no en React, y SiteHeader monta este componente dos veces
// (nav de escritorio y de mobile) — con estado local cada instancia queda
// desincronizada de la otra al hacer clic en una. El listener compartido acá
// abajo resuelve las dos cosas a la vez: sincroniza ambas instancias y evita
// el efecto que solo existe para llamar a setState una vez al montar.
//
// Ícono con SVG inline, no una librería de íconos nueva: coherente con que
// el resto del sitio tampoco usa una.

'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';

const oyentes = new Set<() => void>();

function fijarTema(tema: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', tema);
  // Fuerza un reflow: sin esto, Chromium no siempre repinta un color con
  // `transition-colors` cuyo valor solo cambió porque una variable CSS
  // heredada del <html> cambió — el color final queda visualmente
  // "pegado" al anterior hasta el próximo repaint por otro motivo (hover,
  // resize). Confirmado leyendo getComputedStyle antes/después: sin esta
  // línea el valor no se actualiza ni después de esperar un segundo.
  void document.documentElement.offsetHeight;
  localStorage.setItem('tema', tema);
  oyentes.forEach((cb) => cb());
}

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

function leerTema() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// En el server no hay DOM. El valor no importa: el script inline de
// components/TemaInicial corrige el atributo real antes de que React hidrate, así
// que React ya lee el valor correcto en el primer render de cliente.
function leerTemaServidor() {
  return false;
}

export function SelectorTema() {
  const oscuro = useSyncExternalStore(suscribir, leerTema, leerTemaServidor);

  // Solo en desarrollo: el remount de Strict Mode deja <html> con los
  // atributos del JSX y borra el data-theme que puso components/TemaInicial.
  // En producción el atributo sigue ahí y esto no hace nada.
  useLayoutEffect(() => {
    if (document.documentElement.hasAttribute('data-theme')) return;
    const guardado = localStorage.getItem('tema');
    const sistema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', guardado ?? sistema);
    oyentes.forEach((cb) => cb());
  }, []);

  return (
    <button
      type="button"
      onClick={() => fijarTema(oscuro ? 'light' : 'dark')}
      aria-pressed={oscuro}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="grid h-11 w-11 shrink-0 place-items-center border border-tinta/15 text-tinta transition-colors hover:border-azul hover:text-azul-texto"
    >
      {oscuro ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
