import type { Metadata } from 'next';
import Link from 'next/link';

import { exigirNegocio } from '@/lib/auth/firmamento';
import { enlaceWhatsapp } from '@/lib/contacto';
import { listarClientes, MAXIMO_CLIENTES, type ClienteNegocio } from '@/lib/db/clientes.repo';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { ETIQUETA_ETAPA } from '@/lib/validation/cliente.schema';
import { SelectorNegocio } from '../_components/SelectorNegocio';
import { SinNegocio } from '../_components/SinNegocio';
import { BotonBorrarCliente, FormularioCliente } from './_components/FormularioCliente';

export const metadata: Metadata = { title: 'Mis clientes' };

export const dynamic = 'force-dynamic';

/** Hoy en Medellín, 'YYYY-MM-DD'. El servidor corre en UTC: a las 8 p. m. de acá allá ya es mañana. */
function hoyEnColombia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

function fechaLegible(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a!, m! - 1, d!)).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export default async function MisClientesPage() {
  const { usuarioId } = await exigirNegocio();
  const { negocios, actual: negocio } = await negocioActivo(usuarioId);

  if (!negocio) {
    return <SinNegocio aviso="Para llevar tus clientes primero registra tu negocio." />;
  }

  // El repo filtra por la cuenta de la sesión: un id ajeno no devuelve nada.
  const clientes = await listarClientes(usuarioId, negocio.id);
  const hoy = hoyEnColombia();
  // Lo que ya tocaba (o toca hoy) y no se cerró: es lo primero que hay que ver.
  const paraHoy = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto <= hoy && c.etapa !== 'compro' && c.etapa !== 'no_compro',
  );
  const resto = clientes.filter((c) => !paraHoy.includes(c));

  return (
    <div className="mx-auto max-w-5xl">
      <SelectorNegocio negocios={negocios} actual={negocio} />

      <p className="max-w-2xl font-sans text-base leading-relaxed text-tenue">
        Anota a quién le vendiste o quién te preguntó, y cuándo volver a escribirle. Así no se te pierde ninguna
        venta por falta de seguimiento.
      </p>

      <section aria-labelledby="titulo-nuevo" className="mt-6 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6">
        <h2 id="titulo-nuevo" className="font-display text-2xl font-medium text-estrella">
          Agregar un cliente
        </h2>
        {/* Ley 1581: estos datos son de otras personas. Se dice acá, donde se escriben. */}
        <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tenue">
          Anota solo a quien te dio su número para que lo contactes. Estos datos los ves solo tú y puedes borrarlos
          cuando quieras.
        </p>
        <div className="mt-5 max-w-3xl">
          <FormularioCliente key={negocio.id} portafolioId={negocio.id} />
        </div>
      </section>

      {paraHoy.length > 0 && (
        <ListaClientes titulo="Para escribirles hoy" clientes={paraHoy} negocio={negocio} hoy={hoy} destacada />
      )}

      {resto.length > 0 ? (
        <ListaClientes
          titulo={paraHoy.length > 0 ? 'El resto de tu lista' : 'Tu lista'}
          clientes={resto}
          negocio={negocio}
          hoy={hoy}
        />
      ) : (
        clientes.length === 0 && (
          <p className="mt-8 max-w-xl font-sans text-base leading-relaxed text-tenue">
            Todavía no tienes clientes anotados. Empieza por quien te escribió esta semana.
          </p>
        )
      )}

      {clientes.length > 0 && (
        <p className="mt-8 font-sans text-sm text-tenue">
          <span className="font-cifra">
            {clientes.length} de {MAXIMO_CLIENTES}
          </span>{' '}
          clientes · ¿Quieres escribir mejor tus mensajes?{' '}
          <Link href="/ventas/vende-mejor" className="inline-flex min-h-[44px] items-center text-sodio underline underline-offset-4">
            Mira la guía Vende mejor
          </Link>
        </p>
      )}
    </div>
  );
}

function ListaClientes({
  titulo,
  clientes,
  negocio,
  hoy,
  destacada,
}: {
  titulo: string;
  clientes: ClienteNegocio[];
  negocio: { id: string; nombre: string };
  hoy: string;
  destacada?: boolean;
}) {
  return (
    <section className="mt-8" aria-label={titulo}>
      <h2 className="font-display text-2xl font-medium text-estrella">
        {titulo} <span className="font-cifra text-base text-tenue">· {clientes.length}</span>
      </h2>
      <ul className="mt-4 grid gap-4 lg:grid-cols-2">
        {clientes.map((c) => {
          const atrasado = c.proximo_contacto !== null && c.proximo_contacto < hoy;
          // El mensaje de "Seguimiento simple" de la guía Vende mejor, ya armado.
          const mensaje = `Hola, ${c.nombre}. Te escribo de ${negocio.nombre} por si todavía te interesa lo que conversamos. Si quieres, te ayudo a resolver cualquier duda.`;

          return (
            <li
              key={c.id}
              className={`min-w-0 rounded-xl border bg-noche-2 p-5 ${destacada ? 'border-sodio' : 'border-trazo'}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="break-words font-display text-xl font-medium text-estrella">{c.nombre}</h3>
                <span className="rounded border border-trazo-2 px-2 py-0.5 font-sans text-xs text-tenue">
                  {ETIQUETA_ETAPA[c.etapa]}
                </span>
              </div>

              {c.proximo_contacto && (
                <p className={`mt-1 font-sans text-sm ${atrasado ? 'font-medium text-sodio' : 'text-tenue'}`}>
                  {atrasado ? 'Tocaba escribirle el ' : c.proximo_contacto === hoy ? 'Escríbele hoy' : 'Escribirle el '}
                  {c.proximo_contacto === hoy ? '' : <span className="font-cifra">{fechaLegible(c.proximo_contacto)}</span>}
                </p>
              )}
              {c.nota && <p className="mt-3 whitespace-pre-line break-words font-sans text-sm leading-relaxed text-estrella">{c.nota}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {c.telefono && (
                  <a
                    href={`${enlaceWhatsapp(c.telefono)}?text=${encodeURIComponent(mensaje)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-trazo-2 px-4 font-sans text-sm text-estrella hover:bg-noche-3"
                  >
                    Escribirle por WhatsApp
                    <span className="sr-only"> a {c.nombre} (se abre en otra pestaña)</span>
                  </a>
                )}
                <BotonBorrarCliente id={c.id} nombre={c.nombre} />
              </div>

              <details className="mt-3 border-t border-trazo pt-3">
                <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-sans text-sm text-tenue hover:text-estrella">
                  Editar o cambiar la fecha
                </summary>
                <div className="mt-4">
                  <FormularioCliente portafolioId={negocio.id} cliente={c} />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
