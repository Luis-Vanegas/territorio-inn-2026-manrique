import type { Metadata } from 'next';

import { Asesor } from '@/components/Asesor';
import { consultarAsesorAdmin } from '@/lib/actions/consultarAsesorAdmin';
import { asesorConfigurado } from '@/lib/agente/asesor';
import { exigirEquipo } from '@/lib/auth/firmamento';

export const metadata: Metadata = { title: 'Asesor' };

export const dynamic = 'force-dynamic';

// La guarda va acá y la action la vuelve a exigir por su cuenta: una action se
// puede invocar sin pasar por esta página.
export default async function EquipoAsesorPage() {
  await exigirEquipo();

  return (
    <div className="max-w-3xl">
      <p className="max-w-xl font-sans text-base leading-relaxed text-tenue">
        El mismo asesor que ve un negocio. Prueba qué responde, o úsalo para
        orientar a un negocio sin abrir su ficha. Aquí la consulta es general: no
        lleva los datos de ningún negocio.
      </p>

      <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-tenue">
        Responde solo con el catálogo de trámites y apoyos, igual que en la ficha
        de un negocio. No guarda las preguntas ni las respuestas, y comparte el
        tope de consultas por IP con el resto del sitio.
      </p>

      {asesorConfigurado() ? (
        <Asesor
          accion={consultarAsesorAdmin}
          descripcion="Escribe la pregunta como la haría un negocio."
          hrefRutas="/firmamento/equipo/formalizacion"
        />
      ) : (
        <p
          role="alert"
          className="mt-8 max-w-xl border-l-2 border-azul bg-azul/[0.04] px-5 py-4 font-sans text-sm leading-relaxed text-tinta"
        >
          El asesor no tiene ningún proveedor configurado en este entorno. Falta
          cargar al menos una clave (por ejemplo <code>Gemi_Api</code>) en las
          variables de entorno.
        </p>
      )}
    </div>
  );
}
