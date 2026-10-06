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
  'inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-1.5 font-sans text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul-texto disabled:cursor-not-allowed disabled:opacity-40';
const CLASE_PRIMARIO = `${CLASE_BOTON} bg-azul-texto text-hueso hover:bg-azul-texto/90`;
const CLASE_SECUNDARIO = `${CLASE_BOTON} border border-tinta/25 text-tinta/80 hover:bg-tinta/5 hover:border-tinta/50`;

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
    return <p className="mt-3 font-sans text-xs text-tinta/65">Consultando el sugeridor…</p>;
  }
  if (!opciones) {
    return (
      <p className="mt-3 font-sans text-xs text-tinta/65">
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
    <section
      aria-label="Sugeridor de categoría"
      className="mt-4 rounded-xl border border-azul/20 bg-azul/[0.04] p-4 text-tinta"
    >
      <div className="grid grid-cols-1 gap-3 border-b border-tinta/10 pb-3 sm:grid-cols-2">
        <div>
          <span className="block font-sans text-[11px] font-medium uppercase tracking-wider text-tinta/60">
            Categoría declarada
          </span>
          <p className="mt-1 font-sans text-sm font-semibold text-tinta">
            {actual.nombre}
          </p>
        </div>
        <div>
          <span className="block font-sans text-[11px] font-medium uppercase tracking-wider text-azul-texto">
            {segura ? 'Sugerencia del modelo' : 'Alternativas sugeridas'}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {opciones.map((o) => (
              <span key={o.id} className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-tinta">
                {o.nombre}
                <span className="rounded-full bg-azul/15 px-2 py-0.5 font-sans text-xs font-semibold tabular-nums text-azul-texto">
                  {porcentaje(o.probabilidad)}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {correcta ? (
            <span className="inline-flex min-h-[44px] items-center gap-1 font-sans text-sm font-medium text-azul-texto">
              Correcta ✓
            </span>
          ) : revisada ? (
            <span className="font-sans text-xs text-tinta/65">
              El equipo ya decidió sobre esta categoría.
            </span>
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
              <button
                type="button"
                disabled={enviando}
                onClick={() => decidir('mantener')}
                className={CLASE_SECUNDARIO}
              >
                Mantener
                <span className="sr-only"> «{actual.nombre}»</span>
              </button>
            </>
          )}
        </div>

        {!revisada && !correcta && (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (elegida) decidir('corregir', elegida);
            }}
          >
            <div className="flex items-center gap-1.5">
              <label htmlFor={idSelector} className="sr-only">
                Corregir a mano
              </label>
              <select
                id={idSelector}
                value={elegida}
                // Guardar en el onChange escribía en la base con cada flecha del teclado: decide el botón.
                onChange={(e) => setElegida(e.target.value)}
                className="min-h-[44px] rounded-lg border border-tinta/25 bg-hueso px-3 py-1 font-sans text-xs text-tinta transition-colors hover:border-tinta/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul-texto"
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
        )}
      </div>

      {estado.estado !== 'inicial' && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-2 font-sans text-xs ${estado.estado === 'error' ? 'text-tinta font-medium' : 'text-azul-texto'}`}
        >
          {enviando ? 'Guardando…' : estado.mensaje}
        </p>
      )}
    </section>
  );
}
