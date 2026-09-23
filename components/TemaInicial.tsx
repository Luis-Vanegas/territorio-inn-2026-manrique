// Setea data-theme antes del primer paint: preferencia guardada o, si no hay,
// la del sistema. Es un <script> inline en <head> porque es lo único que corre
// mientras el navegador lee el HTML — un useEffect corre después de pintar y
// next/script (beforeInteractive) encola el código para después, así que los
// dos dejan ver el tema equivocado un instante.
//
// 'use client' por el `type`: en el server sale text/javascript (el navegador
// lo ejecuta al parsear) y en el cliente text/plain, así React no encuentra un
// script ejecutable al hidratar y no lanza "Encountered a script tag".
// suppressHydrationWarning cubre esa diferencia a propósito.
// Patrón de node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md

'use client';

const CODIGO = `(function(){try{var t=localStorage.getItem('tema');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function TemaInicial() {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: CODIGO }}
    />
  );
}
