'use client';

import { startTransition, useActionState, useEffect, useId, useMemo, useState } from 'react';

import { decidirCategoria, type EstadoDecisionCategoria } from '@/lib/actions/decidirCategoria';
import { cargarModelo, sugerirCategoria, type ResultadoSugerencia, type Sugerencia } from '@/lib/ml/categoria';

/**
 * El sugeridor en la moderación (registro pendiente y alerta de «Otros»). El
 * modelo corre en el navegador del equipo, el mismo de `lib/ml/categoria.ts` que
 * usa el registro: el texto de la ficha no sale a ningún servidor. Lo único que
 * viaja al decidir son ids y la confianza (`decidirCategoria`).
 *
 * Un clic: «Usar «X»» cambia la categoría, «Mantener» deja la actual; si la
 * propuesta ya es la actual, solo «Correcta ✓». El selector corrige a mano. Con
 * `revisada` (ya hay una decisión del equipo) se esconden los dos botones: otro
 * clic no sería otro ejemplo para reentrenar.
 */

type CategoriaBasica = { id: string; nombre: string };

const ESTADO_INICIAL: EstadoDecisionCategoria = { estado: 'inicial' };

const porcentaje = (p: number) => `${Math.round(p * 100)} %`;

const CLASE_BOTON =
  'inline-flex min-h-[44px] items-center gap-2 border px-4 py-2 font-sans text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul-texto disabled:cursor-not-allowed disabled:opacity-40';
const CLASE_PRIMARIO = `${CLASE_BOTON} border-azul-texto bg-azul-texto text-hueso hover:bg-transparent hover:text-azul-texto`;
const CLASE_SECUNDARIO = `${CLASE_BOTON} border-tinta/55 text-tinta/75 hover:border-azul-texto hover:text-azul-texto`;

export function SugeridorModeracion({
  portafolioId,
  texto,
  actual,
  categorias,
  revisada,
}: {
  portafolioId: string;
  /** Nombre + descripción + texto de «Otros»: lo que el modelo lee. */
  texto: string;
  actual: CategoriaBasica;
  categorias: readonly CategoriaBasica[];
  revisada: boolean;
}) {
  const [crudo, setCrudo] = useState<ResultadoSugerencia | 'error' | null>(null);
  const [estado, despachar, enviando] = useActionState(decidirCategoria, ESTADO_INICIAL);
  const [elegida, setElegida] = useState('');
  const idSelector = useId();

  useEffect(() => {
    let vivo = true;
    cargarModelo()
      .then((m) => vivo && setCrudo(sugerirCategoria(m, texto)))
      .catch(() => vivo && setCrudo('error'));
    return () => {
      vivo = false;
    };
  }, [texto]);

  // Mismo criterio que el registro: una clase que el sitio desactivó no se
  // ofrece, y si la primera no existe no hay nada que registrar como inferida.
  const opciones = useMemo<Sugerencia[] | null>(() => {
    if (crudo === null || crudo === 'error' || crudo.tipo === 'nada') return null;
    const existe = (s: Sugerencia) => categorias.some((c) => c.id === s.id);
    const lista = (crudo.tipo === 'una' ? [crudo.sugerida] : crudo.opciones).filter(existe);
    const primera = crudo.tipo === 'una' ? crudo.sugerida : crudo.opciones[0];
    return lista[0] && lista[0].id === primera?.id ? lista : null;
  }, [crudo, categorias]);

  if (crudo === null) {
    return <p className="mt-4 font-sans text-sm text-tinta/65">Consultando el sugeridor…</p>;
  }
  if (!opciones) {
    return (
      <p className="mt-4 font-sans text-sm text-tinta/65">
        El sugeridor no tiene texto suficiente para proponer una categoría.
      </p>
    );
  }

  const principal = opciones[0]!;
  const segura = crudo !== 'error' && crudo.tipo === 'una';
  const correcta = segura && principal.id === actual.id;

  const decidir = (decision: 'usar' | 'mantener' | 'corregir', categoriaElegida?: string) =>
    startTransition(() =>
      despachar({
        portafolio_id: portafolioId,
        decision,
        categoria_actual: actual.id,
        categoria_elegida: categoriaElegida,
        categoria_inferida: principal.id,
        confianza: principal.probabilidad,
      }),
    );

  const proponibles = opciones.filter((o) => o.id !== actual.id);

  return (
    <section aria-label="Sugeridor de categoría" className="mt-5 max-w-2xl border-l-2 border-azul-texto/40 pl-4">
      <p className="font-sans text-xs uppercase tracking-wide text-tinta/60">Sugeridor de categoría</p>
      <p className="mt-1 font-sans text-sm text-tinta/80">
        Ahora: <strong className="font-medium text-tinta">{actual.nombre}</strong>.{' '}
        {segura ? 'Propone ' : 'Duda entre '}
        {opciones.map((o, i) => (
          <span key={o.id}>
            {i > 0 && (i === opciones.length - 1 ? ' y ' : ', ')}
            <strong className="font-medium text-tinta">{o.nombre}</strong>{' '}
            <span className="font-cifra text-xs text-tinta/65">{porcentaje(o.probabilidad)}</span>
          </span>
        ))}
        .
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {correcta ? (
          <span className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto">Correcta ✓</span>
        ) : revisada ? (
          <span className="font-sans text-sm text-tinta/65">El equipo ya decidió sobre esta categoría.</span>
        ) : (
          <>
            {proponibles.map((o, i) => (
              <button
                key={o.id}
                type="button"
                disabled={enviando}
                onClick={() => decidir('usar', o.id)}
                className={i === 0 ? CLASE_PRIMARIO : CLASE_SECUNDARIO}
              >
                Usar «{o.nombre}»
              </button>
            ))}
            <button type="button" disabled={enviando} onClick={() => decidir('mantener')} className={CLASE_SECUNDARIO}>
              Mantener
              <span className="sr-only"> «{actual.nombre}»</span>
            </button>
          </>
        )}
      </div>

      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (elegida) decidir('corregir', elegida);
        }}
      >
        <div className="flex flex-col">
          <label htmlFor={idSelector} className="font-sans text-xs text-tinta/65">
            Corregir a mano
          </label>
          <select
            id={idSelector}
            value={elegida}
            onChange={(e) => setElegida(e.target.value)}
            className="mt-1 min-h-[44px] border border-tinta/55 bg-transparent px-3 font-sans text-sm text-tinta focus:border-azul-texto focus:outline-none"
          >
            <option value="">Otra categoría…</option>
            {categorias
              .filter((c) => c.id !== actual.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
          </select>
        </div>
        <button type="submit" disabled={enviando || !elegida} className={CLASE_SECUNDARIO}>
          Cambiar
        </button>
      </form>

      <p
        role="status"
        aria-live="polite"
        className={`mt-2 font-sans text-sm ${estado.estado === 'error' ? 'text-tinta' : 'text-azul-texto'}`}
      >
        {enviando ? 'Guardando…' : estado.estado === 'inicial' ? '' : estado.mensaje}
      </p>
    </section>
  );
}
