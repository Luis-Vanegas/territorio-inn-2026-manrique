'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  moderarConvocatoria,
  type EstadoModeracionConvocatoria,
} from '@/lib/actions/moderarConvocatoria';
import type { Convocatoria } from '@/lib/db/convocatorias.repo';
import { BadgeEstado, type TonoBadge } from '@/components/admin/BadgeEstado';

const ESTADO_INICIAL: EstadoModeracionConvocatoria = { estado: 'inicial' };

const ETIQUETA: Record<Convocatoria['estado'], { texto: string; tono: TonoBadge }> = {
  pendiente: { texto: 'Pendiente', tono: 'neutral' },
  aprobada: { texto: 'Aprobada', tono: 'positivo' },
  descartada: { texto: 'Descartada', tono: 'atenuado' },
  vencida: { texto: 'Vencida', tono: 'atenuado' },
};

const CLASE_BASE =
  'inline-flex min-h-11 items-center border px-4 py-2 font-sans text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40';

function Boton({
  decision,
  etiqueta,
  principal,
}: {
  decision: 'aprobar' | 'descartar' | 'vencida';
  etiqueta: string;
  principal?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="decision"
      value={decision}
      disabled={pending}
      className={`${CLASE_BASE} ${
        principal
          ? 'border-azul-texto bg-azul-texto text-hueso hover:bg-transparent hover:text-azul-texto'
          : 'border-tinta/55 text-tinta/70 hover:border-azul-texto hover:text-azul-texto'
      }`}
    >
      {pending ? 'Guardando…' : etiqueta}
    </button>
  );
}

/** «dd/mm/aaaa» a mano: parsear AAAA-MM-DD con `Date` lo corre un día según la zona. */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function FichaConvocatoria({
  convocatoria: c,
  nombreCategoria,
}: {
  convocatoria: Convocatoria;
  nombreCategoria: Record<string, string>;
}) {
  const [estado, accion] = useActionState(moderarConvocatoria, ESTADO_INICIAL);
  const etiqueta = ETIQUETA[c.estado];

  // Mismo criterio que FichaPeticion: cubre el instante entre la respuesta y el refresco.
  if (estado.estado === 'ok') {
    return (
      <article className="border-t border-tinta/12 py-6">
        <p role="status" className="font-sans text-xs text-azul-texto">
          {c.titulo} — {estado.mensaje}
        </p>
      </article>
    );
  }

  return (
    <article className="border-t border-tinta/12 py-8">
      <BadgeEstado etiqueta={etiqueta.texto} tono={etiqueta.tono} />

      <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-tinta">
        {c.titulo}
      </h3>
      <p className="mt-1 font-sans text-sm text-tinta/70">{c.entidad}</p>

      {c.resumen && (
        <p className="mt-4 max-w-prose whitespace-pre-wrap font-sans text-sm leading-relaxed text-tinta/80">
          {c.resumen}
        </p>
      )}

      <dl className="mt-4 flex flex-col gap-1.5">
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
            Cierra
          </dt>
          <dd className="font-cifra text-sm tabular-nums text-tinta/75">
            {c.fecha_cierre ? fechaCorta(c.fecha_cierre) : 'Sin fecha'}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
            Aplica a
          </dt>
          <dd className="font-sans text-sm text-tinta/75">
            {c.aplica_a.length === 0
              ? 'Todos los negocios'
              : c.aplica_a.map((id) => nombreCategoria[id] ?? id).join(' · ')}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
            Fuente
          </dt>
          <dd className="font-sans text-sm text-tinta/75">
            {c.fuente} ·{' '}
            <span className="font-cifra tabular-nums">detectada {fechaCorta(c.detectada_en)}</span>
          </dd>
        </div>
        {c.revisada_por && (
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
              Revisó
            </dt>
            <dd className="font-sans text-sm text-tinta/75">{c.revisada_por}</dd>
          </div>
        )}
      </dl>

      {/* El enlace es texto de un tercero (validado como http/https al entrar). */}
      <p className="mt-4">
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
        >
          Abrir la convocatoria (se abre en otra pestaña)
        </a>
      </p>

      {(c.estado === 'pendiente' || c.estado === 'aprobada') && (
        <form action={accion} className="mt-6">
          <input type="hidden" name="id" value={c.id} />
          {estado.estado === 'error' && (
            <p role="alert" className="mb-3 font-sans text-xs text-azul-texto">
              {estado.mensaje}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {c.estado === 'pendiente' && <Boton decision="aprobar" etiqueta="Aprobar" principal />}
            <Boton decision="descartar" etiqueta={c.estado === 'aprobada' ? 'Retirar' : 'Descartar'} />
            <Boton decision="vencida" etiqueta="Marcar vencida" />
          </div>
        </form>
      )}
    </article>
  );
}
