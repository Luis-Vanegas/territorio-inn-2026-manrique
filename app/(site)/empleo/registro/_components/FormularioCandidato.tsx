'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  registrarCandidato,
  type EstadoRegistroCandidato,
  type ValoresEnviados,
} from '@/lib/actions/registrarCandidato';
import { OPCIONES_NIVEL_FORMACION } from '@/lib/validation/candidato.schema';

const ESTADO_INICIAL: EstadoRegistroCandidato = { estado: 'inicial' };

const ETIQUETAS_NIVEL: Record<(typeof OPCIONES_NIVEL_FORMACION)[number], string> = {
  universitaria: 'Universitaria',
  tecnologica: 'Tecnológica',
  tecnica: 'Técnica',
  tecnico_sena: 'SENA',
  bachiller: 'Bachiller',
  ninguna: 'Sin formación formal',
};

const NIVELES_CON_PROGRAMA = ['universitaria', 'tecnologica', 'tecnica', 'tecnico_sena'];

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-terracota';

const claseEtiqueta = 'block font-mono text-xs uppercase tracking-wider text-tinta/65';

function Error({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null;
  return (
    <p role="alert" className="mt-2 font-sans text-xs text-terracota-texto">
      {mensajes[0]}
    </p>
  );
}

function Campo({
  etiqueta,
  ayuda,
  children,
  errores,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
  errores?: string[];
}) {
  return (
    <div>
      <label className={claseEtiqueta}>{etiqueta}</label>
      {ayuda && <p className="mt-1 font-sans text-xs text-tinta/50">{ayuda}</p>}
      <div className="mt-2">{children}</div>
      <Error mensajes={errores} />
    </div>
  );
}

export function FormularioCandidato() {
  const [estado, accion] = useActionState(registrarCandidato, ESTADO_INICIAL);
  const [nivel, setNivel] = useState('');
  const [iniciadoEn] = useState(() => Date.now());

  const errores = useMemo(
    () => (estado.estado === 'error' ? (estado.errores ?? {}) : {}),
    [estado],
  );
  const valoresPrevios: Partial<ValoresEnviados> = useMemo(
    () => (estado.estado === 'error' ? (estado.valores ?? {}) : {}),
    [estado],
  );

  // Repoblar tras un error: React 19 resetea los inputs no controlados al
  // terminar cualquier action. Mismo patrón que FormularioServicio.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  const [intentoId, setIntentoId] = useState(0);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    setIntentoId((n) => n + 1);
    if (estado.estado === 'error') setNivel(estado.valores?.nivel_formacion ?? '');
  }

  const muestraPrograma = NIVELES_CON_PROGRAMA.includes(nivel);

  return (
    <form action={accion} noValidate>
      <input type="hidden" name="iniciado_en" value={iniciadoEn} />
      {/* Trampa para bots. Oculta visualmente, no con `hidden`: un bot que
          parsea el HTML la llena igual, una persona nunca la ve. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <input name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      {estado.estado === 'error' && estado.mensaje && (
        <p
          role="alert"
          className="mb-8 border-l-2 border-terracota bg-terracota/[0.04] px-4 py-3 font-sans text-sm text-tinta"
        >
          {estado.mensaje}
        </p>
      )}

      <div className="flex flex-col gap-8">
        <Campo etiqueta="Nombre" errores={errores.nombre}>
          <input
            key={`nombre-${intentoId}`}
            name="nombre"
            defaultValue={valoresPrevios.nombre}
            className={claseInput}
            placeholder="Juan Pablo Gómez"
          />
        </Campo>

        <Campo
          etiqueta="Teléfono"
          ayuda="Se publica. Es la única forma que va a tener quien te quiera contratar de escribirte."
          errores={errores.telefono}
        >
          <input
            key={`telefono-${intentoId}`}
            name="telefono"
            defaultValue={valoresPrevios.telefono}
            className={claseInput}
            placeholder="300 123 4567"
          />
        </Campo>

        <Campo etiqueta="Nivel de formación" errores={errores.nivel_formacion}>
          <select
            key={`nivel_formacion-${intentoId}`}
            name="nivel_formacion"
            defaultValue={valoresPrevios.nivel_formacion ?? ''}
            onChange={(e) => setNivel(e.target.value)}
            className={claseInput}
          >
            <option value="">Elige uno…</option>
            {OPCIONES_NIVEL_FORMACION.map((o) => (
              <option key={o} value={o}>
                {ETIQUETAS_NIVEL[o]}
              </option>
            ))}
          </select>
        </Campo>

        {muestraPrograma && (
          <>
            <Campo etiqueta="Programa o carrera" errores={errores.programa}>
              <input
                key={`programa-${intentoId}`}
                name="programa"
                defaultValue={valoresPrevios.programa ?? ''}
                className={claseInput}
                placeholder="Ingeniería de Sistemas"
              />
            </Campo>

            <fieldset>
              <legend className={claseEtiqueta}>¿Ya te graduaste?</legend>
              <div className="mt-2 flex gap-5">
                {[
                  { v: 'si', t: 'Sí' },
                  { v: 'no', t: 'Todavía no' },
                ].map(({ v, t }) => (
                  <label
                    key={v}
                    className="flex items-center gap-2 font-sans text-sm text-tinta/80"
                  >
                    <input
                      key={`graduado-${v}-${intentoId}`}
                      type="radio"
                      name="graduado"
                      value={v}
                      defaultChecked={valoresPrevios.graduado === (v === 'si')}
                      className="accent-terracota"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <Campo
          etiqueta="¿Qué sabes hacer?"
          ayuda="Mientras más concreto, más confianza genera. Ej: “Manejo Excel, atención al cliente, dos años en bodega.”"
          errores={errores.experiencia}
        >
          <textarea
            key={`experiencia-${intentoId}`}
            name="experiencia"
            rows={3}
            defaultValue={valoresPrevios.experiencia}
            className={claseInput}
            maxLength={400}
          />
        </Campo>

        <Campo
          etiqueta="¿Qué tipo de trabajo buscas?"
          ayuda="Ej: “Auxiliar administrativo”, “Cualquier cosa en bodega o logística”."
          errores={errores.busca}
        >
          <input
            key={`busca-${intentoId}`}
            name="busca"
            defaultValue={valoresPrevios.busca}
            className={claseInput}
            maxLength={200}
          />
        </Campo>

        <div className="flex flex-col gap-3 border-t border-tinta/12 pt-6">
          <label className="flex items-start gap-2.5 font-sans text-sm text-tinta">
            <input
              key={`acepto_terminos-${intentoId}`}
              type="checkbox"
              name="acepto_terminos"
              defaultChecked={Boolean(valoresPrevios.acepto_terminos)}
              className="mt-1 accent-terracota"
            />
            <span>
              Leí y acepto los{' '}
              <Link
                href="/legal/empleo"
                target="_blank"
                className="text-terracota-texto underline underline-offset-2"
              >
                términos del módulo Empleo
              </Link>{' '}
              — qué es este proyecto, qué se publica y qué no.
            </span>
          </label>
          <Error mensajes={errores.acepto_terminos} />

          <label className="flex items-start gap-2.5 font-sans text-sm text-tinta">
            <input
              key={`acepto_habeas_data-${intentoId}`}
              type="checkbox"
              name="acepto_habeas_data"
              defaultChecked={Boolean(valoresPrevios.acepto_habeas_data)}
              className="mt-1 accent-terracota"
            />
            <span>
              Autorizo que guarden y traten mis datos, y entiendo que mi
              nombre, mi teléfono y lo que escribí acá quedan{' '}
              <strong className="font-medium">públicos en internet</strong>.
            </span>
          </label>
          <Error mensajes={errores.acepto_habeas_data} />
        </div>

        <button
          type="submit"
          className="min-h-11 self-start border border-terracota-texto bg-terracota-texto px-6 py-2.5 font-mono text-sm text-hueso transition-opacity hover:opacity-90"
        >
          Publicarme →
        </button>
      </div>
    </form>
  );
}
