'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';

import { consultarAsesor } from '@/lib/actions/consultarAsesor';
import type { EstadoAsesor } from '@/lib/validation/asesor.schema';

/**
 * Asesor de formalización, con forma de conversación.
 *
 * ── Qué recuerda y qué no ──
 *
 * El hilo vive solo en el estado del navegador: se pierde al recargar y no se
 * guarda en ningún lado (guardarlo pediría tabla, política de datos y purga).
 * Con cada pregunta viajan las últimas 3 que tuvieron respuesta —sin las
 * respuestas—: alcanza para entender un "¿y eso cuánto cuesta?" por ~10% más
 * de tokens. Reenviar también las respuestas costaba ~47% más.
 *
 * ponytail: memoria de solo preguntas. Si el asesor se pierde con algo que
 * dijo él mismo, se suman las respuestas (anterioresSchema).
 *
 * ── Una caja, tres puertas ──
 *
 * La usa la ficha del negocio (con su `token`, y la acción por defecto), el
 * panel de moderación (sin token, con `consultarAsesorAdmin`) y el botón
 * flotante del vecino con sesión (`consultarAsesorUsuario`). Lo que cambia
 * entre las tres entra por props. La cola común del lado del servidor está en
 * lib/agente/responder.ts.
 *
 * `variante="panel"` ocupa todo el alto de su contenedor (el <dialog> de
 * AsesorFlotante, que pone su propio título); `seccion` va en una caja de alto
 * fijo dentro de la página.
 */

type AccionAsesor = (anterior: EstadoAsesor, formData: FormData) => Promise<EstadoAsesor>;

type Mensaje = { rol: 'vecino' | 'asesor' | 'error'; texto: string };

/**
 * Arrancar en blanco frente a alguien que nunca usó algo así es la forma más
 * segura de que cierre la página. Estas tres son las que aparecen una y otra
 * vez en las respuestas de `mayor_dolor` del registro.
 */
const SUGERENCIAS = [
  '¿Qué necesito para sacar el RUT?',
  '¿Dónde puedo pedir un crédito para mi negocio?',
  '¿Me conviene matricularme en la cámara de comercio?',
];

