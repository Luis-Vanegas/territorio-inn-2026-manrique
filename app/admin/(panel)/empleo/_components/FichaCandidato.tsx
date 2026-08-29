'use client';

import { useActionState, useState } from 'react';

import type { CandidatoPendiente } from '@/lib/db/candidatos.repo';
import { moderarCandidatoAction, type EstadoModeracionCandidato } from '@/lib/actions/moderarCandidato';

const INICIAL: EstadoModeracionCandidato = { estado: 'inicial' };

const ETIQUETAS_NIVEL: Record<string, string> = {
  universitaria: 'Universitaria',
  tecnologica: 'Tecnológica',
  tecnica: 'Técnica',
  tecnico_sena: 'SENA',
  bachiller: 'Bachiller',
  ninguna: 'Sin formación formal',
};

export function FichaCandidato({ candidato }: { candidato: CandidatoPendiente }) {
  const [estadoMod, accionMod] = useActionState(moderarCandidatoAction, INICIAL);
  const [rechazando, setRechazando] = useState(false);

  return (
    <article className="border-t border-tinta/12 py-8">
      <div className="flex gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-tinta/5 font-mono text-xs text-tinta/40">
          {candidato.nombre.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl font-medium text-tinta">{candidato.nombre}</h3>

          <p className="mt-1 font-mono text-xs text-terracota-texto">
            {ETIQUETAS_NIVEL[candidato.nivel_formacion] ?? candidato.nivel_formacion}
            {candidato.programa && <span className="text-tinta/45"> · {candidato.programa}</span>}
            {candidato.graduado !== null && (
              <span className="text-tinta/45">
                {' · '}
                {candidato.graduado ? 'graduado/a' : 'en curso'}
              </span>
            )}
            <span className="text-tinta/45"> · registrado {candidato.creado_en}</span>
          </p>

          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-tinta/75">
            {candidato.experiencia}
          </p>

          <p className="mt-2 font-mono text-xs text-tinta/60">Busca: {candidato.busca}</p>
          <p className="mt-2 font-mono text-xs text-tinta/60">Tel: {candidato.telefono}</p>

          {/* Moderación */}
          <form action={accionMod} className="mt-6 flex flex-col gap-3">
            <input type="hidden" name="id" value={candidato.id} />

            {rechazando && (
              <textarea
                name="motivo_rechazo"
                rows={2}
                placeholder="Por qué se rechaza — la persona lo va a leer"
                className="w-full max-w-xl border border-tinta/20 bg-transparent px-3 py-2 font-sans text-sm text-tinta focus:border-terracota focus:outline-none"
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              {!rechazando ? (
                <>
                  <button
                    type="submit"
                    name="accion"
                    value="aprobar"
                    className="min-h-11 border border-terracota-texto bg-terracota-texto px-5 py-2 font-mono text-xs text-hueso transition-opacity hover:opacity-90"
                  >
                    Publicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechazando(true)}
                    className="min-h-11 border border-tinta/25 px-5 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-terracota-texto hover:text-terracota-texto"
                  >
                    Rechazar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    name="accion"
                    value="rechazar"
                    className="min-h-11 border border-terracota-texto px-5 py-2 font-mono text-xs text-terracota-texto transition-colors hover:bg-terracota-texto hover:text-hueso"
                  >
                    Confirmar rechazo
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechazando(false)}
                    className="min-h-11 font-mono text-xs text-tinta/55 hover:text-tinta"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>

            {estadoMod.estado !== 'inicial' && (
              <p
                role="status"
                className={`font-mono text-xs ${estadoMod.estado === 'ok' ? 'text-tinta/60' : 'text-terracota-texto'}`}
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
