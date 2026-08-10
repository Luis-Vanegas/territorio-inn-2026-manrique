import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
import { SeccionNuevoCampo } from './_components/SeccionNuevoCampo';
import { FilaCampo } from './_components/FilaCampo';

// La lista cambia con cada alta/edición/desactivación: no se cachea.
export const dynamic = 'force-dynamic';

export default async function CamposPage() {
  const campos = await listarTodosLosCampos();

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">
        Campos del formulario
      </h1>

      <p className="mt-3 max-w-xl font-sans text-sm text-tinta/60">
        Los campos que agregues acá aparecen en el formulario público de
        registro, después de los campos fijos (nombre, categoría, ubicación,
        contacto). Desactivar un campo lo saca del formulario sin borrar los
        valores que ya cargó la gente.
      </p>

      <div className="mt-8">
        <SeccionNuevoCampo />
      </div>

      <section className="mt-8">
        {campos.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/60">
            Todavía no hay campos personalizados.
          </p>
        ) : (
          campos.map((c) => <FilaCampo key={c.id} campo={c} />)
        )}
      </section>
    </main>
  );
}
