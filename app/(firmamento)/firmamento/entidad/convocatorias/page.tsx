import type { Metadata } from 'next';

import { CLASE_BOTON_PANEL, hoyBogota, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEntidad } from '@/lib/auth/firmamento';
import { entidadDeSesion } from '@/lib/auth/entidad';
import {
  listarConvocatoriasVigentes,
  listarPropuestasDeEntidad,
  type ConvocatoriaParaTi,
  type PropuestaDeEntidad,
} from '@/lib/db/convocatorias.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { TEMAS_CONVOCATORIA } from '@/lib/validation/convocatoria.schema';
import { FormularioPropuesta } from './_components/FormularioPropuesta';

export const metadata: Metadata = { title: 'Convocatorias' };

// La sesión y la base se leen en cada carga.
export const dynamic = 'force-dynamic';

/** Días de calendario entre dos fechas AAAA-MM-DD (sin zonas horarias de por medio). */
function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

function Cierre({ fecha, hoy }: { fecha: string | null; hoy: string }) {
  if (!fecha) {
    return <p className="font-sans text-sm text-tinta/70">Sin fecha de cierre</p>;
  }
  const dias = diasEntre(hoy, fecha);
  const aviso = dias === 0 ? 'Cierra hoy' : dias === 1 ? 'Cierra mañana' : dias <= 7 ? `Cierra en ${dias} días` : null;
  return (
    <p className="font-sans text-sm text-tinta/70">
      Cierra el <span className="text-tinta tabular-nums">{fechaLarga(fecha)}</span>
      {aviso && <span className="ml-2 font-medium text-azul-texto">· {aviso}</span>}
    </p>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-tinta/55 px-2.5 py-0.5 font-sans text-xs text-tinta/70">
      {children}
    </span>
  );
}

function FilaVigente({ c, hoy }: { c: ConvocatoriaParaTi; hoy: string }) {
  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap gap-2">
        <Chip>{c.entidad}</Chip>
        {c.tema && <Chip>{c.tema}</Chip>}
      </div>
      <h3 className="mt-3 break-words font-sans text-lg font-medium leading-snug text-tinta">{c.titulo}</h3>
      {c.resumen && <p className="mt-2 break-words font-sans text-sm leading-relaxed text-tinta/70">{c.resumen}</p>}
      <div className="mt-3">
        <Cierre fecha={c.fecha_cierre} hoy={hoy} />
      </div>
      <a href={c.url} target="_blank" rel="noopener noreferrer" className={`${CLASE_BOTON_PANEL} mt-3`}>
        Fuente oficial
        <span className="sr-only"> (se abre en otra pestaña)</span>
        <span aria-hidden="true" className="ml-1.5">
          ↗
        </span>
      </a>
    </li>
  );
}

/**
 * Cada estado se dice con palabras (el color solo refuerza): quien no distingue
 * los colores lee «En revisión», «Aprobada», «No aprobada» o «Cerrada».
 */
function describirEstado(p: PropuestaDeEntidad, hoy: string): { rotulo: string; detalle: string; clase: string } {
  const cerro = p.fecha_cierre !== null && p.fecha_cierre < hoy;
  if (p.estado === 'aprobada' && !cerro) {
    return {
      rotulo: 'Aprobada',
      detalle: 'Ya la ven los negocios a los que aplica.',
      clase: 'border-azul text-azul-texto',
    };
  }
  if (p.estado === 'descartada') {
    return {
      rotulo: 'No aprobada',
      detalle: 'El equipo no la publicó.',
      clase: 'border-amarillo text-morado-texto',
    };
  }
  if (p.estado === 'vencida' || cerro) {
    return { rotulo: 'Cerrada', detalle: 'Ya pasó su fecha de cierre.', clase: 'border-tinta/55 text-tinta/70' };
  }
  return {
    rotulo: 'En revisión',
    detalle: 'El equipo la está revisando. No se muestra a nadie todavía.',
    clase: 'border-tinta/55 text-tinta',
  };
}

