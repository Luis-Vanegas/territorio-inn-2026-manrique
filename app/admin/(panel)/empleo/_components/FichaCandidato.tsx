'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import type { CandidatoModeracion, EstadoCandidato } from '@/lib/db/candidatos.repo';
import { moderarCandidatoAction, type EstadoModeracionCandidato } from '@/lib/actions/moderarCandidato';
import {
  editarCandidatoModeradorAction,
  type EstadoEdicionCandidato,
} from '@/lib/actions/editarCandidatoModerador';
import { OPCIONES_NIVEL_FORMACION } from '@/lib/validation/candidato.schema';
import { BadgeEstado, type TonoBadge } from '@/components/admin/BadgeEstado';

const INICIAL_MOD: EstadoModeracionCandidato = { estado: 'inicial' };
const INICIAL_EDICION: EstadoEdicionCandidato = { estado: 'inicial' };

const ETIQUETA_ESTADO: Record<EstadoCandidato, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Publicado',
  rechazado: 'Rechazado',
  archivado: 'Retirado',
};

const TONO_ESTADO: Record<EstadoCandidato, TonoBadge> = {
  pendiente: 'neutral',
  aprobado: 'positivo',
  rechazado: 'negativo',
  archivado: 'atenuado',
};

const ETIQUETAS_NIVEL: Record<string, string> = {
  universitaria: 'Universitaria',
  tecnologica: 'Tecnológica',
  tecnica: 'Técnica',
  tecnico_sena: 'SENA',
  bachiller: 'Bachiller',
  ninguna: 'Sin formación formal',
};

const NIVELES_CON_PROGRAMA = ['universitaria', 'tecnologica', 'tecnica', 'tecnico_sena'];

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-sm text-tinta ' +
  'focus:border-azul focus:outline-none focus:ring-0';

function BotonModeracion({
  accion,
  etiqueta,
  variante,
  confirmar,
}: {
  accion: 'aprobar' | 'rechazar' | 'retirar';
  etiqueta: string;
  variante: 'primaria' | 'secundaria';
  /** Si viene, pide confirmación antes de dejar pasar el submit. */
  confirmar?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="accion"
      value={accion}
      disabled={pending}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={[
        'min-h-11 border px-5 py-2 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variante === 'primaria'
          ? 'border-azul-texto bg-azul-texto text-hueso hover:opacity-90'
          : 'border-tinta/25 text-tinta/70 hover:border-azul-texto hover:text-azul-texto',
      ].join(' ')}
    >
      {pending ? 'Guardando…' : etiqueta}
    </button>
  );
}

