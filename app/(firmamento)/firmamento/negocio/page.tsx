import type { Metadata } from 'next';
import Link from 'next/link';

import { Kpi } from '@/components/firmamento/Kpi';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { convocatoriasParaTi } from '@/lib/db/convocatorias.repo';
import { comparacionCategoria, perfilesParaTi, semanasDeNegocio } from '@/lib/db/cuenta.repo';
import { obtenerPropio } from '@/lib/db/portafolios.repo';
import { completitudFicha, resumenSemanas } from '@/lib/firmamento/ficha';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { fechaHoyBogota, formatearNumero } from '@/lib/formato';
import { BarraFicha } from './_components/FichaCompleta';
import { EstadoFicha } from './_components/EstadoFicha';
import { GraficoSemanas } from './_components/GraficoSemanas';
import { ListaConvocatorias } from './_components/ListaConvocatorias';
import { SelectorNegocio } from './_components/SelectorNegocio';
import { SinNegocio } from './_components/SinNegocio';
import { VistaPreviaFicha } from './_components/VistaPreviaFicha';

export const metadata: Metadata = { title: 'Inicio' };

// Lee la sesión y la base en cada carga: nada que prerenderizar.
export const dynamic = 'force-dynamic';

/** Un extra del inicio no puede tumbar la página: si su consulta falla, se muestra sin él. */
function opcional<T>(promesa: Promise<T>, vacio: T, que: string): Promise<T> {
  return promesa.catch((e) => {
    console.error(`[panel negocio] ${que} falló`, e instanceof Error ? e.message : e);
    return vacio;
  });
}

function textoVariacion(v: number | null): string {
  if (v === null) return 'Sin datos de las 4 semanas anteriores para comparar.';
  if (v === 0) return 'Igual que en las 4 semanas anteriores.';
  return `${v > 0 ? 'Subió' : 'Bajó'} ${formatearNumero(Math.abs(v))} % frente a las 4 semanas anteriores.`;
}

