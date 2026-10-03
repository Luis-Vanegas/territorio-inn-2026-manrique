import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { formatearNumero } from '@/lib/formato';
import type { EvaluacionModelo } from '@/lib/firmamento/evaluacionModelo';
import { BarrasCategoria } from './BarrasCategoria';
import { MatrizConfusion } from './MatrizConfusion';

/**
 * Las dos piezas de la evaluación del sugeridor de categoría, para `/firmamento`
 * y el panel del equipo (`equipo/modelos`): F1 por categoría y matriz de
 * confusión. Cada una trae su explicación y su línea de fuente y fecha; el marco
 * (tarjeta o panel) lo pone quien la usa. Las cifras son las del holdout agrupado
 * por nombre (F1 macro del reporte), nunca las del split ingenuo.
 */

function Fuente({ evaluacion }: { evaluacion: EvaluacionModelo }) {
  return (
    <p className="mt-4 break-words font-cifra text-xs leading-relaxed text-tenue">
      Fuente: validación con {formatearNumero(evaluacion.n_holdout)} comercios apartados, OpenStreetMap, ©
      colaboradores (ODbL) · modelo entrenado el {fechaLarga(evaluacion.fecha_corrida)}
    </p>
  );
}

export function F1PorCategoria({ evaluacion }: { evaluacion: EvaluacionModelo }) {
  const filas = [...evaluacion.clases]
    .sort((a, b) => b.f1 - a.f1)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      valor: c.f1,
      grupo: grupoDeCategoria(c.id),
      nota: `${c.soporte} locales`,
    }));
  const pocos = evaluacion.clases.filter((c) => c.soporte < 10);

  return (
    <div>
      <p className="font-sans text-base leading-relaxed text-estrella">
        El F1 de una categoría mezcla dos preguntas: cuando el modelo la sugiere, ¿acierta?, y de los
        locales que sí son de esa categoría, ¿cuántos encuentra? Va de 0 a 1; más largo es mejor.
      </p>
      <BarrasCategoria
        className="mt-4"
        encabezado="Categoría"
        columna="F1"
        decimales={3}
        maximo={1}
        referencia={{
          valor: evaluacion.f1_macro,
          etiqueta: `Línea: F1 macro de las ${evaluacion.clases.length} categorías, ${formatearNumero(evaluacion.f1_macro, 3)}`,
        }}
        descripcion={`F1 por categoría en el holdout de ${evaluacion.n_holdout} locales, de la más alta a la más baja, con cuántos locales tiene cada una`}
        filas={filas}
      />
      {pocos.length > 0 && (
        <p className="mt-4 font-sans text-sm leading-relaxed text-tenue">
          Con tan pocos locales ({pocos.map((c) => `${c.nombre}: ${c.soporte}`).join('; ')}) el F1 casi no
          dice nada: un acierto más o menos lo mueve mucho.
        </p>
      )}
      <Fuente evaluacion={evaluacion} />
    </div>
  );
}

export function ConfusionDelModelo({ evaluacion }: { evaluacion: EvaluacionModelo }) {
  return (
    <div>
      <MatrizConfusion
        clases={evaluacion.clases}
        matriz={evaluacion.matriz}
        descripcion={`Matriz de confusión del sugeridor en ${evaluacion.n_holdout} locales: cada fila es la categoría real y cada columna la que sugirió el modelo`}
      />
      <Fuente evaluacion={evaluacion} />
    </div>
  );
}
