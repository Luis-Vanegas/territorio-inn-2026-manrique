import type { Metadata } from 'next';

import { exigirEquipo } from '@/lib/auth/firmamento';
import { listarTodosLosCampos, contarValoresPorCampo } from '@/lib/db/camposPersonalizados.repo';
import { SeccionNuevoCampo } from './_components/SeccionNuevoCampo';
import { FilaCampo } from './_components/FilaCampo';

export const metadata: Metadata = { title: 'Campos del registro' };

// La lista cambia con cada alta/edición/desactivación: no se cachea.
export const dynamic = 'force-dynamic';

export default async function CamposPage() {
  await exigirEquipo();

  const [campos, conValor] = await Promise.all([
    listarTodosLosCampos(),
    // Solo informa el aviso de «publicar»: si falla, la pantalla sigue (sin la cifra).
    contarValoresPorCampo().catch((e) => {
      console.error('[equipo/campos] conteo de valores falló', e instanceof Error ? e.message : e);
      return null;
    }),
  ]);

  return (
    <div>
      <p className="max-w-2xl font-sans text-base leading-relaxed text-tenue">
        Los campos que agregues aquí aparecen en el formulario público de
        registro, después de los campos fijos (nombre, categoría, ubicación,
        contacto). Desactivar un campo lo saca del formulario sin borrar los
        valores que ya cargó la gente. Lo que la gente escribe en un campo solo
        se ve en la vitrina si lo marcas como público; por defecto cada campo
        nuevo es privado.
      </p>

      <div className="mt-8">
        <SeccionNuevoCampo />
      </div>

      <section aria-label="Campos personalizados" className="mt-8">
        {campos.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tenue">
            Todavía no hay campos personalizados.
          </p>
        ) : (
          campos.map((c) => <FilaCampo key={c.id} campo={c} conValor={conValor ? (conValor[c.slug] ?? 0) : null} />)
        )}
      </section>
    </div>
  );
}
