import { listarServiciosPendientes } from '@/lib/db/servicios.repo';
import {
  resumenCaracterizacion,
  dificultadesFrecuentes,
  fotosPorId,
} from '@/lib/db/serviciosPrivado.repo';
import { FichaServicio } from './_components/FichaServicio';

export const dynamic = 'force-dynamic';

export default async function AdminServiciosPage() {
  const [pendientes, resumen, dificultades] = await Promise.all([
    listarServiciosPendientes(),
    resumenCaracterizacion(),
    dificultadesFrecuentes(),
  ]);

  // La foto es un dato reservado (ver lib/db/serviciosPrivado.repo.ts): el
  // listado público de pendientes no la trae, así que se busca aparte y se
  // relaciona acá por id. Es la única pantalla donde un humano la ve —
  // durante la revisión, para poder identificar a la persona si más adelante
  // hace falta.
  const fotos = await fotosPorId(pendientes.map((s) => s.id));

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">
        Servicios
      </h1>

      <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-tinta/60">
        Personas que ofrecen su oficio a domicilio. Acá la moderación pesa más
        que en Aliados: se está por publicar a alguien que va a entrar a casas
        ajenas. Ningún registro se ve sin que un humano lo haya mirado.
      </p>

      <section className="mt-12">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          01 · En revisión ({pendientes.length})
        </h2>

        <div className="mt-6">
          {pendientes.length === 0 ? (
            <p className="border-t border-tinta/12 py-10 font-sans text-sm text-tinta/55">
              No hay registros esperando revisión.
            </p>
          ) : (
            pendientes.map((s) => (
              <FichaServicio key={s.id} servicio={s} fotoUrl={fotos.get(s.id) ?? null} />
            ))
          )}
        </div>
      </section>

      {/* Caracterización: agregados, nunca filas individuales. La pregunta de
          investigación es "cuántos no tienen ARL", no "quién no tiene". */}
      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          02 · Caracterización laboral
        </h2>
        <p className="mt-3 font-sans text-xs text-tinta/50">
          Datos reservados, nunca publicados. Se muestran agregados.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { valor: resumen.total, etiqueta: 'Registros' },
            { valor: resumen.sin_arl, etiqueta: 'Sin ARL' },
            { valor: resumen.ingreso_principal, etiqueta: 'Es su ingreso principal' },
            { valor: resumen.sin_herramientas, etiqueta: 'Sin herramientas' },
            { valor: resumen.sin_formacion, etiqueta: 'Sin formación' },
          ].map((m) => (
            <div key={m.etiqueta} className="border-t border-tinta/12 pt-4">
              <p className="font-mono text-3xl text-tinta">{m.valor}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-tinta/50">
                {m.etiqueta}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 max-w-2xl">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          03 · Qué les dificulta conseguir trabajo
        </h2>

        <div className="mt-6">
          {dificultades.length === 0 ? (
            <p className="font-sans text-sm text-tinta/55">Todavía sin respuestas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dificultades.map((d) => (
                <li
                  key={d.dificultad}
                  className="flex items-baseline justify-between gap-4 border-t border-tinta/12 pt-2"
                >
                  <span className="font-sans text-sm text-tinta/75">{d.dificultad}</span>
                  <span className="font-mono text-xs text-tinta/50">{d.veces}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
