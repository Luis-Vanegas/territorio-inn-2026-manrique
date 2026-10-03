import { BarrasCategoria } from '@/components/firmamento/BarrasCategoria';
import { grupoDeCategoria } from '@/lib/categorias/grupos';
import type { DatosAbiertos } from '@/lib/db/datos.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { CELDA_PEQUENA } from '@/lib/privacidad/kAnonimato';

/**
 * Cómo se reparte la red por categoría. Sale de `por_categoria` de los datos
 * abiertos, ya con la regla k = 5 y la celda complementaria: lo que se ve acá es
 * lo mismo que publica `/api/datos`.
 *
 * Las barras son `BarrasCategoria`: cada fila lleva la FORMA de su grupo
 * (DESIGN.md › Categorías) y la barra de una celda «<5» queda vacía a propósito,
 * porque dibujarla con un largo revelaría el número que se escondió.
 */
export function ComposicionRed({ datos }: { datos: DatosAbiertos | null }) {
  const fuente = 'Constelaciones · Manrique, aliados aprobados por moderación (datos abiertos, regla k = 5)';

  if (!datos) {
    return (
      <div className="border border-tinta/12 bg-hueso p-5">
        <h2 className="font-sans text-lg font-medium text-tinta">Composición de la red</h2>
        <p role="status" className="mt-3 font-sans text-base leading-relaxed text-tinta/70">
          No pudimos consultar la red en este momento. Vuelve a intentarlo en unos minutos.
        </p>
      </div>
    );
  }

  const filas = datos.por_categoria;
  const ocultas = filas.filter((f) => f.negocios === CELDA_PEQUENA).length;

  return (
    <div className="border border-tinta/12 bg-hueso p-5">
      <h2 className="font-sans text-lg font-medium text-tinta">Composición de la red</h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">
        {filas.length} categorías activas
        {ocultas > 0 ? `; ${ocultas} salen como «${CELDA_PEQUENA}»` : ''}. Una celda con menos de 5 negocios
        no muestra su número, para que nadie pueda reconocer a una persona (Ley 1581 de 2012).
      </p>

      <BarrasCategoria
        className="mt-4"
        columna="Negocios"
        descripcion="Negocios de la red por categoría. Las categorías con menos de 5 negocios no publican su número"
        filas={filas.map((f) => ({
          id: f.id,
          nombre: f.nombre,
          valor: f.negocios,
          grupo: grupoDeCategoria(f.id),
        }))}
      />

      <p className="mt-4 font-sans text-xs leading-relaxed text-tinta/70 tabular-nums">
        Fuente: {fuente} · consultado el {fechaLarga(datos.generado_en)}
      </p>
    </div>
  );
}
