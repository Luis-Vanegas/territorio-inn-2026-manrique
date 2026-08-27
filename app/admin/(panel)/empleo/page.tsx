import { listarCandidatosPendientes } from '@/lib/db/candidatos.repo';
import { FichaCandidato } from './_components/FichaCandidato';

export const dynamic = 'force-dynamic';

export default async function AdminEmpleoPage() {
  const pendientes = await listarCandidatosPendientes();

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">Empleo</h1>

      <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-tinta/60">
        Personas que buscan trabajo. Acá se publican teléfonos reales, así que
        la moderación filtra spam y datos falsos antes de que salgan a la
        vitrina.
      </p>

      <section className="mt-12">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          En revisión ({pendientes.length})
        </h2>

        <div className="mt-6">
          {pendientes.length === 0 ? (
            <p className="border-t border-tinta/12 py-10 font-sans text-sm text-tinta/55">
              No hay registros esperando revisión.
            </p>
          ) : (
            pendientes.map((c) => <FichaCandidato key={c.id} candidato={c} />)
          )}
        </div>
      </section>
    </main>
  );
}
