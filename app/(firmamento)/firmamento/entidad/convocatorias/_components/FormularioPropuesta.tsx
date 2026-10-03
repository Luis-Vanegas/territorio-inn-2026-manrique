'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';

import {
  proponerConvocatoria,
  type CampoPropuesta,
  type EstadoPropuesta,
} from '@/lib/actions/proponerConvocatoria';

const ESTADO_INICIAL: EstadoPropuesta = { estado: 'inicial' };

const claseCampo =
  'mt-2 block min-h-[48px] w-full rounded-lg border bg-tinta/[0.03] px-4 py-2.5 font-sans text-base text-tinta';

type Errores = Partial<Record<CampoPropuesta, string[]>>;

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-azul-texto px-6 font-sans text-base font-medium text-hueso disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Enviando…' : 'Enviar al equipo'}
    </button>
  );
}

/**
 * Etiqueta, ayuda, casilla y error de un campo. Vive FUERA del formulario a
 * propósito: definida adentro sería un componente nuevo en cada render y las
 * casillas se vaciarían al enviar o al cambiar el estado de la acción.
 */
function Campo({
  nombre,
  etiqueta,
  ayuda,
  errores,
  children,
}: {
  nombre: CampoPropuesta;
  etiqueta: string;
  ayuda?: string;
  errores: Errores;
  children: (p: { id: string; describedBy: string | undefined; invalido: boolean; clase: string }) => React.ReactNode;
}) {
  const id = `propuesta-${nombre}`;
  const mensajes = errores[nombre];
  const hayError = Boolean(mensajes?.length);
  const describedBy = [ayuda ? `${id}-ayuda` : null, hayError ? `${id}-error` : null].filter(Boolean).join(' ');
  return (
    <div>
      <label htmlFor={id} className="block font-sans text-sm font-medium text-tinta">
        {etiqueta}
      </label>
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 font-sans text-sm leading-snug text-tinta/70">
          {ayuda}
        </p>
      )}
      {children({
        id,
        describedBy: describedBy || undefined,
        invalido: hayError,
        clase: `${claseCampo} ${hayError ? 'border-amarillo' : 'border-tinta/55'}`,
      })}
      {hayError && (
        <p
          id={`${id}-error`}
          className="mt-2 border-l-2 border-amarillo pl-3 font-sans text-sm leading-snug text-tinta"
        >
          <span className="font-medium">Revisa: </span>
          {mensajes!.join(' ')}
        </p>
      )}
    </div>
  );
}

/**
 * Proponer una convocatoria. La entidad que propone NO se elige aquí: la pone el
 * servidor desde tu membresía. Llega `pendiente` y el equipo decide; mientras
 * tanto aparece en «Tus propuestas».
 *
 * Los errores van junto a su casilla (`aria-invalid`, `aria-describedby`) y
 * también en un resumen con `role="alert"`; el error nunca depende solo del color
 * (lleva borde y la palabra «Revisa»). Lo que escribiste vuelve a la casilla si
 * algo falla: React vacía el formulario al terminar la acción, así que la acción
 * devuelve los valores y se ponen como `defaultValue`.
 *
 * `temas` y `hoy` vienen del servidor: así el cliente no carga el schema (zod).
 */
export function FormularioPropuesta({ temas, hoy }: { temas: readonly string[]; hoy: string }) {
  const [estado, accion] = useActionState(proponerConvocatoria, ESTADO_INICIAL);
  const sinMovimiento = useReducedMotion();

  const errores: Errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const valores = estado.estado === 'error' ? (estado.valores ?? {}) : {};

  return (
    <form action={accion} className="border border-tinta/12 bg-hueso p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium text-tinta">Proponer una convocatoria</h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">
        ¿Tu entidad abrió una convocatoria para negocios de la comuna? Cuéntanosla. El equipo la revisa
        antes de mostrarla: nada se publica solo.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <Campo nombre="titulo" etiqueta="Nombre de la convocatoria" errores={errores}>
          {({ id, describedBy, invalido, clase }) => (
            <input
              id={id}
              name="titulo"
              type="text"
              required
              minLength={5}
              maxLength={200}
              defaultValue={valores.titulo}
              aria-invalid={invalido || undefined}
              aria-describedby={describedBy}
              className={clase}
            />
          )}
        </Campo>

        <Campo
          nombre="url"
          etiqueta="Enlace oficial"
          ayuda="La página de tu entidad donde está la convocatoria. Debe empezar por https://"
          errores={errores}
        >
          {({ id, describedBy, invalido, clase }) => (
            <input
              id={id}
              name="url"
              type="url"
              required
              maxLength={500}
              inputMode="url"
              autoComplete="off"
              placeholder="https://"
              defaultValue={valores.url}
              aria-invalid={invalido || undefined}
              aria-describedby={describedBy}
              className={clase}
            />
          )}
        </Campo>

        <Campo nombre="tema" etiqueta="Tema" errores={errores}>
          {({ id, describedBy, invalido, clase }) => (
            <select
              id={id}
              name="tema"
              required
              defaultValue={valores.tema ?? ''}
              aria-invalid={invalido || undefined}
              aria-describedby={describedBy}
              className={clase}
            >
              <option value="" disabled>
                Elige un tema
              </option>
              {temas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <Campo
          nombre="fecha_cierre"
          etiqueta="Fecha de cierre (opcional)"
          ayuda="Si no tiene fecha, déjala vacía."
          errores={errores}
        >
          {({ id, describedBy, invalido, clase }) => (
            <input
              id={id}
              name="fecha_cierre"
              type="date"
              min={hoy}
              defaultValue={valores.fecha_cierre}
              aria-invalid={invalido || undefined}
              aria-describedby={describedBy}
              className={clase}
            />
          )}
        </Campo>

        <Campo
          nombre="resumen"
          etiqueta="Resumen (opcional)"
          ayuda="Para quién es y qué ofrece, en pocas líneas. Máximo 600 letras."
          errores={errores}
        >
          {({ id, describedBy, invalido, clase }) => (
            <textarea
              id={id}
              name="resumen"
              rows={4}
              maxLength={600}
              defaultValue={valores.resumen}
              aria-invalid={invalido || undefined}
              aria-describedby={describedBy}
              className={clase}
            />
          )}
        </Campo>
      </div>

      {estado.estado === 'error' && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-amarillo bg-tinta/[0.03] px-4 py-3 font-sans text-sm leading-relaxed text-tinta"
        >
          {estado.mensaje}
        </p>
      )}
      {estado.estado === 'ok' && (
        <motion.p
          role="status"
          initial={sinMovimiento ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-5 border-l-2 border-azul bg-tinta/[0.03] px-4 py-3 font-sans text-sm leading-relaxed text-tinta"
        >
          {estado.mensaje}
        </motion.p>
      )}

      <Boton />
    </form>
  );
}
