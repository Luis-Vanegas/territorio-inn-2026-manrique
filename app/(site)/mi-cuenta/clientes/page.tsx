import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EnlaceVolver } from '@/components/EnlaceVolver';
import { sesionActual } from '@/lib/auth/usuario';
import { enlaceWhatsapp } from '@/lib/contacto';
import { listarClientes, MAXIMO_CLIENTES, type ClienteNegocio } from '@/lib/db/clientes.repo';
import { negociosDe } from '@/lib/db/usuarios.repo';
import { ETIQUETA_ETAPA } from '@/lib/validation/cliente.schema';
import { BotonBorrarCliente, FormularioCliente } from './_components/FormularioCliente';

export const metadata: Metadata = {
  title: 'Mis clientes · Constelaciones',
  robots: { index: false, follow: false },
};

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

export default async function MisClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ negocio?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/entrar');

  const negocios = (await negociosDe(sesion.id)).filter((n) => n.estado !== 'archivado');
  const pedido = (await searchParams).negocio;
  const negocio = negocios.find((n) => n.id === pedido) ?? negocios[0];

  const clientes = negocio ? await listarClientes(sesion.id, negocio.id) : [];
  const hoy = hoyEnColombia();
  // Lo que ya tocaba (o toca hoy) y no se cerró: es lo primero que hay que ver.
  const paraHoy = clientes.filter(
    (c) => c.proximo_contacto && c.proximo_contacto <= hoy && c.etapa !== 'compro' && c.etapa !== 'no_compro',
  );
  const resto = clientes.filter((c) => !paraHoy.includes(c));

  return (
    <main className="seccion">
      <EnlaceVolver href="/mi-cuenta">← Mi cuenta</EnlaceVolver>

      <header className="mt-10 max-w-3xl">
        <span className="font-sans text-xs text-tinta/65">Tu espacio</span>
        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-5xl">
          Mis clientes
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Anota a quién le vendiste o quién te preguntó, y cuándo volver a escribirle. Así no se te
          pierde ninguna venta por falta de seguimiento.
        </p>
      </header>

      {!negocio ? (
        <div className="mt-12 max-w-xl border-t border-tinta/12 pt-8">
          <p className="font-sans leading-relaxed text-tinta/70">
            Para llevar tus clientes primero registra tu negocio.
          </p>
          <Link
            href="/aliados/registro"
            className="mt-6 inline-block border border-azul-texto bg-azul-texto px-6 py-3 font-sans text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
          >
            Registrar mi negocio →
          </Link>
        </div>
      ) : (
        <>
          {negocios.length > 1 && (
            <nav aria-label="Elegir negocio" className="mt-10 flex flex-wrap gap-2">
              {negocios.map((n) => (
                <Link
                  key={n.id}
                  href={`/mi-cuenta/clientes?negocio=${n.id}`}
                  aria-current={n.id === negocio.id ? 'page' : undefined}
                  className={`inline-flex min-h-[44px] items-center border px-4 font-sans text-sm ${
                    n.id === negocio.id
                      ? 'border-azul-texto bg-azul-texto text-hueso'
                      : 'border-tinta/20 text-tinta/75 hover:border-azul hover:text-azul-texto'
                  }`}
                >
                  {n.nombre}
                </Link>
              ))}
            </nav>
          )}

          <section aria-labelledby="titulo-nuevo" className="mt-12 max-w-3xl border-t border-tinta/12 pt-8">
            <h2 id="titulo-nuevo" className="font-display text-2xl font-medium text-tinta">
              Agregar un cliente
            </h2>
            {/* Ley 1581: estos datos son de otras personas. Se dice acá, donde se escriben. */}
            <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
              Anota solo a quien te dio su número para que lo contactes. Estos datos los ves solo tú y
              puedes borrarlos cuando quieras.
            </p>
            <div className="mt-6">
              <FormularioCliente portafolioId={negocio.id} />
            </div>
          </section>

          {paraHoy.length > 0 && (
            <ListaClientes
              titulo="Para escribirles hoy"
              clientes={paraHoy}
              negocio={negocio}
              hoy={hoy}
              destacada
            />
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
              <p className="mt-12 max-w-xl border-t border-tinta/12 pt-8 font-sans text-tinta/65">
                Todavía no tienes clientes anotados. Empieza por quien te escribió esta semana.
              </p>
            )
          )}

          {clientes.length > 0 && (
            <p className="mt-10 font-sans text-xs text-tinta/60">
              {clientes.length} de {MAXIMO_CLIENTES} clientes · ¿Quieres escribir mejor tus
              mensajes?{' '}
              <Link href="/ventas/vende-mejor" className="underline decoration-azul underline-offset-4 hover:text-azul-texto">
                Mira la guía Vende mejor
              </Link>
            </p>
          )}
        </>
      )}
    </main>
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
    <section className="mt-12 border-t border-tinta/12 pt-8">
      <h2 className={`font-sans text-xs uppercase tracking-wider ${destacada ? 'text-morado-texto' : 'text-tinta/60'}`}>
        {titulo} · {clientes.length}
      </h2>
      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {clientes.map((c) => {
          const atrasado = c.proximo_contacto !== null && c.proximo_contacto < hoy;
          // El mensaje de "Seguimiento simple" de la guía Vende mejor, ya armado.
          const mensaje = `Hola, ${c.nombre}. Te escribo de ${negocio.nombre} por si todavía te interesa lo que conversamos. Si quieres, te ayudo a resolver cualquier duda.`;

          return (
            <li key={c.id} className={`border p-5 ${destacada ? 'border-azul' : 'border-tinta/12'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-medium text-tinta">{c.nombre}</h3>
                <span className="font-sans text-xs uppercase tracking-wider text-tinta/60">
                  {ETIQUETA_ETAPA[c.etapa]}
                </span>
              </div>

              {c.proximo_contacto && (
                <p className={`mt-1 font-sans text-sm ${atrasado ? 'text-azul-texto' : 'text-tinta/65'}`}>
                  {atrasado ? 'Tocaba escribirle el ' : c.proximo_contacto === hoy ? 'Escríbele hoy · ' : 'Escribirle el '}
                  {c.proximo_contacto === hoy ? '' : <span className="font-cifra">{fechaLegible(c.proximo_contacto)}</span>}
                </p>
              )}
              {c.nota && <p className="mt-3 whitespace-pre-line font-sans text-sm leading-relaxed text-tinta/75">{c.nota}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {c.telefono && (
                  <a
                    href={`${enlaceWhatsapp(c.telefono)}?text=${encodeURIComponent(mensaje)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center border border-azul-texto px-4 font-sans text-sm text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso"
                  >
                    Escribirle por WhatsApp →
                  </a>
                )}
                <BotonBorrarCliente id={c.id} nombre={c.nombre} />
              </div>

              <details className="mt-3 border-t border-tinta/10 pt-3">
                <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-sans text-sm text-tinta/70 hover:text-azul-texto">
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
