import type { TipoInteraccion } from '@/lib/db/interacciones.repo';

/**
 * Avisa al servidor que alguien miró o contactó a un aliado.
 *
 * `sendBeacon` es la API nativa para esto y resuelve el caso difícil: cuando
 * la persona toca "Escribir por WhatsApp", el navegador se va de la página en
 * ese mismo gesto. Un `fetch` normal se cancela; el beacon lo entrega igual
 * porque el navegador se hace cargo de la cola.
 *
 * Nunca lanza ni bloquea: contar es lo menos importante que pasa en la página.
 * Si falla, se pierde un número — no se le rompe la navegación a nadie.
 */
export function contar(id: string, tipo: TipoInteraccion): void {
  const cuerpo = JSON.stringify({ id, tipo });

  try {
    if (navigator.sendBeacon?.('/api/interacciones', cuerpo)) return;

    // Fallback para navegadores sin sendBeacon. keepalive hace que la request
    // sobreviva a la navegación, que es la mitad de lo que da el beacon.
    void fetch('/api/interacciones', {
      method: 'POST',
      body: cuerpo,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Sin red, sin permisos, con un bloqueador de por medio: da igual.
  }
}
