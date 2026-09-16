'use client';

import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';

import { consultarAsesor, type EstadoAsesor } from '@/lib/actions/consultarAsesor';

/**
 * Asesor de formalización dentro del panel del negocio.
 *
 * ── Por qué no es un chat con historial ──
 *
 * Una pregunta, una respuesta. Sin hilo, sin historial, sin scroll infinito.
 * El historial obligaría a guardar conversaciones (tabla nueva, política de
 * datos nueva, purga nueva) y a reenviar el hilo completo en cada request, que
 * es lo que hace que estas cosas se vuelvan caras. Las preguntas reales de
 * este público —"¿qué necesito para el RUT?", "¿dónde pido un crédito?"— son
 * autocontenidas.
 *
 * Se convierte en hilo el día que se vea gente escribiendo "¿y lo anterior?".
 */

const ESTADO_INICIAL: EstadoAsesor = { estado: 'inicial' };

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

function BotonPreguntar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 border border-terracota-texto bg-terracota-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Buscando la respuesta…' : 'Preguntar →'}
    </button>
  );
}

export function Asesor({ token }: { token: string }) {
  const [estado, accion] = useActionState(consultarAsesor, ESTADO_INICIAL);
  const campo = useRef<HTMLTextAreaElement>(null);

  function usarSugerencia(texto: string) {
    if (!campo.current) return;
    campo.current.value = texto;
    campo.current.focus();
  }

  return (
    <section className="mt-16 border-t border-tinta/12 pt-10">
      <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/60">
        Asesor de formalización
      </h2>

      <p className="mt-4 max-w-xl font-sans leading-relaxed text-tinta/70">
        Pregunta lo que necesites sobre trámites, cámara de comercio, apoyos
        económicos o formación. Conoce los datos de tu negocio, así que puedes
        preguntar directo.
      </p>

      <form action={accion} className="mt-6 max-w-xl">
        <input type="hidden" name="token" value={token} />

        <label htmlFor="pregunta" className="block font-mono text-sm text-tinta/70">
          Tu pregunta
        </label>

        <textarea
          id="pregunta"
          name="pregunta"
          ref={campo}
          rows={3}
          maxLength={500}
          required
          placeholder="Escribe aquí tu duda…"
          className="mt-3 w-full resize-y border border-tinta/20 bg-transparent px-4 py-3 font-sans text-tinta placeholder:text-tinta/30 focus:border-terracota focus:outline-none"
        />

        <div className="mt-4">
          <p className="font-mono text-xs text-tinta/45">O prueba con una de estas:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SUGERENCIAS.map((sugerencia) => (
              <li key={sugerencia}>
                <button
                  type="button"
                  onClick={() => usarSugerencia(sugerencia)}
                  className="border border-tinta/15 px-3 py-1.5 text-left font-sans text-sm text-tinta/70 transition-colors hover:border-terracota hover:text-terracota-texto"
                >
                  {sugerencia}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <BotonPreguntar />
      </form>

      {estado.estado === 'error' && (
        <p
          role="alert"
          className="mt-6 max-w-xl border-l-2 border-terracota bg-terracota/[0.04] px-5 py-4 font-sans text-sm leading-relaxed text-tinta"
        >
          {estado.mensaje}
        </p>
      )}

      {estado.estado === 'ok' && (
        <article className="mt-8 max-w-xl border-l-2 border-terracota pl-5">
          <p className="font-mono text-xs text-tinta/45">Preguntaste:</p>
          <p className="mt-1 font-sans text-sm text-tinta/70">{estado.pregunta}</p>

          {/* whitespace-pre-line respeta los saltos de línea del modelo sin
              interpretar el texto como HTML — renderizar markdown acá sería
              una dependencia y una superficie de inyección por una negrita. */}
          <div className="mt-5 whitespace-pre-line font-sans leading-relaxed text-tinta">
            {estado.respuesta}
          </div>

          <p className="mt-6 font-sans text-xs leading-relaxed text-tinta/50">
            Esta respuesta es una orientación, no una asesoría legal ni
            contable. Los valores y plazos vigentes están siempre en la página
            oficial de cada entidad.{' '}
            <Link
              href="/formalizacion"
              className="underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
            >
              Ver todas las rutas
            </Link>
            .
          </p>
        </article>
      )}
    </section>
  );
}