/** Edición inline de datos por un moderador — no toca el estado de moderación. */
function FormularioEdicion({
  candidato,
  onCancelar,
}: {
  candidato: CandidatoModeracion;
  onCancelar: () => void;
}) {
  const [estado, accion] = useActionState(editarCandidatoModeradorAction, INICIAL_EDICION);
  const [nivel, setNivel] = useState(candidato.nivel_formacion);
  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const muestraPrograma = NIVELES_CON_PROGRAMA.includes(nivel);

  return (
    <form action={accion} className="mt-6 flex max-w-xl flex-col gap-4 border-t border-tinta/12 pt-6">
      <input type="hidden" name="id" value={candidato.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wider text-tinta/65">Nombre</span>
          <input name="nombre" defaultValue={candidato.nombre} className={claseInput} />
          {errores.nombre && <span className="font-mono text-xs text-azul-texto">{errores.nombre[0]}</span>}
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wider text-tinta/65">Teléfono</span>
          <input name="telefono" defaultValue={candidato.telefono} className={claseInput} />
          {errores.telefono && <span className="font-mono text-xs text-azul-texto">{errores.telefono[0]}</span>}
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-wider text-tinta/65">Nivel de formación</span>
          <select
            name="nivel_formacion"
            defaultValue={candidato.nivel_formacion}
            onChange={(e) => setNivel(e.target.value)}
            className={claseInput}
          >
            {OPCIONES_NIVEL_FORMACION.map((o) => (
              <option key={o} value={o}>
                {ETIQUETAS_NIVEL[o]}
              </option>
            ))}
          </select>
          {errores.nivel_formacion && (
            <span className="font-mono text-xs text-azul-texto">{errores.nivel_formacion[0]}</span>
          )}
        </label>

        {muestraPrograma && (
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wider text-tinta/65">Programa</span>
            <input name="programa" defaultValue={candidato.programa ?? ''} className={claseInput} />
            {errores.programa && <span className="font-mono text-xs text-azul-texto">{errores.programa[0]}</span>}
          </label>
        )}
      </div>

      {muestraPrograma && (
        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-wider text-tinta/65">¿Ya se graduó?</legend>
          <div className="mt-2 flex gap-5">
            {[
              { v: 'si', t: 'Sí' },
              { v: 'no', t: 'Todavía no' },
            ].map(({ v, t }) => (
              <label key={v} className="flex items-center gap-2 font-sans text-sm text-tinta/80">
                <input
                  type="radio"
                  name="graduado"
                  value={v}
                  defaultChecked={candidato.graduado === (v === 'si')}
                  className="accent-azul"
                />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-wider text-tinta/65">¿Qué sabe hacer?</span>
        <textarea
          name="experiencia"
          rows={3}
          defaultValue={candidato.experiencia}
          maxLength={400}
          className={claseInput}
        />
        {errores.experiencia && <span className="font-mono text-xs text-azul-texto">{errores.experiencia[0]}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-wider text-tinta/65">¿Qué busca?</span>
        <input name="busca" defaultValue={candidato.busca} maxLength={200} className={claseInput} />
        {errores.busca && <span className="font-mono text-xs text-azul-texto">{errores.busca[0]}</span>}
      </label>

      <div className="flex items-center gap-3">
        <BotonGuardar />
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-11 font-mono text-xs text-tinta/65 hover:text-tinta"
        >
          Cancelar
        </button>
      </div>

      {estado.estado !== 'inicial' && (
        <p
          role="status"
          className={`font-mono text-xs ${estado.estado === 'ok' ? 'text-tinta/60' : 'text-azul-texto'}`}
        >
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 border border-azul-texto bg-azul-texto px-5 py-2 font-mono text-xs text-hueso transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  );
}

export function FichaCandidato({ candidato }: { candidato: CandidatoModeracion }) {
  const [estadoMod, accionMod] = useActionState(moderarCandidatoAction, INICIAL_MOD);
  const [rechazando, setRechazando] = useState(false);
  const [editando, setEditando] = useState(false);

  return (
    <article className="border-t border-tinta/12 py-8">
      <div className="flex gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-tinta/5 font-mono text-xs text-tinta/60">
          {candidato.nombre.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeEstado etiqueta={ETIQUETA_ESTADO[candidato.estado]} tono={TONO_ESTADO[candidato.estado]} />
          </div>

          <h3 className="mt-2 font-display text-2xl font-medium text-tinta">{candidato.nombre}</h3>

          <p className="mt-1 font-mono text-xs text-azul-texto">
            {ETIQUETAS_NIVEL[candidato.nivel_formacion] ?? candidato.nivel_formacion}
            {candidato.programa && <span className="text-tinta/60"> · {candidato.programa}</span>}
            {candidato.graduado !== null && (
              <span className="text-tinta/60">
                {' · '}
                {candidato.graduado ? 'graduado/a' : 'en curso'}
              </span>
            )}
            <span className="text-tinta/60"> · registrado {candidato.creado_en}</span>
          </p>

          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-tinta/75">
            {candidato.experiencia}
          </p>

          <p className="mt-2 font-mono text-xs text-tinta/60">Busca: {candidato.busca}</p>
          <p className="mt-2 font-mono text-xs text-tinta/60">Tel: {candidato.telefono}</p>

          {candidato.estado === 'rechazado' && candidato.motivo_rechazo && (
            <p className="mt-3 max-w-xl border-l-2 border-azul-texto bg-azul/[0.04] px-3 py-2 font-sans text-xs text-tinta/75">
              Motivo del rechazo: {candidato.motivo_rechazo}
            </p>
          )}

          {candidato.estado === 'archivado' && (
            <p className="mt-3 font-mono text-xs text-tinta/60">Retirado de la vitrina.</p>
          )}

          {editando && <FormularioEdicion candidato={candidato} onCancelar={() => setEditando(false)} />}

          {/* Moderación: qué botones aplican depende del estado actual, nunca
              se muestra Publicar/Rechazar sobre uno ya publicado. */}
          <form action={accionMod} className="mt-6 flex flex-col gap-3">
            <input type="hidden" name="id" value={candidato.id} />

            {rechazando && (
              <textarea
                name="motivo_rechazo"
                rows={2}
                placeholder="Por qué se rechaza — la persona lo va a leer"
                className="w-full max-w-xl border border-tinta/20 bg-transparent px-3 py-2 font-sans text-sm text-tinta focus:border-azul focus:outline-none"
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              {candidato.estado === 'pendiente' && !rechazando && (
                <>
                  <BotonModeracion accion="aprobar" etiqueta="Publicar" variante="primaria" />
                  <button
                    type="button"
                    onClick={() => setRechazando(true)}
                    className="min-h-11 border border-tinta/25 px-5 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-azul-texto hover:text-azul-texto"
                  >
                    Rechazar
                  </button>
                </>
              )}

              {candidato.estado === 'pendiente' && rechazando && (
                <>
                  <BotonModeracion accion="rechazar" etiqueta="Confirmar rechazo" variante="primaria" />
                  <button
                    type="button"
                    onClick={() => setRechazando(false)}
                    className="min-h-11 font-mono text-xs text-tinta/65 hover:text-tinta"
                  >
                    Cancelar
                  </button>
                </>
              )}

              {candidato.estado === 'aprobado' && !editando && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="min-h-11 border border-tinta/25 px-5 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-azul-texto hover:text-azul-texto"
                  >
                    Editar
                  </button>
                  <BotonModeracion
                    accion="retirar"
                    etiqueta="Retirar"
                    variante="secundaria"
                    confirmar="¿Retirar este registro? Se quita de la vitrina de Empleo."
                  />
                </>
              )}

              {(candidato.estado === 'rechazado' || candidato.estado === 'archivado') && (
                <BotonModeracion accion="aprobar" etiqueta="Publicar" variante="primaria" />
              )}
            </div>

            {estadoMod.estado !== 'inicial' && (
              <p
                role="status"
                className={`font-mono text-xs ${estadoMod.estado === 'ok' ? 'text-tinta/60' : 'text-azul-texto'}`}
              >
                {estadoMod.mensaje}
              </p>
            )}
          </form>
        </div>
      </div>
    </article>
  );
}