export default async function NegocioInicioPage() {
  const { usuarioId, nombre } = await exigirNegocio();
  const { negocios, actual } = await negocioActivo(usuarioId);

  if (!actual) {
    return (
      <SinNegocio aviso="Cuando registres tu negocio, aquí ves cuánta gente miró tu ficha y cuántos te escribieron." />
    );
  }

  const [portafolio, semanas, comparacion, paraTi] = await Promise.all([
    obtenerPropio(usuarioId, actual.id),
    opcional(semanasDeNegocio(usuarioId, actual.id), [], 'semanas'),
    opcional(comparacionCategoria(usuarioId, actual.id), null, 'comparación con la categoría'),
    opcional(perfilesParaTi(usuarioId).then(convocatoriasParaTi), [], '«Para ti»'),
  ]);
  if (!portafolio) return <SinNegocio aviso="No encontramos ese negocio en tu cuenta." />;

  const publicada = portafolio.estado === 'aprobado';
  const resumen = semanas.length >= 8 ? resumenSemanas(semanas) : null;
  const ficha = completitudFicha(portafolio);
  const hoy = fechaHoyBogota();
  const fuenteCifras = 'conteos anónimos de tu ficha';
  const primerNombre = nombre.trim().split(/\s+/)[0] ?? nombre;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SelectorNegocio negocios={negocios} actual={actual} />

      <EstadoFicha estado={portafolio.estado} motivo={portafolio.motivo_rechazo} enlaceFicha />

      {/* Saludo y qué tan completa está la ficha */}
      <section
        aria-labelledby="saludo"
        className="grid gap-6 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-center"
      >
        <div>
          <p className="font-sans text-sm text-tenue">{portafolio.categoria_otra || portafolio.categoria_nombre} · {portafolio.barrio}</p>
          <h2 id="saludo" className="mt-1 font-display text-3xl font-medium leading-tight text-estrella sm:text-4xl">
            Hola, {primerNombre}
          </h2>
          <p className="mt-2 max-w-xl font-sans text-base leading-relaxed text-tenue">
            {publicada
              ? `Así le fue a ${portafolio.nombre} en el mapa de Constelaciones en las últimas cuatro semanas.`
              : `Aquí sigues ${portafolio.nombre}. Los números aparecen cuando tu ficha esté publicada.`}
          </p>
        </div>
        <div className="rounded-xl border border-trazo bg-noche p-4">
          <BarraFicha porcentaje={ficha.porcentaje} />
          <p className="mt-2 font-sans text-sm text-tenue">
            {ficha.faltan.length === 0 ? 'Tu ficha tiene todo lo que ayuda.' : 'Completa lo que falta y te encuentran más fácil.'}
          </p>
          <Link
            href="/firmamento/negocio/ficha"
            className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-sodio px-4 font-sans text-sm font-medium text-noche"
          >
            Mejorar mi ficha
          </Link>
        </div>
      </section>

      {/* Los números */}
      <section aria-labelledby="numeros">
        <h2 id="numeros" className="font-display text-2xl font-medium text-estrella">
          Tus números, últimas 4 semanas
        </h2>

        {!publicada || !resumen ? (
          <p className="mt-3 max-w-xl font-sans text-base leading-relaxed text-tenue">
            {publicada
              ? 'No pudimos consultar tus números ahora. Intenta de nuevo en un momento.'
              : 'Las cifras aparecen aquí cuando tu ficha esté publicada: no mostramos números de ejemplo.'}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              valor={formatearNumero(resumen.vistas)}
              numero={resumen.vistas}
              etiqueta="Vistas de tu ficha"
              aclaracion={textoVariacion(resumen.variacionVistas)}
              fuente={fuenteCifras}
              fecha={`4 semanas al ${hoy}`}
            />
            <Kpi
              valor={formatearNumero(resumen.contactos)}
              numero={resumen.contactos}
              etiqueta="Toques de contacto"
              aclaracion={`WhatsApp, teléfono, correo o redes. ${textoVariacion(resumen.variacionContactos)}`}
              fuente={fuenteCifras}
              fecha={`4 semanas al ${hoy}`}
              tono="estrella"
            />
            <Kpi
              valor={resumen.contactosPor100 === null ? '—' : formatearNumero(resumen.contactosPor100, 1)}
              numero={resumen.contactosPor100 ?? undefined}
              decimales={1}
              etiqueta="Contactos por cada 100 vistas"
              aclaracion={
                comparacion
                  ? `Tu categoría, con ${comparacion.negocios} negocios: ${formatearNumero(comparacion.contactosPor100, 1)}.`
                  : 'Comparamos con tu categoría cuando hay al menos 5 negocios en ella, para que nadie quede expuesto.'
              }
              fuente={fuenteCifras}
              fecha={`4 semanas al ${hoy}`}
              tono="estrella"
            />
            <Kpi
              valor={formatearNumero(paraTi.length)}
              numero={paraTi.length}
              etiqueta="Convocatorias para ti"
              aclaracion="Abiertas y revisadas por el equipo."
              enlace={paraTi.length > 0 ? { href: '/firmamento/negocio/para-ti', texto: 'Verlas' } : undefined}
              fuente="convocatorias aprobadas por el equipo"
              fecha={hoy}
              tono="estrella"
            />
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Semana a semana */}
        <section aria-labelledby="semana" className="min-w-0 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6">
          <h2 id="semana" className="font-display text-2xl font-medium text-estrella">
            Semana a semana
          </h2>
          {publicada && semanas.length >= 8 ? (
            <div className="mt-4">
              <GraficoSemanas semanas={semanas} nombre={portafolio.nombre} />
              <p className="mt-3 font-cifra text-xs leading-relaxed text-tenue">
                Fuente: {fuenteCifras} · 8 semanas al {hoy}
              </p>
            </div>
          ) : (
            <p className="mt-3 font-sans text-base leading-relaxed text-tenue">
              El gráfico aparece cuando tu ficha esté publicada.
            </p>
          )}
        </section>

        {/* Lo que más suma */}
        <section aria-labelledby="suma" className="min-w-0 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6">
          <h2 id="suma" className="font-display text-2xl font-medium text-estrella">
            Lo que más suma
          </h2>
          {ficha.faltan.length === 0 ? (
            <p className="mt-3 font-sans text-base leading-relaxed text-tenue">
              Tu ficha ya tiene las ocho cosas que ayudan. Mantenla al día cuando algo cambie.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-trazo">
              {ficha.faltan.slice(0, 3).map((p) => (
                <li key={p.id} className="py-3">
                  <p className="font-sans text-base font-medium text-estrella">
                    <span aria-hidden="true" className="mr-2 text-sodio">+</span>
                    {p.etiqueta}
                  </p>
                  <p className="mt-0.5 font-sans text-sm leading-snug text-tenue">{p.ayuda}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Para ti esta semana */}
        <section aria-labelledby="para-ti" className="min-w-0 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 id="para-ti" className="font-display text-2xl font-medium text-estrella">
              Para ti
            </h2>
            <Link
              href="/firmamento/negocio/para-ti"
              className="inline-flex min-h-[44px] items-center font-sans text-sm text-sodio underline underline-offset-4"
            >
              Ver todas
            </Link>
          </div>
          {paraTi.length === 0 ? (
            <p className="mt-2 font-sans text-base leading-relaxed text-tenue">
              Por ahora no hay convocatorias abiertas que encajen con tu negocio. Cuando aparezca una, la ves aquí.
            </p>
          ) : (
            <div className="mt-3">
              <ListaConvocatorias convocatorias={paraTi} max={2} compacta />
            </div>
          )}
        </section>

        {/* Así te ven tus vecinos */}
        <section aria-labelledby="asi-te-ven" className="min-w-0 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6">
          <h2 id="asi-te-ven" className="font-display text-2xl font-medium text-estrella">
            Así te ven tus vecinos
          </h2>
          <div className="mt-3">
            <VistaPreviaFicha portafolio={portafolio} />
          </div>
        </section>
      </div>
    </div>
  );
}
