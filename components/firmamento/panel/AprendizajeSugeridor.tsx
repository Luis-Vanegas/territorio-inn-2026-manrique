import type { AprendizajeSugeridor as Aprendizaje } from '@/lib/db/equipo.repo';

/**
 * Lo que el sugeridor va aprendiendo, en dos grupos de cifras: lo que pasa al
 * registrarse y lo que decide el equipo en la moderación (`sugerencias_categoria`,
 * origen `moderacion`: usó la propuesta, la corrigió o mantuvo la que tenía).
 * Solo conteos: la tabla no guarda el texto escrito. Lo usan el Resumen y Modelos.
 * Lee `hueso`/`tinta`: sirve de día y dentro de una ventana de noche.
 */
const numero = (n: number) => n.toLocaleString('es-CO');

function Grupo({ titulo, filas }: { titulo: string; filas: [string, number][] }) {
  return (
    <div className="min-w-0">
      <h3 className="font-sans text-sm font-medium text-tinta">{titulo}</h3>
      <dl className="mt-2 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
        {filas.map(([t, n]) => (
          <div key={t} className="min-w-0">
            <dd className="font-cifra text-2xl leading-none tabular-nums text-tinta">{numero(n)}</dd>
            <dt className="mt-1.5 font-sans text-sm leading-snug text-tinta/70 [.modo-noche_&]:text-tenue">{t}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function AprendizajeSugeridor({ datos }: { datos: Aprendizaje }) {
  if (datos.total === 0) {
    return (
      <p className="font-sans text-sm leading-relaxed text-tinta/70 [.modo-noche_&]:text-tenue">
        Todavía no hay sugerencias. Cada registro, y cada decisión del equipo en
        la moderación, queda aquí como ejemplo para reentrenar.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <Grupo
        titulo="Al registrarse"
        filas={[
          ['Sugerencias', datos.total],
          ['Aceptadas', datos.aceptadas],
          ['Cambiadas', datos.corregidas],
        ]}
      />
      <Grupo
        titulo="Decisiones del equipo en moderación"
        filas={[
          ['Usó la propuesta', datos.usadasEquipo],
          ['La corrigió', datos.corregidasEquipo],
          ['Mantuvo la categoría', datos.mantenidas],
        ]}
      />
    </div>
  );
}
