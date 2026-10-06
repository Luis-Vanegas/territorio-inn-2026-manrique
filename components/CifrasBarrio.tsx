// «El barrio en cifras» (portada). Server Component: recibe lo que ya leyó
// `leerFirmamento` (OSM del JSON del repo + aliados SOLO por datos abiertos,
// regla k = 5). Ninguna cifra se escribe a mano; cada grupo lleva una línea de
// fuente (DESIGN.md › Reglas de cifras).

import type { DatosFirmamento } from '@/app/(site)/firmamento/datos';
import { BarrasCategoria } from '@/components/firmamento/BarrasCategoria';
import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { GRUPOS, type IdGrupo } from '@/lib/categorias/grupos';
import { CAMARA_EMPRESAS } from '@/lib/cifras';
import { formatearNumero as fmt } from '@/lib/formato';
import { fechaLarga } from '@/lib/geo/constelaciones';

const FUENTE_OSM = 'OpenStreetMap, © colaboradores (ODbL)';

// Sin fuente por bloque: los tres salen del mismo JSON de OSM, así que llevan UNA
// línea debajo de los tres (DESIGN.md › Reglas de cifras; Luis, 6-oct-2026:
// «OpenStreetMap» se repetía cinco veces en el inicio).
function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="font-sans text-lg font-medium text-tinta">{titulo}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function CifrasBarrio({ d }: { d: DatosFirmamento }) {
  const { osm } = d;
  const red = d.red.datos;
  const fechaOsm = `datos al ${fechaLarga(osm.osmBase)}`;
  const fechaRed = red ? `consultado el ${fechaLarga(red.generado_en)}` : 'sin consulta en este momento';

  // Los comercios de OSM por grupo (los mismos colores del mapa), con su porcentaje.
  const porGrupo = Object.fromEntries(GRUPOS.map((g) => [g.id, 0])) as Record<IdGrupo, number>;
  for (const b of d.barras) porGrupo[b.grupo.id] += b.n;
  const filasGrupo = GRUPOS.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    valor: porGrupo[g.id],
    color: g.color,
    nota: `${fmt((porGrupo[g.id] / osm.totalComercios) * 100, 0)} %`,
  })).sort((a, b) => b.valor - a.valor);

  const principales = d.filas.slice().sort((a, b) => b.tamano - a.tamano).slice(0, 5);

  return (
    <section aria-labelledby="titulo-cifras" className="seccion border-t border-tinta/12">
      <h2 id="titulo-cifras" className="font-display text-4xl font-medium leading-tight text-tinta sm:text-5xl">
        El barrio en cifras
      </h2>

      <GrupoCifras
        className="mt-8"
        fuente={`${FUENTE_OSM} y agrupación HDBSCAN · ${fechaOsm}. Aliados: datos abiertos de Constelaciones (k = 5) · ${fechaRed}`}
      >
        <Kpi
          valor={red ? String(red.negocios_aprobados) : '—'}
          numero={typeof red?.negocios_aprobados === 'number' ? red.negocios_aprobados : undefined}
          etiqueta="aliados de Constelaciones"
          aclaracion={red ? undefined : 'No pudimos consultar este dato ahora.'}
        />
        <Kpi valor={fmt(osm.totalComercios)} numero={osm.totalComercios} etiqueta="comercios mapeados" />
        <Kpi valor={fmt(osm.constelaciones)} numero={osm.constelaciones} etiqueta="constelaciones" />
        <Kpi
          valor={CAMARA_EMPRESAS.valor}
          numero={CAMARA_EMPRESAS.numero}
          etiqueta={CAMARA_EMPRESAS.etiqueta}
          fuente={CAMARA_EMPRESAS.fuente}
          fecha={CAMARA_EMPRESAS.fecha}
        />
      </GrupoCifras>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <Bloque titulo="Comercios por categoría">
          <BarrasCategoria
            filas={filasGrupo}
            columna="Comercios"
            descripcion="Comercios mapeados en la Comuna 3 por grupo de categoría, con su porcentaje"
          />
        </Bloque>

        <Bloque titulo="Comercios por barrio">
          <BarrasCategoria
            filas={[...d.barrios].sort((a, b) => b.valor - a.valor).map((b) => ({
              id: b.barrio,
              nombre: b.barrio,
              valor: b.valor,
            }))}
            encabezado="Barrio"
            columna="Comercios"
            descripcion="Comercios mapeados por barrio oficial de la Comuna 3"
          />
        </Bloque>

        <Bloque titulo={`Las ${osm.constelaciones} constelaciones`}>
          <p className="font-sans text-sm leading-relaxed text-tinta/75">
            {fmt((1 - osm.sueltos / osm.totalComercios) * 100, 0)} % de los comercios está en una constelación.
            Las más grandes:
          </p>
          <ol className="mt-3 divide-y divide-tinta/10 border-y border-tinta/10">
            {principales.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-3 py-2 font-sans text-sm text-tinta">
                <span className="min-w-0 break-words">
                  <span className="font-medium">{c.codigo}</span> · {c.nombre}
                </span>
                <span className="shrink-0 tabular-nums text-tinta/70">{c.tamano}</span>
              </li>
            ))}
          </ol>
        </Bloque>
      </div>
      <p className="mt-6 break-words font-sans text-xs leading-relaxed text-tinta/70">
        Fuente de los tres: {FUENTE_OSM}, agrupación HDBSCAN · {fechaOsm}
      </p>
    </section>
  );
}
