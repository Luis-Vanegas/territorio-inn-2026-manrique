'use client';

import { useEffect, useState } from 'react';

import { cargarModelo, sugerirCategoria, type ResultadoSugerencia } from '@/lib/ml/categoria';

/**
 * Propuesta de categoría para una ficha en «Otros». El modelo corre en el
 * navegador del equipo (el mismo de `lib/ml/categoria.ts` que usa el registro):
 * ningún texto sale a un servidor. Solo propone; corregir es editar la ficha.
 */
const porcentaje = (p: number) => `${Math.round(p * 100)} %`;

export function SugerenciaOtros({ texto }: { texto: string }) {
  const [resultado, setResultado] = useState<ResultadoSugerencia | 'error' | null>(null);

  useEffect(() => {
    let vivo = true;
    cargarModelo()
      .then((m) => vivo && setResultado(sugerirCategoria(m, texto)))
      .catch(() => vivo && setResultado('error'));
    return () => {
      vivo = false;
    };
  }, [texto]);

  if (resultado === null) {
    return <p className="mt-1 font-sans text-sm text-tenue">Consultando el sugeridor…</p>;
  }
  if (resultado === 'error' || resultado.tipo === 'nada') {
    return <p className="mt-1 font-sans text-sm text-tenue">El sugeridor no pudo proponer nada.</p>;
  }

  const opciones = resultado.tipo === 'una' ? [resultado.sugerida] : resultado.opciones;
  return (
    <p className="mt-1 font-sans text-sm text-tenue">
      {resultado.tipo === 'una' ? 'El sugeridor propone ' : 'El sugeridor duda entre '}
      {opciones.map((o, i) => (
        <span key={o.id}>
          {i > 0 && (i === opciones.length - 1 ? ' y ' : ', ')}
          <span className="font-medium text-sodio">{o.nombre}</span>{' '}
          <span className="font-cifra text-xs">{porcentaje(o.probabilidad)}</span>
        </span>
      ))}
      .
    </p>
  );
}
