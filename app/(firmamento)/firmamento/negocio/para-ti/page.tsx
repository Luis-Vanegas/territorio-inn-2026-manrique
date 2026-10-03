import type { Metadata } from 'next';
import Link from 'next/link';

import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
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

      <Tarjeta titulo="Guías para tu negocio" id="guias" plegable abierta resumen={`${guias.length} guías`}>
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {guias.map((g) => (
            <li key={g.href} className="flex flex-col border-t border-tinta/12 py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
              <h3 className="font-display text-lg font-medium text-tinta">{g.titulo}</h3>
              <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">{g.texto}</p>
              <Link
                href={g.href}
                className="mt-1 inline-flex min-h-[44px] w-fit items-center font-sans text-sm text-azul-texto underline underline-offset-4"
              >
                {g.accion}
              </Link>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}