function FilaPropuesta({ p, hoy }: { p: PropuestaDeEntidad; hoy: string }) {
  const e = describirEstado(p, hoy);
  return (
    <li className="border-b border-tinta/12 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs font-medium ${e.clase}`}
        >
          {e.rotulo}
        </span>
        {p.tema && <Chip>{p.tema}</Chip>}
      </div>
      <p className="mt-2 break-words font-sans text-base font-medium leading-snug text-tinta">{p.titulo}</p>
      <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">{e.detalle}</p>
      <p className="mt-1 font-sans text-sm text-tinta/70">
        Enviada el <span className="tabular-nums">{fechaLarga(p.propuesta_en)}</span>
      </p>
    </li>
  );
}

/**
 * Convocatorias para la entidad: las aprobadas y vigentes, y el formulario para
 * proponer una. Lo que ve son convocatorias (información pública de entidades),
 * nunca negocios. La entidad que propone sale de `entidadDeSesion`, no del
 * formulario (lib/actions/proponerConvocatoria.ts).
 */
export default async function EntidadConvocatoriasPage() {
  await exigirEntidad();
  // `exigirEntidad` ya la resolvió; `entidadDeSesion` está en caché por petición.
  const entidad = await entidadDeSesion();

  const [vigentes, propuestas] = await Promise.all([
    listarConvocatoriasVigentes().catch((e) => {
      console.error('[entidad] no se pudieron leer las convocatorias vigentes', e);
      return null;
    }),
    entidad
      ? listarPropuestasDeEntidad(entidad.id).catch((e) => {
          console.error('[entidad] no se pudieron leer las propuestas', e);
          return null;
        })
      : Promise.resolve([] as PropuestaDeEntidad[]),
  ]);
  const hoy = hoyBogota();

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      <p className="max-w-3xl font-sans text-base leading-relaxed text-tinta/70">
        Las convocatorias que el equipo ya aprobó para los negocios de la comuna, y un lugar para proponer las de tu
        entidad.
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <Tarjeta
          titulo="Abiertas ahora"
          id="vigentes-titulo"
          resumen={vigentes ? `${vigentes.length}` : undefined}
          accion={
            <a
              href="#proponer"
              className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline underline-offset-4 lg:hidden"
            >
              Ir a proponer una convocatoria
            </a>
          }
        >
          {vigentes === null ? (
            <p role="status" className="font-sans text-base leading-relaxed text-tinta/70">
              No pudimos consultar las convocatorias en este momento. Vuelve a intentarlo en unos minutos.
            </p>
          ) : vigentes.length === 0 ? (
            <p className="max-w-xl font-sans text-base leading-relaxed text-tinta/70">
              Todavía no hay convocatorias abiertas aprobadas. Cuando el equipo apruebe una, aparece aquí con su fecha
              de cierre y su fuente oficial.
            </p>
          ) : (
            <ul className="divide-y divide-tinta/12">
              {vigentes.map((c) => (
                <FilaVigente key={c.id} c={c} hoy={hoy} />
              ))}
            </ul>
          )}
        </Tarjeta>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Plegada: con el `#proponer` del enlace de arriba (y del Observatorio) se abre sola. Un error al enviar la deja abierta. */}
          <Tarjeta titulo="Proponer una convocatoria" id="titulo-proponer" plegable ancla="proponer" className="scroll-mt-20">
            <FormularioPropuesta temas={TEMAS_CONVOCATORIA} hoy={hoy} />
          </Tarjeta>

          <Tarjeta
            titulo="Tus propuestas"
            id="propuestas-titulo"
            plegable
            abierta={propuestas !== null && propuestas.length > 0}
            resumen={propuestas ? `${propuestas.length}` : undefined}
          >
            {propuestas === null ? (
              <p role="status" className="font-sans text-sm leading-relaxed text-tinta/70">
                No pudimos consultar tus propuestas ahora. Vuelve a intentarlo en unos minutos.
              </p>
            ) : propuestas.length === 0 ? (
              <p className="font-sans text-sm leading-relaxed text-tinta/70">
                Aún no has enviado ninguna. Cuando envíes una, aquí ves si el equipo la aprobó.
              </p>
            ) : (
              <ul>
                {propuestas.map((p) => (
                  <FilaPropuesta key={p.id} p={p} hoy={hoy} />
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
