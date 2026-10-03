'use client';

import { useActionState, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

import {
  moderarConvocatoria,
  type EstadoModeracionConvocatoria,
} from '@/lib/actions/moderarConvocatoria';
import type { Convocatoria } from '@/lib/db/convocatorias.repo';
import type { CeldaAlcance } from '@/lib/db/equipo.repo';
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

// Los valores de aliados_investigacion.formalidad, en tercera persona: las
// etiquetas del registro («No tengo») hablan como el negocio. Sin
// «prefiero_no_decir»: no es un perfil al que se le apunte una convocatoria
// (convocatoriasParaTi lo trata como formalidad desconocida).
const FORMALIDAD: Record<string, string> = {
  rut_camara: 'Con RUT o Cámara de Comercio',
  en_tramite: 'En trámite',
  no_tengo: 'Sin formalizar',
};

const ORIGEN: Record<Convocatoria['origen'], string> = {
  vigia: 'Vigía (automático)',
  entidad: 'Propuesta por la entidad',
  equipo: 'Equipo',
};

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
        {etiqueta}
      </dt>
      <dd className="font-sans text-sm text-tinta/75">{children}</dd>
    </div>
  );
}

/**
 * A cuántos aliados publicados llegaría con estas categorías y formalidades.
 * Misma regla que `convocatoriasParaTi`: sin categorías = todas, sin
 * formalidades = cualquiera, y un negocio sin formalidad conocida (null o
 * «prefiero no decir») cuenta igual, porque «Para ti» también se la muestra.
 */
function alcance(matriz: readonly CeldaAlcance[], categorias: readonly string[], formalidades: readonly string[]) {
  return matriz
    .filter(
      (x) =>
        (categorias.length === 0 || categorias.includes(x.categoria_id)) &&
        (formalidades.length === 0 ||
          x.formalidad === null ||
          x.formalidad === 'prefiero_no_decir' ||
          formalidades.includes(x.formalidad)),
    )
    .reduce((t, x) => t + x.n, 0);
}

function alternar(lista: readonly string[], valor: string, marcado: boolean): string[] {
  return marcado ? [...lista, valor] : lista.filter((v) => v !== valor);
}

export function FichaConvocatoria({
  convocatoria: c,
  categorias,
  matriz,
}: {
  convocatoria: Convocatoria;
  categorias: { id: string; nombre: string }[];
  /** Aliados publicados por categoría × formalidad; null si no se pudo leer. */
  matriz: readonly CeldaAlcance[] | null;
}) {
  const [estado, accion] = useActionState(moderarConvocatoria, ESTADO_INICIAL);
  // Lo marcado arranca en lo que ya trae (una entidad pudo proponer a quién aplica).
  const [marcadas, setMarcadas] = useState<string[]>(c.categorias);
  const [formalidades, setFormalidades] = useState<string[]>(c.aplica_formalidad);
  const llegaria = matriz ? alcance(matriz, marcadas, formalidades) : null;
  const etiqueta = ETIQUETA[c.estado];
  const nombreCategoria = Object.fromEntries(categorias.map((x) => [x.id, x.nombre]));

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
      <div className="flex flex-wrap items-center gap-2">
        <BadgeEstado etiqueta={etiqueta.texto} tono={etiqueta.tono} />
        {c.origen === 'entidad' && (
          <span className="inline-block border border-azul px-2 py-0.5 font-sans text-xs text-azul-texto">
            Propuesta por la entidad
          </span>
        )}
      </div>

      <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-tinta">
        {c.titulo}
      </h3>
      <p className="mt-1 font-sans text-sm text-tinta/70">
        {c.entidad}
        {c.tema && <> · {c.tema}</>}
      </p>

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
          <dd className="font-sans text-sm tabular-nums text-tinta/75">
            {c.fecha_cierre ? fechaCorta(c.fecha_cierre) : 'Sin fecha'}
          </dd>
        </div>
        {c.estado !== 'pendiente' && (
          <>
            <Fila etiqueta="Categorías">
              {c.categorias.length === 0
                ? 'Todas'
                : c.categorias.map((id) => nombreCategoria[id] ?? 'categoría retirada').join(' · ')}
            </Fila>
            <Fila etiqueta="Formalidad">
              {c.aplica_formalidad.length === 0
                ? 'Cualquiera'
                : c.aplica_formalidad.map((f) => FORMALIDAD[f] ?? f).join(' · ')}
            </Fila>
          </>
        )}
        <Fila etiqueta="Origen">{ORIGEN[c.origen]}</Fila>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
            Fuente
          </dt>
          <dd className="font-sans text-sm text-tinta/75">
            {c.fuente} ·{' '}
            <span className="tabular-nums">detectada {fechaCorta(c.detectada_en)}</span>
          </dd>
        </div>
        {c.revisada_por && <Fila etiqueta="Revisó">{c.revisada_por}</Fila>}
      </dl>

      {llegaria !== null && c.estado !== 'descartada' && c.estado !== 'vencida' && (
        <p aria-live="polite" className="mt-4 font-sans text-sm text-tinta/80">
          {c.estado === 'pendiente' ? 'Al aprobarla con lo marcado llegaría a ' : 'Llega a '}
          <span className="font-sans text-azul-texto tabular-nums">{llegaria}</span>{' '}
          {llegaria === 1 ? 'aliado' : 'aliados'} con cuenta, que la verían en «Para ti».
        </p>
      )}

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
          {/* A quién aplica se decide al aprobar. Sin marcar nada = para todos:
              el moderador lo ve escrito en la leyenda, no lo adivina. */}
          {c.estado === 'pendiente' && (
            <div className="mb-6 flex flex-col gap-5">
              <fieldset>
                <legend className="font-sans text-xs uppercase tracking-wider text-tinta/65">
                  Categorías a las que aplica (sin marcar = todas)
                </legend>
                <div className="mt-2 grid gap-x-5 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                  {categorias.map((cat) => (
                    <label key={cat.id} className="flex min-h-11 items-center gap-2 font-sans text-sm text-tinta/80">
                      <input
                        type="checkbox"
                        name="categorias"
                        value={cat.id}
                        checked={marcadas.includes(cat.id)}
                        onChange={(e) => setMarcadas((l) => alternar(l, cat.id, e.target.checked))}
                        className="h-4 w-4 accent-azul"
                      />
                      {cat.nombre}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-sans text-xs uppercase tracking-wider text-tinta/65">
                  Formalidad a la que aplica (sin marcar = cualquiera)
                </legend>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {Object.entries(FORMALIDAD).map(([f, texto]) => (
                    <label key={f} className="flex min-h-11 items-center gap-2 font-sans text-sm text-tinta/80">
                      <input
                        type="checkbox"
                        name="formalidades"
                        value={f}
                        checked={formalidades.includes(f)}
                        onChange={(e) => setFormalidades((l) => alternar(l, f, e.target.checked))}
                        className="h-4 w-4 accent-azul"
                      />
                      {texto}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
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
