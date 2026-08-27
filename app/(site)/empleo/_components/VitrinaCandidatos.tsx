'use client';

import { useMemo, useState } from 'react';

import type { Candidato } from '@/lib/db/candidatos.repo';
import { enlaceWhatsapp } from '@/lib/contacto';
import { OPCIONES_NIVEL_FORMACION } from '@/lib/validation/candidato.schema';

/** Filtrado en memoria: a escala barrial son decenas de fichas, mismo criterio que VitrinaServicios. */

const ETIQUETAS_NIVEL: Record<(typeof OPCIONES_NIVEL_FORMACION)[number], string> = {
  universitaria: 'Universitaria',
  tecnologica: 'Tecnológica',
  tecnica: 'Técnica',
  tecnico_sena: 'SENA',
  bachiller: 'Bachiller',
  ninguna: 'Sin formación formal',
};

/**
 * El teléfono se revela con un clic en vez de ir como texto plano en el HTML.
 * Corta el scraping automatizado — mismo patrón que Servicios.
 */
function Contacto({ telefono, nombre }: { telefono: string; nombre: string }) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="min-h-11 border border-tinta/25 px-4 py-2 font-mono text-xs text-tinta transition-colors hover:border-terracota hover:text-terracota"
      >
        Mostrar teléfono
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={enlaceWhatsapp(telefono)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-11 border border-terracota px-4 py-2 font-mono text-xs text-terracota transition-colors hover:bg-terracota hover:text-hueso"
      >
        WhatsApp a {nombre.split(' ')[0]}
      </a>
      <a href={`tel:${telefono.replace(/\s/g, '')}`} className="font-mono text-xs text-tinta/70">
        {telefono}
      </a>
    </div>
  );
}

function Ficha({ candidato }: { candidato: Candidato }) {
  return (
    <article className="border-t border-tinta/12 py-8">
      <div className="flex gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-tinta/5 font-display text-2xl text-tinta/40">
          {candidato.nombre.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl font-medium leading-tight text-tinta">
            {candidato.nombre}
          </h3>

          <p className="mt-1 font-mono text-xs text-terracota">
            {ETIQUETAS_NIVEL[candidato.nivel_formacion as (typeof OPCIONES_NIVEL_FORMACION)[number]]}
            {candidato.programa && <span className="text-tinta/45"> · {candidato.programa}</span>}
            {candidato.graduado !== null && (
              <span className="text-tinta/45">
                {' · '}
                {candidato.graduado ? 'graduado/a' : 'en curso'}
              </span>
            )}
          </p>

          <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-tinta/75">
            {candidato.experiencia}
          </p>

          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-tinta/45">
            Busca: <span className="font-sans text-xs normal-case text-tinta/65">{candidato.busca}</span>
          </p>

          <div className="mt-5">
            <Contacto telefono={candidato.telefono} nombre={candidato.nombre} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function VitrinaCandidatos({ candidatos }: { candidatos: Candidato[] }) {
  const [nivel, setNivel] = useState('');

  const visibles = useMemo(
    () => candidatos.filter((c) => !nivel || c.nivel_formacion === nivel),
    [candidatos, nivel],
  );

  return (
    <div>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          Nivel de formación
        </span>
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="w-fit border-0 border-b border-tinta/25 bg-transparent py-1.5 pr-6 font-sans text-sm text-tinta focus:border-terracota focus:outline-none"
        >
          <option value="">Todos</option>
          {OPCIONES_NIVEL_FORMACION.map((o) => (
            <option key={o} value={o}>
              {ETIQUETAS_NIVEL[o]}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-6 font-mono text-xs text-tinta/50" aria-live="polite">
        {visibles.length} {visibles.length === 1 ? 'persona' : 'personas'}
      </p>

      <div className="mt-4">
        {visibles.length === 0 ? (
          <p className="border-t border-tinta/12 py-10 font-sans text-sm text-tinta/60">
            Todavía no hay nadie con ese nivel de formación.
          </p>
        ) : (
          visibles.map((c) => <Ficha key={c.id} candidato={c} />)
        )}
      </div>
    </div>
  );
}
