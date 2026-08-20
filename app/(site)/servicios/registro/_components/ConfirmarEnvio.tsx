'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

/**
 * Confirmación explícita antes de enviar el registro.
 *
 * Por qué existe: publicar el nombre, la foto y el teléfono de una persona en
 * internet no puede pasar por accidente ni por inercia de tanto tocar
 * "siguiente". El último gesto tiene que ser deliberado y tiene que decir, en
 * ese mismo momento, exactamente qué se está autorizando.
 *
 * ── Por qué `<dialog>` nativo y no un div ──
 *
 * El elemento `<dialog>` con `showModal()` trae de fábrica lo que un modal
 * hecho a mano casi siempre olvida: atrapa el foco adentro (con Tab no te vas
 * a la página de atrás), cierra con Escape, inertiza el resto del documento
 * para lectores de pantalla, y pinta su propio `::backdrop`. Escribir eso a
 * mano son decenas de líneas y tres bugs de accesibilidad esperando. La
 * plataforma ya lo hace.
 *
 * El `<dialog>` vive DENTRO del `<form>`: así el botón de adentro es un submit
 * real del formulario y no hace falta reenviar nada por JavaScript.
 *
 * El botón final se habilita solo cuando la casilla está marcada, y eso se
 * controla con estado y no con el atributo `required`: el formulario lleva
 * `noValidate` —porque los pasos ocultos harían fallar la validación nativa con
 * "control no enfocable"— así que `required` no bloquearía nada. Sin esto, la
 * persona enviaría sin autorizar, Zod lo rechazaría en el servidor y el error
 * aparecería en un paso donde la casilla ni siquiera está a la vista.
 */
export function ConfirmarEnvio() {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [autorizado, setAutorizado] = useState(false);
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => dialogo.current?.showModal()}
        className="min-h-11 border border-terracota bg-terracota px-6 py-2.5 font-mono text-sm text-hueso transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Revisar y enviar'}
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby="confirmar-titulo"
        className="w-[min(32rem,calc(100vw-2rem))] border border-tinta/15 bg-hueso p-0 text-tinta backdrop:bg-tinta/40 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-8">
          <span className="font-mono text-xs text-terracota">Último paso</span>

          <h2
            id="confirmar-titulo"
            className="mt-2 font-display text-2xl font-medium leading-tight text-tinta"
          >
            ¿Estás seguro de entregar tus datos?
          </h2>

          <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/75">
            Antes de enviar, leé qué pasa con lo que nos diste:
          </p>

          <ul className="mt-4 flex list-disc flex-col gap-2 pl-4 font-sans text-sm leading-relaxed text-tinta/80">
            <li>
              <strong className="font-medium text-tinta">
                Tu nombre, tu oficio, tu experiencia, los barrios donde atendés
                y tu teléfono quedan públicos
              </strong>{' '}
              en internet, para que la gente pueda encontrarte y contactarte.
            </li>
            <li>
              Tu foto <strong className="font-medium text-tinta">nunca se publica</strong>.
              La guardamos en privado únicamente para poder identificarte si
              llega a haber un problema — es lo que respalda el compromiso que
              estás por aceptar.
            </li>
            <li>
              El resto de tus respuestas —tu correo y todo lo que contestaste en
              el paso 4— tampoco se publica y se usa{' '}
              <strong className="font-medium text-tinta">únicamente</strong> para
              la investigación de este proyecto.
            </li>
            <li>
              Tus datos personales{' '}
              <strong className="font-medium text-tinta">
                no se usan para ninguna otra finalidad, no se comparten con
                terceros y no se venden
              </strong>
              . No salen de este proyecto.
            </li>
            <li>
              Nunca te pedimos tu documento ni tu dirección, y no los guardamos.
            </li>
            <li>
              Podés{' '}
              <strong className="font-medium text-tinta">
                corregir o borrar todo cuando quieras
              </strong>
              , con el enlace privado que te damos apenas envíes.
            </li>
          </ul>

          {/* El checkbox va acá adentro, en el mismo gesto que la confirmación:
              es lo que la base exige para poder guardar la caracterización. */}
          <label className="mt-6 flex items-start gap-2.5 border-l-2 border-terracota bg-terracota/[0.04] px-4 py-3 font-sans text-sm leading-relaxed text-tinta">
            <input
              type="checkbox"
              name="acepto_investigacion"
              checked={autorizado}
              onChange={(e) => setAutorizado(e.target.checked)}
              className="mt-1 accent-terracota"
            />
            <span>
              Estoy seguro. Autorizo que mis datos se usen para la investigación
              de este proyecto, con los límites que acabo de leer y los{' '}
              <Link
                href="/legal/servicios"
                target="_blank"
                className="underline decoration-terracota underline-offset-2"
              >
                términos completos
              </Link>
              .
            </span>
          </label>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-tinta/12 pt-5">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="min-h-11 px-4 font-mono text-sm text-tinta/65 hover:text-tinta"
            >
              Volver a revisar
            </button>
            <button
              type="submit"
              disabled={!autorizado || pending}
              title={autorizado ? undefined : 'Marcá la casilla para poder enviar'}
              className="min-h-11 border border-terracota bg-terracota px-6 py-2.5 font-mono text-sm text-hueso transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? 'Enviando…' : 'Sí, publicar mi servicio'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
