'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { BarrasCategoria } from '@/components/firmamento/BarrasCategoria';
import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { cargarModelo, sugerirCategoria, type ModeloCategoria, type Sugerencia } from '@/lib/ml/categoria';

/**
 * «Pruébalo»: el mismo sugeridor del registro y de la moderación, corriendo en el
 * navegador del equipo (`lib/ml/categoria.ts`). No hay formulario que se envíe ni
 * action: lo que se escribe aquí no sale de la pantalla. El texto que clasifica es
 * `nombre + ' ' + descripción`, igual que en la moderación.
 */

const ESPERA_MS = 350;
const MINIMO_CARACTERES = 3;

const porcentaje = (p: number) => `${Math.round(p * 100)} %`;

const CLASE_CAMPO =
  'block min-h-[44px] w-full min-w-0 rounded-lg border border-tinta/55 bg-tinta/[0.03] px-3 py-2 font-sans text-base text-tinta placeholder:text-tinta/65';

export function PruebaSugeridor() {
  const id = useId();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [texto, setTexto] = useState('');
  const [modelo, setModelo] = useState<ModeloCategoria | null>(null);
  const [fallo, setFallo] = useState(false);

  // Sin esperar a que dejes de teclear, el modelo correría en cada letra.
  useEffect(() => {
    const t = setTimeout(() => setTexto(`${nombre} ${descripcion}`.trim()), ESPERA_MS);
    return () => clearTimeout(t);
  }, [nombre, descripcion]);

  // El modelo (~420 KB) se pide recién cuando hay algo que clasificar.
  const hayTexto = texto.length >= MINIMO_CARACTERES;
  useEffect(() => {
    if (!hayTexto || modelo) return;
    let vigente = true;
    cargarModelo()
      .then((m) => {
        if (vigente) {
          setModelo(m);
          setFallo(false);
        }
      })
      .catch(() => {
        if (vigente) setFallo(true);
      });
    return () => {
      vigente = false;
    };
  }, [hayTexto, modelo]);

  const resultado = useMemo(() => (modelo && hayTexto ? sugerirCategoria(modelo, texto) : null), [modelo, texto, hayTexto]);

  const opciones: Sugerencia[] =
    resultado?.tipo === 'una' ? [resultado.sugerida, ...resultado.alternativas] : resultado?.tipo === 'varias' ? resultado.opciones : [];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-nombre`} className="block font-sans text-sm font-medium text-tinta">
            Nombre del negocio
          </label>
          <input
            id={`${id}-nombre`}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={120}
            autoComplete="off"
            placeholder="Ej.: Panadería La Espiga"
            className={`mt-1 ${CLASE_CAMPO}`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-descripcion`} className="block font-sans text-sm font-medium text-tinta">
            Descripción <span className="font-normal text-tinta/70">(opcional)</span>
          </label>
          <textarea
            id={`${id}-descripcion`}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Ej.: pan, tortas y café para llevar"
            className={`mt-1 ${CLASE_CAMPO}`}
          />
        </div>
      </div>

      <div aria-live="polite" className="mt-5 font-sans text-sm text-tinta/70">
        {!hayTexto ? (
          <p>Escribe al menos {MINIMO_CARACTERES} letras para ver qué propone.</p>
        ) : fallo ? (
          <p role="alert" className="text-morado-texto">
            No se pudo cargar el modelo. Revisa la conexión y vuelve a escribir.
          </p>
        ) : !modelo ? (
          <p>Cargando el modelo…</p>
        ) : resultado?.tipo === 'nada' || opciones.length === 0 ? (
          <p>El modelo no reconoce ninguna palabra de ese texto: no propone nada.</p>
        ) : (
          <>
            <p className="text-tinta">
              {resultado?.tipo === 'una' ? (
                <>
                  Propone <strong className="font-medium">{resultado.sugerida.nombre}</strong> (
                  <span className="tabular-nums">{porcentaje(resultado.sugerida.probabilidad)}</span>): en el registro
                  saldría como una sola sugerencia con «Usar esta».
                </>
              ) : (
                <>
                  No está seguro (menos de {porcentaje(modelo.umbral_confianza)}): en el registro mostraría estas tres
                  para elegir.
                </>
              )}
            </p>
            <BarrasCategoria
              className="mt-4 max-w-xl"
              filas={opciones.map((o) => ({
                id: o.id,
                nombre: o.nombre,
                valor: Math.round(o.probabilidad * 100),
                grupo: grupoDeCategoria(o.id),
              }))}
              maximo={100}
              columna="Probabilidad (%)"
              descripcion="Las tres categorías más probables para el texto escrito"
            />
          </>
        )}
      </div>
    </div>
  );
}
