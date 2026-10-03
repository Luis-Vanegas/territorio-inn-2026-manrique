import type { Metadata } from 'next';
import Link from 'next/link';

import { exigirNegocio } from '@/lib/auth/firmamento';
import { convocatoriasParaTi } from '@/lib/db/convocatorias.repo';
import { perfilesParaTi } from '@/lib/db/cuenta.repo';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { PASOS, VIDEOS } from '@/lib/formalizacion';
import { GUIAS } from '@/lib/marca';
import { VENTAS } from '@/lib/ventas';
import { ListaConvocatorias } from '../_components/ListaConvocatorias';
import { SinNegocio } from '../_components/SinNegocio';

export const metadata: Metadata = { title: 'Para ti' };

export const dynamic = 'force-dynamic';

export default async function NegocioParaTiPage() {
  const { usuarioId } = await exigirNegocio();
  const { actual } = await negocioActivo(usuarioId);

  if (!actual) {
    return (
      <SinNegocio aviso="Registra tu negocio y te mostramos las convocatorias abiertas que encajan con su categoría." />
    );
  }

  // Un extra: si falla la consulta, las guías de abajo siguen sirviendo.
  const resultado = await perfilesParaTi(usuarioId)
    .then(convocatoriasParaTi)
    .then((lista) => ({ lista, fallo: false }))
    .catch((e) => {
      console.error('[panel negocio] «Para ti» falló', e instanceof Error ? e.message : e);
      return { lista: [], fallo: true };
    });
  const convocatorias = resultado.lista;
  const falloConsulta = resultado.fallo;

  const guias = [
    {
      titulo: 'Rutas de formalización',
      texto: `${PASOS.length} trámites, apoyos económicos y formación gratuita, con el enlace oficial de cada uno.`,
      href: '/formalizacion',
      accion: 'Ver las rutas',
    },
    {
      titulo: 'Videos y tutoriales',
      texto: `${VIDEOS.length} canales oficiales donde explican los trámites paso a paso.`,
      href: '/formalizacion#videos',
      accion: 'Ver los videos',
    },
    {
      titulo: 'Marca',
      texto: `${GUIAS.length} guías del equipo: fotos, redes, contenido y cómo presentar tu negocio.`,
      href: '/marca',
      accion: 'Ver las guías de marca',
    },
    {
      titulo: 'Ventas',
      texto: `${VENTAS.guias.length} guías para vender mejor: mensajes, seguimiento y cómo atender a quien te escribe.`,
      href: '/ventas',
      accion: 'Ver las guías de ventas',
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <section aria-labelledby="convocatorias">
        <h2 id="convocatorias" className="font-display text-2xl font-medium text-estrella">
          Convocatorias abiertas para tu negocio
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-base leading-relaxed text-tenue">
          Una persona del equipo las revisa antes de mostrártelas. Confirma siempre los requisitos y las
          fechas en la página oficial de quien convoca.
        </p>

        {falloConsulta ? (
          <p role="status" className="mt-5 max-w-xl font-sans text-base leading-relaxed text-tenue">
            No pudimos consultar las convocatorias ahora. Intenta de nuevo en un momento.
          </p>
        ) : convocatorias.length === 0 ? (
          <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-tenue">
            Por ahora no hay convocatorias abiertas para ti. Cuando aparezca una que encaje con tu
            categoría, la mostramos aquí y te avisamos con un número en el menú.
          </p>
        ) : (
          <div className="mt-5">
            <ListaConvocatorias convocatorias={convocatorias} />
          </div>
        )}
      </section>

      <section aria-labelledby="guias">
        <h2 id="guias" className="font-display text-2xl font-medium text-estrella">
          Guías para tu negocio
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {guias.map((g) => (
            <li key={g.href} className="flex flex-col rounded-xl border border-trazo bg-noche-2 p-5">
              <h3 className="font-display text-xl font-medium text-estrella">{g.titulo}</h3>
              <p className="mt-2 font-sans text-base leading-relaxed text-tenue">{g.texto}</p>
              <div className="mt-auto pt-4">
                <Link
                  href={g.href}
                  className="inline-flex min-h-[44px] items-center font-sans text-sm text-sodio underline underline-offset-4"
                >
                  {g.accion}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
