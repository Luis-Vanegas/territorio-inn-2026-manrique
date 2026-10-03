import type { Metadata } from 'next';

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
import { EncabezadoEntidad } from '../_components/EncabezadoEntidad';
import { FormularioPropuesta } from './_components/FormularioPropuesta';

export const metadata: Metadata = { title: 'Convocatorias' };

// La sesión y la base se leen en cada carga.
export const dynamic = 'force-dynamic';

/** AAAA-MM-DD de hoy en Bogotá (a las 8 p. m. de Colombia en UTC ya es mañana). */
function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

/** Días de calendario entre dos fechas AAAA-MM-DD (sin zonas horarias de por medio). */
function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

function Cierre({ fecha, hoy }: { fecha: string | null; hoy: string }) {
  if (!fecha) {
    return <p className="font-sans text-sm text-tenue">Sin fecha de cierre</p>;
  }
  const dias = diasEntre(hoy, fecha);
  const aviso = dias === 0 ? 'Cierra hoy' : dias === 1 ? 'Cierra mañana' : dias <= 7 ? `Cierra en ${dias} días` : null;
  return (
    <p className="font-sans text-sm text-tenue">
      Cierra el <span className="font-cifra text-estrella">{fechaLarga(fecha)}</span>
      {aviso && <span className="ml-2 font-medium text-sodio">· {aviso}</span>}
    </p>
  );
}

function EnlaceOficial({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center rounded-lg border border-trazo-2 px-4 font-sans text-sm text-estrella hover:border-sodio hover:text-sodio"
    >
      Fuente oficial
      <span className="sr-only"> (se abre en otra pestaña)</span>
      <span aria-hidden="true" className="ml-1.5">
        ↗
      </span>
    </a>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-trazo-2 px-2.5 py-0.5 font-sans text-xs text-tenue">
      {children}
    </span>
  );
}

function TarjetaVigente({ c, hoy }: { c: ConvocatoriaParaTi; hoy: string }) {
  return (
    <li className="border border-trazo bg-noche-2 p-5">
      <div className="flex flex-wrap gap-2">
        <Chip>{c.entidad}</Chip>
        {c.tema && <Chip>{c.tema}</Chip>}
      </div>
      <h3 className="mt-3 break-words font-sans text-lg font-medium leading-snug text-estrella">{c.titulo}</h3>
      {c.resumen && (
        <p className="mt-2 break-words font-sans text-sm leading-relaxed text-tenue">{c.resumen}</p>
      )}
      <div className="mt-3">
        <Cierre fecha={c.fecha_cierre} hoy={hoy} />
      </div>
      <div className="mt-3">
        <EnlaceOficial url={c.url} />
      </div>
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
      clase: 'border-sodio text-sodio',
    };
  }
  if (p.estado === 'descartada') {
    return {
      rotulo: 'No aprobada',
      detalle: 'El equipo no la publicó.',
      clase: 'border-ladrillo text-ladrillo',
    };
  }
  if (p.estado === 'vencida' || cerro) {
    return { rotulo: 'Cerrada', detalle: 'Ya pasó su fecha de cierre.', clase: 'border-trazo-2 text-tenue' };
  }
  return {
    rotulo: 'En revisión',
    detalle: 'El equipo la está revisando. No se muestra a nadie todavía.',
    clase: 'border-trazo-2 text-estrella',
  };
}

function FilaPropuesta({ p, hoy }: { p: PropuestaDeEntidad; hoy: string }) {
  const e = describirEstado(p, hoy);
  return (
    <li className="border-b border-trazo py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs font-medium ${e.clase}`}
        >
          {e.rotulo}
        </span>
        {p.tema && <Chip>{p.tema}</Chip>}
      </div>
      <p className="mt-2 break-words font-sans text-base font-medium leading-snug text-estrella">{p.titulo}</p>
      <p className="mt-1 font-sans text-sm leading-relaxed text-tenue">{e.detalle}</p>
      <p className="mt-1 font-sans text-sm text-tenue">
        Enviada el <span className="font-cifra">{fechaLarga(p.propuesta_en)}</span>
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
  const contexto = await exigirEntidad();
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
    <div className="mx-auto max-w-[1280px]">
      <EncabezadoEntidad entidad={contexto.nombre}>
        Las convocatorias que el equipo ya aprobó para los negocios de la comuna, y un lugar para proponer
        las de tu entidad.
      </EncabezadoEntidad>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="vigentes-titulo" className="min-w-0">
          <h2 id="vigentes-titulo" className="font-display text-2xl font-medium text-estrella sm:text-3xl">
            Abiertas ahora
          </h2>
          <a
            href="#proponer"
            className="mt-2 inline-flex min-h-[44px] items-center font-sans text-sm text-sodio underline underline-offset-4 lg:hidden"
          >
            Ir a proponer una convocatoria
          </a>

          {vigentes === null ? (
            <p role="status" className="mt-4 font-sans text-base leading-relaxed text-tenue">
              No pudimos consultar las convocatorias en este momento. Vuelve a intentarlo en unos minutos.
            </p>
          ) : vigentes.length === 0 ? (
            <p className="mt-4 max-w-xl border border-trazo bg-noche-2 p-5 font-sans text-base leading-relaxed text-tenue">
              Todavía no hay convocatorias abiertas aprobadas. Cuando el equipo apruebe una, aparece aquí
              con su fecha de cierre y su fuente oficial.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {vigentes.map((c) => (
                <TarjetaVigente key={c.id} c={c} hoy={hoy} />
              ))}
            </ul>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-8">
          <section id="proponer" aria-label="Proponer una convocatoria" className="scroll-mt-20">
            <FormularioPropuesta temas={TEMAS_CONVOCATORIA} hoy={hoy} />
          </section>

          <section aria-labelledby="propuestas-titulo" className="border border-trazo bg-noche-2 p-5 sm:p-6">
            <h2 id="propuestas-titulo" className="font-display text-2xl font-medium text-estrella">
              Tus propuestas
            </h2>
            {propuestas === null ? (
              <p role="status" className="mt-3 font-sans text-sm leading-relaxed text-tenue">
                No pudimos consultar tus propuestas ahora. Vuelve a intentarlo en unos minutos.
              </p>
            ) : propuestas.length === 0 ? (
              <p className="mt-3 font-sans text-sm leading-relaxed text-tenue">
                Aún no has enviado ninguna. Cuando envíes una, aquí ves si el equipo la aprobó.
              </p>
            ) : (
              <ul className="mt-2">
                {propuestas.map((p) => (
                  <FilaPropuesta key={p.id} p={p} hoy={hoy} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
