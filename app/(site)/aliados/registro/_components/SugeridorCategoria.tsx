'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  cargarModelo,
  sugerirCategoria,
  type ModeloCategoria,
  type Sugerencia,
} from '@/lib/ml/categoria';
import type { Categoria } from '@/lib/db/portafolios.repo';

/**
 * Sugerencia de categoría bajo «Nombre del negocio». Todo ocurre en el navegador
 * (`lib/ml/categoria.ts`): el nombre que escribes no sale de tu pantalla. Lo único
 * que viaja al enviar el formulario son dos campos ocultos con la categoría que
 * infirió el modelo y su confianza, nunca el texto; el servidor los guarda en
 * `sugerencias_categoria` junto con si la aceptaste.
 *
 * Si el modelo no carga (sin red, JSON roto) no se muestra nada: el formulario
 * funciona igual con el selector de categoría de abajo.
 */

const ESPERA_MS = 350;
const MINIMO_CARACTERES = 3;

const porcentaje = (p: number) => `${Math.round(p * 100)} %`;

export function SugeridorCategoria({
  nombre,
  categorias,
  categoriaId,
  alElegir,
}: {
  nombre: string;
  categorias: Categoria[];
  categoriaId: string;
  alElegir: (id: string) => void;
}) {
  const [modelo, setModelo] = useState<ModeloCategoria | null>(null);
  const [texto, setTexto] = useState('');

  // Sin esperar a que dejes de teclear, el modelo correría en cada letra.
  useEffect(() => {
    const t = setTimeout(() => setTexto(nombre.trim()), ESPERA_MS);
    return () => clearTimeout(t);
  }, [nombre]);

  // El modelo (~420 KB) se pide recién cuando hay algo que clasificar.
  const hayTexto = texto.length >= MINIMO_CARACTERES;
  useEffect(() => {
    if (!hayTexto || modelo) return;
    let vigente = true;
    cargarModelo()
      .then((m) => {
        if (vigente) setModelo(m);
      })
      .catch(() => {
        /* sin sugerencia: el selector de abajo sigue sirviendo */
      });
    return () => {
      vigente = false;
    };
  }, [hayTexto, modelo]);

  const resultado = useMemo(() => {
    if (!modelo || !hayTexto) return null;
    const r = sugerirCategoria(modelo, texto);
    if (r.tipo === 'nada') return null;

    // El modelo puede conocer una clase que el sitio desactivó: no se ofrece.
    const existe = (s: Sugerencia) => categorias.some((c) => c.id === s.id);
    if (r.tipo === 'una') return existe(r.sugerida) ? r : null;
    const opciones = r.opciones.filter(existe);
    // La primera es la que se registra como inferida: si no existe, no hay nada que decir.
    return opciones[0]?.id === r.opciones[0]?.id ? { ...r, opciones } : null;
  }, [modelo, texto, hayTexto, categorias]);

  const principal =
    resultado?.tipo === 'una' ? resultado.sugerida : resultado?.opciones[0] ?? null;

  return (
    <div>
      {/* Lo que viaja: la categoría inferida y su confianza. Ni rastro del nombre. */}
      {principal && (
        <>
          <input type="hidden" name="sugerencia_categoria" value={principal.id} />
          <input
            type="hidden"
            name="sugerencia_confianza"
            value={principal.probabilidad.toFixed(4)}
          />
        </>
      )}

      <div aria-live="polite" className="font-sans text-sm text-tinta/75">
        {resultado?.tipo === 'una' && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              Te sugerimos: <strong className="font-medium text-tinta">{resultado.sugerida.nombre}</strong>{' '}
              (<span className="font-sans tabular-nums">{porcentaje(resultado.sugerida.probabilidad)}</span>)
            </span>
            {categoriaId === resultado.sugerida.id ? (
              <span className="text-xs text-azul-texto">✓ Elegida abajo</span>
            ) : (
              <button
                type="button"
                onClick={() => alElegir(resultado.sugerida.id)}
                className="inline-flex min-h-11 items-center border border-azul-texto px-4 py-2 font-sans text-xs text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso"
              >
                Usar esta
              </button>
            )}
          </p>
        )}

        {resultado?.tipo === 'varias' && (
          <div>
            <p>No estamos seguros. ¿Tu negocio es alguno de estos?</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {resultado.opciones.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    aria-pressed={categoriaId === o.id}
                    onClick={() => alElegir(o.id)}
                    className={[
                      'inline-flex min-h-11 items-center gap-2 border px-4 py-2 font-sans text-xs transition-colors',
                      categoriaId === o.id
                        ? 'border-azul-texto bg-azul-texto text-hueso'
                        : 'border-tinta/55 text-tinta/75 hover:border-azul-texto hover:text-azul-texto',
                    ].join(' ')}
                  >
                    {o.nombre}
                    <span className="font-sans tabular-nums opacity-70">
                      {porcentaje(o.probabilidad)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