/** Cara de agente: la usan el botón flotante y el avatar de cada respuesta. */
export function IconoAgente({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 2.5v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="2.5" r="1.2" fill="currentColor" />
      <rect x="4" y="6" width="16" height="13" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 11.5v3M22 11.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="11.5" r="1.4" fill="currentColor" />
      <circle cx="15" cy="11.5" r="1.4" fill="currentColor" />
      <path d="M9.5 15.2c1.4 1 3.6 1 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Avatar() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-azul-texto text-hueso">
      <IconoAgente className="h-5 w-5" />
    </span>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  if (mensaje.rol === 'vecino') {
    return (
      <li className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-azul-texto px-4 py-2.5 font-sans text-base leading-relaxed text-hueso">
          <span className="sr-only">Tú: </span>
          {mensaje.texto}
        </p>
      </li>
    );
  }

  return (
    <li className="flex items-end gap-2">
      <Avatar />
      {/* whitespace-pre-line respeta los saltos de línea del modelo sin
          interpretar el texto como HTML — renderizar markdown acá sería una
          dependencia y una superficie de inyección por una negrita. */}
      <p
        className={`max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm px-4 py-2.5 font-sans text-base leading-relaxed text-tinta ${
          mensaje.rol === 'error' ? 'border-l-2 border-azul bg-azul/[0.06]' : 'bg-tinta/[0.06]'
        }`}
      >
        <span className="sr-only">Asesor: </span>
        {mensaje.texto}
      </p>
    </li>
  );
}

export function Asesor({
  token,
  accion: consultar = consultarAsesor,
  descripcion = 'Pregunta lo que necesites sobre trámites, cámara de comercio, apoyos económicos o formación. Conoce los datos de tu negocio, así que puedes preguntar directo.',
  hrefRutas = '/formalizacion',
  variante = 'seccion',
}: {
  /** Token del negocio. Sin él (moderación) no hay ficha: la pregunta es general. */
  token?: string;
  accion?: AccionAsesor;
  descripcion?: string;
  /** Adónde lleva «Ver todas las rutas»: cada puerta apunta a su propia copia. */
  hrefRutas?: string;
  variante?: 'seccion' | 'panel';
}) {
  const [hilo, enviar, pendiente] = useActionState(
    async (previo: Mensaje[], formData: FormData): Promise<Mensaje[]> => {
      const pregunta = (formData.get('pregunta') ?? '').toString().trim();
      const r = await consultar({ estado: 'inicial' }, formData);
      if (r.estado === 'ok') {
        return [...previo, { rol: 'vecino', texto: r.pregunta }, { rol: 'asesor', texto: r.respuesta }];
      }
      if (r.estado === 'error') {
        return [...previo, { rol: 'vecino', texto: pregunta }, { rol: 'error', texto: r.mensaje }];
      }
      return previo;
    },
    [],
  );
  // La pregunta se ve en pantalla apenas se envía, no cuando vuelve la
  // respuesta: onSubmit corre antes que la action y el form se vacía después.
  const [enEspera, setEnEspera] = useState('');

  const formulario = useRef<HTMLFormElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  // En la ficha del negocio conviven la caja de la página y la del botón
  // flotante: un id fijo haría que el label de una enfoque el campo de la otra.
  const idPregunta = useId();
  const enPanel = variante === 'panel';
  // Solo las que tuvieron respuesta: una pregunta que dio error no es contexto.
  const anteriores = hilo
    .flatMap((m, i) => (m.rol === 'vecino' && hilo[i + 1]?.rol === 'asesor' ? [m.texto] : []))
    .slice(-3);

  // Se mueve solo la caja de mensajes. scrollIntoView movería también la
  // página, y en la ficha del negocio la bajaría hasta el chat apenas carga.
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight;
  }, [hilo.length, pendiente]);

  function preguntarSugerencia(texto: string) {
    if (!campo.current) return;
    campo.current.value = texto;
    formulario.current?.requestSubmit();
  }

  return (
    <section className={enPanel ? 'flex min-h-0 flex-1 flex-col' : 'mt-16 border-t border-tinta/12 pt-10'}>
      {!enPanel && (
        <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/60">
          Asesor de formalización
        </h2>
      )}

      <div
        className={
          enPanel
            ? 'flex min-h-0 flex-1 flex-col'
            : 'mt-6 flex h-[34rem] max-h-[80dvh] max-w-2xl flex-col border border-tinta/55'
        }
      >
        <div ref={lista} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          <ul role="log" aria-live="polite" aria-label="Conversación con el asesor" className="space-y-4">
            <Burbuja mensaje={{ rol: 'asesor', texto: descripcion }} />
            {hilo.map((m, i) => (
              <Burbuja key={i} mensaje={m} />
            ))}
            {pendiente && enEspera && <Burbuja mensaje={{ rol: 'vecino', texto: enEspera }} />}
            {pendiente && (
              <li className="flex items-end gap-2">
                <Avatar />
                <p className="rounded-2xl rounded-bl-sm bg-tinta/[0.06] px-4 py-2.5 font-sans text-base text-tinta/65">
                  Buscando la respuesta…
                </p>
              </li>
            )}
          </ul>

          {hilo.length === 0 && !pendiente && (
            <div className="mt-5 pl-10">
              <p className="font-sans text-xs text-tinta/60">Prueba con una de estas:</p>
              <ul className="mt-2 flex flex-col items-start gap-2">
                {SUGERENCIAS.map((sugerencia) => (
                  <li key={sugerencia}>
                    <button
                      type="button"
                      onClick={() => preguntarSugerencia(sugerencia)}
                      disabled={pendiente}
                      className="min-h-[44px] rounded-2xl border border-tinta/55 px-4 py-2 text-left font-sans text-sm text-tinta/75 transition-colors hover:border-azul hover:text-azul-texto disabled:opacity-50"
                    >
                      {sugerencia}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form
          ref={formulario}
          action={enviar}
          onSubmit={() => setEnEspera(campo.current?.value.trim() ?? '')}
          className="border-t border-tinta/15 px-4 pb-4 pt-3 sm:px-5">
          {token && <input type="hidden" name="token" value={token} />}
          {anteriores.map((a, i) => (
            <input key={i} type="hidden" name="anterior" value={a} />
          ))}

          <label htmlFor={idPregunta} className="sr-only">
            Tu pregunta
          </label>
          <div className="flex items-end gap-2">
            {/* field-sizing crece con el texto sin JS; donde no existe (Safari),
                queda en una línea con scroll y funciona igual. */}
            <textarea
              id={idPregunta}
              name="pregunta"
              ref={campo}
              rows={1}
              maxLength={500}
              required
              placeholder="Escribe tu pregunta…"
              onKeyDown={(e) => {
                // Enter envía, Shift+Enter hace salto de línea: lo que la gente
                // ya espera de cualquier chat.
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (!pendiente) formulario.current?.requestSubmit();
                }
              }}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-tinta/55 bg-transparent px-4 py-2.5 font-sans text-base text-tinta [field-sizing:content] placeholder:text-tinta/65 focus:border-azul focus:outline-none"
            />
            <button
              type="submit"
              disabled={pendiente}
              aria-label="Enviar pregunta"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-azul-texto text-hueso transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <p className="mt-2 font-sans text-xs leading-relaxed text-tinta/60">
            Es una orientación, no asesoría legal ni contable.{' '}
            <Link href={hrefRutas} className="underline decoration-azul underline-offset-4 hover:text-azul-texto">
              Ver todas las rutas
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
