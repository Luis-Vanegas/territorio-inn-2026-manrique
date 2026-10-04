import type { Metadata } from 'next';
import Link from 'next/link';

import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { CLASE_BOTON_PANEL, CLASE_BOTON_PRIMARIO, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { convocatoriasParaTi } from '@/lib/db/convocatorias.repo';
import { comparacionCategoria, perfilesParaTi, semanasDeNegocio } from '@/lib/db/cuenta.repo';
import { obtenerPropio } from '@/lib/db/portafolios.repo';
import { completitudFicha, resumenSemanas } from '@/lib/firmamento/ficha';
import { fechaHoyBogota, formatearNumero } from '@/lib/formato';
import { BarraFicha } from './_components/FichaCompleta';
import { EstadoFicha } from './_components/EstadoFicha';
import { GraficoSemanas } from './_components/GraficoSemanas';
import { ListaConvocatorias } from './_components/ListaConvocatorias';
import { SelectorNegocio } from './_components/SelectorNegocio';
import { SinNegocio } from './_components/SinNegocio';
import { TarjetaEmprendimiento } from '@/components/vitrina/TarjetaEmprendimiento';
import { hrefFichaPublica, negocioActivo } from '@/lib/firmamento/negocio';

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

export default async function NegocioInicioPage({
  searchParams,
}: {
  searchParams: Promise<{ registrado?: string; foto?: string; menu?: string }>;
}) {
  const { usuarioId, nombre } = await exigirNegocio();
  const { negocios, actual } = await negocioActivo(usuarioId);
  const { registrado, foto, menu } = await searchParams;

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
  // Ocho semanas de ceros: una línea honesta vale más que ocho filas de «0 / 0».
  const sinMovimiento = semanas.every((s) => s.vistas === 0 && s.contactos === 0);
  const ficha = completitudFicha(portafolio);
  const hoy = fechaHoyBogota();
  const fuenteCifras = 'conteos anónimos de tu ficha';
  const primerNombre = nombre.trim().split(/\s+/)[0] ?? nombre;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {registrado && (
        <p role="status" className="rounded-xl border border-azul/60 bg-hueso p-4 font-sans text-base text-tinta">
          <span aria-hidden="true" className="mr-2 text-azul-texto">✓</span>
          Recibimos tu registro. En revisión: aún no se ve en Constelaciones.
          {(foto === 'error' || menu === 'error') && ' No pudimos subir la foto o el menú: agrégalos desde «Mi ficha».'}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <SelectorNegocio negocios={negocios} actual={actual} />
        <Link href="/firmamento/negocio/registro" className={CLASE_BOTON_PANEL}>
          Agregar otro negocio
        </Link>
      </div>

      <EstadoFicha estado={portafolio.estado} motivo={portafolio.motivo_rechazo} enlaceFicha />

      <Tarjeta
        titulo={`Hola, ${primerNombre}`}
        id="saludo"
        resumen={`${portafolio.categoria_otra || portafolio.categoria_nombre} · ${portafolio.barrio}`}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-end">
          <div>
            <p className="max-w-xl font-sans text-base leading-relaxed text-tinta/70">
              {publicada
                ? `Así le fue a ${portafolio.nombre} en el mapa de Constelaciones en las últimas cuatro semanas.`
                : `Aquí sigues ${portafolio.nombre}. Los números aparecen cuando tu ficha esté publicada.`}
            </p>
            <p className="mt-2 font-sans text-sm text-tinta/70">
              {ficha.faltan.length === 0
                ? 'Tu ficha tiene todo lo que ayuda.'
                : 'Completa lo que falta y te encuentran más fácil.'}
            </p>
          </div>
          <div>
            <BarraFicha porcentaje={ficha.porcentaje} />
            <Link href="/firmamento/negocio/ficha" className={`${CLASE_BOTON_PRIMARIO} mt-3`}>
              Mejorar mi ficha
            </Link>
          </div>
        </div>
      </Tarjeta>

      {/* Los números: la banda de noche, con «Semana a semana» plegada adentro */}
      <VentanaNoche titulo="Tus números, últimas 4 semanas" id="numeros">
        {!publicada || !resumen ? (
          <p className="max-w-xl font-sans text-base leading-relaxed text-tinta/70">
            {publicada
              ? 'No pudimos consultar tus números ahora. Intenta de nuevo en un momento.'
              : 'Las cifras aparecen aquí cuando tu ficha esté publicada: no mostramos números de ejemplo.'}
          </p>
        ) : (
          <>
            <GrupoCifras
              fuente={`${fuenteCifras}; la última, convocatorias aprobadas por el equipo`}
              fecha={`4 semanas al ${hoy}`}
            >
              <Kpi
                valor={formatearNumero(resumen.vistas)}
                numero={resumen.vistas}
                etiqueta="Vistas de tu ficha"
                aclaracion={textoVariacion(resumen.variacionVistas)}
              />
              <Kpi
                valor={formatearNumero(resumen.contactos)}
                numero={resumen.contactos}
                etiqueta="Toques de contacto"
                aclaracion={`WhatsApp, teléfono, correo o redes. ${textoVariacion(resumen.variacionContactos)}`}
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
                    : 'Lo comparamos con tu categoría cuando hay 5 o más negocios en ella.'
                }
                tono="estrella"
              />
              <Kpi
                valor={formatearNumero(paraTi.length)}
                numero={paraTi.length}
                etiqueta="Convocatorias para ti"
                aclaracion="Abiertas y revisadas por el equipo."
                enlace={paraTi.length > 0 ? { href: '/firmamento/negocio/para-ti', texto: 'Verlas' } : undefined}
                tono="estrella"
              />
            </GrupoCifras>

            <div className="mt-4">
              {sinMovimiento ? (
                <p className="font-sans text-sm leading-relaxed text-tinta/70">
                  En las últimas 8 semanas nadie ha visto tu ficha todavía. Comparte su enlace con tus clientes y
                  aquí vas a ver cómo llegan.
                </p>
              ) : (
                <Tarjeta titulo="Semana a semana" id="semana" plegable resumen="8 semanas, vistas y contactos">
                  <GraficoSemanas semanas={semanas} nombre={portafolio.nombre} />
                  <p className="mt-3 font-sans text-xs leading-relaxed text-tinta/70">
                    Fuente: {fuenteCifras} · 8 semanas al {hoy}
                  </p>
                </Tarjeta>
              )}
            </div>
          </>
        )}
      </VentanaNoche>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Solo si queda algo por hacer: con la ficha completa no hay nada que decir */}
          {ficha.faltan.length > 0 && (
            <Tarjeta titulo="Lo que más suma" id="suma" plegable abierta resumen={`${ficha.faltan.length} por completar`}>
              <ul className="divide-y divide-tinta/12">
                {ficha.faltan.slice(0, 3).map((p) => (
                  <li key={p.id} className="py-3 first:pt-0">
                    <p className="font-sans text-base font-medium text-tinta">
                      <span aria-hidden="true" className="mr-2 text-azul-texto">+</span>
                      {p.etiqueta}
                    </p>
                    <p className="mt-0.5 font-sans text-sm leading-snug text-tinta/70">{p.ayuda}</p>
                  </li>
                ))}
              </ul>
              <Link href="/firmamento/negocio/ficha" className={`${CLASE_BOTON_PANEL} mt-3`}>
                Completarlo en mi ficha
              </Link>
            </Tarjeta>
          )}

          <Tarjeta titulo="Así te ven tus vecinos" id="asi-te-ven" plegable resumen="Vista previa de tu ficha">
            <div className="modo-dia mb-3 rounded-xl bg-hueso px-4 pb-4 text-tinta [&_article]:border-t-0 [&_article]:pb-0 [&_article]:pt-4">
              <TarjetaEmprendimiento portafolio={portafolio} indice={0} definicionesCampos={[]} vistaPrevia />
            </div>
            {publicada ? (
              <a href={hrefFichaPublica(portafolio)!} target="_blank" rel="noopener" className={CLASE_BOTON_PANEL}>
                Ver mi ficha en Constelaciones <span aria-hidden="true">↗</span>
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            ) : (
              <p className="font-sans text-sm text-tinta/70">Aún no se ve en Constelaciones: aparece apenas la aprobemos.</p>
            )}
          </Tarjeta>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {paraTi.length > 0 && (
            <Tarjeta
              titulo="Para ti"
              id="para-ti"
              resumen={`${paraTi.length} abiertas`}
              accion={
                <Link
                  href="/firmamento/negocio/para-ti"
                  className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline underline-offset-4"
                >
                  Ver todas
                </Link>
              }
            >
              <ListaConvocatorias convocatorias={paraTi} max={2} />
            </Tarjeta>
          )}

          <Tarjeta titulo="Tu cuadra" id="cuadra">
            <p className="font-sans text-base leading-relaxed text-tinta/70">
              Mira qué negocios tienes cerca, con quién podrías aliarte y cómo invitar a tus vecinos.
            </p>
            <Link href="/firmamento/negocio/constelacion" className={`${CLASE_BOTON_PANEL} mt-3`}>
              Ver mi constelación
            </Link>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
