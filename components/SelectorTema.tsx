// Toggle de modo claro/oscuro. 'use client' porque lee/escribe
// document.documentElement y localStorage — no hay forma de hacer esto en un
// Server Component. Sin librería (next-themes): el script inline de
// app/layout.tsx ya resuelve el estado inicial sin flash, esto solo alterna.
//
// useSyncExternalStore en vez de useState+useEffect: el tema vive en el DOM
// (data-theme), no en React, y SiteHeader monta este componente dos veces
// (nav de escritorio y de mobile) — con estado local cada instancia queda
// desincronizada de la otra al hacer clic en una. La suscripción vive en
// lib/tema.ts (un solo observador de data-theme, compartido con los mapas).
//
// Ícono con SVG inline, no una librería de íconos nueva: coherente con que
// el resto del sitio tampoco usa una.

'use client';

import { useLayoutEffect } from 'react';

import { fijarTema, useTemaOscuro } from '@/lib/tema';

export function SelectorTema() {
  const oscuro = useTemaOscuro();

  // Solo en desarrollo: el remount de Strict Mode deja <html> con los
  // atributos del JSX y borra el data-theme que puso components/TemaInicial.
  // En producción el atributo sigue ahí y esto no hace nada.
  useLayoutEffect(() => {
    if (document.documentElement.hasAttribute('data-theme')) return;
    // Mismo criterio que components/TemaInicial: sin preferencia guardada, claro.
    const guardado = localStorage.getItem('tema');
    document.documentElement.setAttribute('data-theme', guardado === 'dark' ? 'dark' : 'light');
  }, []);

  return (
    <button
      type="button"
      onClick={() => fijarTema(oscuro ? 'light' : 'dark')}
      aria-pressed={oscuro}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="grid h-11 w-11 shrink-0 place-items-center border border-tinta/55 text-tinta transition-colors hover:border-azul hover:text-azul-texto"
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
