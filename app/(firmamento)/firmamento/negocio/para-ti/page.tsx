import type { Metadata } from 'next';
import Link from 'next/link';

import { Asesor } from '@/components/Asesor';
import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { consultarAsesorUsuario } from '@/lib/actions/consultarAsesorUsuario';
import { asesorConfigurado } from '@/lib/agente/asesor';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { convocatoriasParaTi, listarConvocatoriasVigentes } from '@/lib/db/convocatorias.repo';
import { dificultadesDeNegocio, perfilesParaTi } from '@/lib/db/cuenta.repo';
import { guiasParaTi, type GuiaSugerida } from '@/lib/firmamento/guiasParaTi';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { ListaConvocatorias } from '../_components/ListaConvocatorias';
import { SinNegocio } from '../_components/SinNegocio';
import { OtrasConvocatorias } from './_components/OtrasConvocatorias';

export const metadata: Metadata = { title: 'Para ti' };

export const dynamic = 'force-dynamic';

function ListaGuias({ guias, anidada = false }: { guias: GuiaSugerida[]; anidada?: boolean }) {
  const Titulo = anidada ? 'h4' : 'h3';
  return (
    <ul className="grid gap-x-8 sm:grid-cols-2">
      {guias.map((g) => (
        <li key={g.href} className="flex flex-col border-t border-tinta/12 py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
          <Titulo className="font-display text-lg font-medium text-tinta">{g.titulo}</Titulo>
          <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">{g.texto}</p>
          <Link
            href={g.href}
            className="mt-1 inline-flex min-h-[44px] w-fit items-center font-sans text-sm text-azul-texto underline underline-offset-4"
          >
            {g.accion}
            <span className="sr-only">: {g.titulo}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function NegocioParaTiPage() {
  const { usuarioId } = await exigirNegocio();
  const { actual } = await negocioActivo(usuarioId);

  if (!actual) {
    return (
      <SinNegocio aviso="Registra tu negocio y te mostramos las convocatorias abiertas que encajan con su categoría." />
    );
  }

  // Extras: si una consulta falla, el resto de la página sigue sirviendo.
  const [resultado, vigentes, dificultades] = await Promise.all([
    perfilesParaTi(usuarioId)
      .then(convocatoriasParaTi)
      .then((lista) => ({ lista, fallo: false }))
      .catch((e) => {
        console.error('[panel negocio] «Para ti» falló', e instanceof Error ? e.message : e);
        return { lista: [], fallo: true };
      }),
    listarConvocatoriasVigentes().catch((e) => {
      console.error('[panel negocio] otras convocatorias fallaron', e instanceof Error ? e.message : e);
      return null;
    }),
    dificultadesDeNegocio(usuarioId, actual.id).catch((e) => {
      console.error('[panel negocio] dificultades fallaron', e instanceof Error ? e.message : e);
      return [] as string[];
    }),
  ]);
  const convocatorias = resultado.lista;
  const falloConsulta = resultado.fallo;
  const propias = new Set(convocatorias.map((c) => c.id));
  // Si las tuyas fallaron no se puede saber cuáles son «otras»: no se muestra.
  const otras = falloConsulta || !vigentes ? [] : vigentes.filter((c) => !propias.has(c.id));

  const guias = guiasParaTi(dificultades);
  const totalGuias = guias.generales.length + guias.dificultades.reduce((n, d) => n + d.guias.length, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Tarjeta
        titulo="Convocatorias abiertas para tu negocio"
        id="convocatorias"
        resumen={falloConsulta ? undefined : `${convocatorias.length} ahora`}
      >
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-tinta/70">
          Una persona del equipo las revisa antes de mostrártelas. Confirma siempre los requisitos y las fechas en la
          página oficial de quien convoca.
        </p>

        <div className="mt-5">
          {falloConsulta ? (
            <p role="status" className="max-w-xl font-sans text-base leading-relaxed text-tinta/70">
              No pudimos consultar las convocatorias ahora. Intenta de nuevo en un momento.
            </p>
          ) : convocatorias.length === 0 ? (
            <p className="max-w-xl font-sans text-base leading-relaxed text-tinta/70">
              Por ahora no hay convocatorias abiertas para ti. Cuando aparezca una que encaje con tu categoría, la
              mostramos aquí y te avisamos con un número en el menú.
            </p>
          ) : (
            <ListaConvocatorias convocatorias={convocatorias} />
          )}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Guías para tu negocio" id="guias" plegable abierta resumen={`${totalGuias} guías`}>
        {guias.dificultades.length > 0 && (
          <div className="flex flex-col gap-6">
            <p className="max-w-2xl font-sans text-sm leading-relaxed text-tinta/70">
              Cuando registraste a {actual.nombre} nos contaste qué es lo que más te cuesta. Empieza por estas.
            </p>
            {guias.dificultades.map((d) => (
              <section key={d.id} aria-labelledby={`dificultad-${d.id}`}>
                <h3 id={`dificultad-${d.id}`} className="font-sans text-sm font-medium text-tinta">
                  {d.etiqueta}
                </h3>
                <div className="mt-2">
                  <ListaGuias guias={d.guias} anidada />
                </div>
              </section>
            ))}
            {guias.generales.length > 0 && (
              <h3 className="border-t border-tinta/12 pt-5 font-sans text-sm font-medium text-tinta">Más guías</h3>
            )}
          </div>
        )}
        {guias.generales.length > 0 && (
          <div className={guias.dificultades.length > 0 ? 'mt-2' : undefined}>
            <ListaGuias guias={guias.generales} anidada={guias.dificultades.length > 0} />
          </div>
        )}
      </Tarjeta>

      {asesorConfigurado() && (
        <Tarjeta titulo="Pregúntale al asesor de formalización" id="asesor" plegable resumen="Trámites y apoyos">
          <p className="max-w-2xl font-sans text-sm leading-relaxed text-tinta/70">
            Resuelve dudas sobre el RUT, la cámara de comercio, créditos y formación gratuita. No guarda tus preguntas.
          </p>
          <Asesor accion={consultarAsesorUsuario} />
        </Tarjeta>
      )}

      {otras.length > 0 && (
        <Tarjeta titulo="Otras convocatorias abiertas" id="otras-convocatorias" plegable resumen={`${otras.length}`}>
          <p className="mb-4 max-w-2xl font-sans text-sm leading-relaxed text-tinta/70">
            No encajan con la categoría o la formalidad de tu negocio, pero quizá te sirvan a ti o a un vecino. Revisa
            los requisitos en la fuente oficial.
          </p>
          <OtrasConvocatorias convocatorias={otras} />
        </Tarjeta>
      )}
    </div>
  );
}
