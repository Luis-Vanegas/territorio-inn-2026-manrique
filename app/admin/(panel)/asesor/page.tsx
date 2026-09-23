import type { Metadata } from 'next';

import { Asesor } from '@/components/Asesor';
import { EtiquetaPagina } from '@/components/EtiquetaPagina';
import { consultarAsesorAdmin } from '@/lib/actions/consultarAsesorAdmin';
import { asesorConfigurado } from '@/lib/agente/asesor';

export const metadata: Metadata = { title: 'Asesor · Moderación' };

export const dynamic = 'force-dynamic';

// La sesión de moderación la exige el layout del panel para llegar hasta acá, y
// la action la vuelve a exigir por su cuenta: una action se puede invocar sin
// pasar por esta página.
export default function AdminAsesorPage() {
  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <EtiquetaPagina>vista de moderación · el mismo asesor que ve un negocio</EtiquetaPagina>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          Asesor
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Prueba qué responde el asesor de formalización, o úsalo para orientar
          a un negocio sin abrir su ficha. Aquí la consulta es general: no lleva
          los datos de ningún negocio.
        </p>

        <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-tinta/70">
          Responde solo con el catálogo de trámites y apoyos, igual que en la
          ficha de un negocio. No guarda las preguntas ni las respuestas, y
          comparte el tope de consultas por IP con el resto del sitio.
        </p>
      </header>

      {asesorConfigurado() ? (
        <Asesor
          accion={consultarAsesorAdmin}
          descripcion="Escribe la pregunta como la haría un negocio."
          hrefRutas="/admin/formalizacion"
        />
      ) : (
        <p
          role="alert"
          className="mt-12 max-w-xl border-l-2 border-azul bg-azul/[0.04] px-5 py-4 font-sans text-sm leading-relaxed text-tinta"
        >
          El asesor no tiene ningún proveedor configurado en este entorno. Falta
          cargar al menos una clave (por ejemplo <code>GEMINI_API_KEY</code>) en
          las variables de entorno.
        </p>
      )}
    </main>
  );
}
