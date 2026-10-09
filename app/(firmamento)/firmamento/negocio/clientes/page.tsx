import type { Metadata } from 'next';
import Link from 'next/link';

import { Plegable } from '@/components/firmamento/Plegable';
import { CLASE_BOTON_PANEL, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { enlaceWhatsapp, esCelularColombiano } from '@/lib/contacto';
import { listarClientes, MAXIMO_CLIENTES, type ClienteNegocio } from '@/lib/db/clientes.repo';
import { negociosDe } from '@/lib/db/usuarios.repo';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { ETAPAS_CERRADAS, ETIQUETA_ETAPA } from '@/lib/validation/cliente.schema';
import { SelectorNegocio } from '../_components/SelectorNegocio';
import { SinNegocio } from '../_components/SinNegocio';
import { BotonBorrarCliente, FormularioCliente } from './_components/FormularioCliente';

export const metadata: Metadata = { title: 'Mis clientes' };

export const dynamic = 'force-dynamic';

/** Hoy en Medellín, 'YYYY-MM-DD'. El servidor corre en UTC: a las 8 p. m. de acá allá ya es mañana. */
function hoyEnColombia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

function cerrado(c: ClienteNegocio): boolean {
  return ETAPAS_CERRADAS.includes(c.etapa);
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
    // negocioActivo ya descartó los archivados: si la cuenta tiene alguno, decirle
    // «registra tu negocio» sonaría a que nunca lo hizo.
    const tieneArchivados = (await negociosDe(usuarioId)).length > 0;
    return (
      <SinNegocio
        aviso={
          tieneArchivados
            ? 'Tu negocio está archivado, así que su lista de clientes ya no se puede usar. Para llevar tus clientes, registra un negocio activo.'
            : 'Para llevar tus clientes primero registra tu negocio.'
        }
      />
    );
  }

  // El repo filtra por la cuenta de la sesión: un id ajeno no devuelve nada.
  const clientes = await listarClientes(usuarioId, negocio.id);
  const hoy = hoyEnColombia();
  // Lo que ya tocaba (o toca hoy) y no se cerró: es lo primero que hay que ver.
  const paraHoy = clientes.filter((c) => !cerrado(c) && c.proximo_contacto && c.proximo_contacto <= hoy);
  // Los cerrados al final: ya no hay venta que perseguir. sort es estable y
  // conserva el orden por fecha del repo dentro de cada grupo.
  const resto = clientes
    .filter((c) => !paraHoy.includes(c))
    .sort((a, b) => Number(cerrado(a)) - Number(cerrado(b)));

  return (
    <div className="flex flex-col gap-5">
      <SelectorNegocio negocios={negocios} actual={negocio} />

      <p className="max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
        Anota a quién le vendiste o quién te preguntó, y cuándo volver a escribirle. Así no se te pierde ninguna venta
        por falta de seguimiento.
      </p>

      {/* Sin clientes el formulario va abierto: es lo único que hay por hacer. */}
      <Tarjeta titulo="Agregar un cliente" id="titulo-nuevo" plegable abierta={clientes.length === 0}>
        {/* Ley 1581: estos datos son de otras personas. Se dice acá, donde se escriben. */}
        <p className="max-w-xl font-sans text-sm leading-relaxed text-tinta/70">
          Anota solo a quien te dio su número para que lo contactes. Estos datos los ves solo tú y puedes borrarlos
          cuando quieras.
        </p>
        <div className="mt-5 max-w-3xl">
          <FormularioCliente key={negocio.id} portafolioId={negocio.id} />
        </div>
      </Tarjeta>

      {paraHoy.length > 0 && (
        <ListaClientes
          titulo="Para escribirles hoy"
          id="para-hoy"
          clientes={paraHoy}
          negocio={negocio}
          hoy={hoy}
        />
      )}

      {resto.length > 0 ? (
        <ListaClientes
          titulo={paraHoy.length > 0 ? 'El resto de tu lista' : 'Tu lista'}
          id="resto"
          clientes={resto}
          negocio={negocio}
          hoy={hoy}
        />
      ) : (
        clientes.length === 0 && (
          <p className="max-w-xl font-sans text-base leading-relaxed text-tinta/70">
            Todavía no tienes clientes anotados. Empieza por quien te escribió esta semana.
          </p>
        )
      )}

      {clientes.length > 0 && (
        <p className="font-sans text-sm text-tinta/70">
          <span className="tabular-nums">
            {clientes.length} de {MAXIMO_CLIENTES}
          </span>{' '}
          clientes · ¿Quieres escribir mejor tus mensajes?{' '}
          <Link
            href="/ventas/vende-mejor"
            className="inline-flex min-h-[44px] items-center text-azul-texto underline underline-offset-4"
          >
            Mira la guía Vende mejor
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * Una `Tarjeta` por grupo y, adentro, una fila plegable por cliente (la misma
 * `Plegable` de todo el panel): cerradas se ve el nombre, la etapa y cuándo
 * escribirle; abiertas, la nota, el WhatsApp y la edición.
 */
function ListaClientes({
  titulo,
  id,
  clientes,
  negocio,
  hoy,
}: {
  titulo: string;
  id: string;
  clientes: ClienteNegocio[];
  negocio: { id: string; nombre: string };
  hoy: string;
}) {
  return (
    <Tarjeta titulo={titulo} id={id} resumen={clientes.length}>
      <ul className="divide-y divide-tinta/12">
        {clientes.map((c) => {
          // Un cliente cerrado no se persigue: ni atrasado ni fecha a la vista.
          const fecha = cerrado(c) ? null : c.proximo_contacto;
          const atrasado = fecha !== null && fecha < hoy;
          // El mensaje de "Seguimiento simple" de la guía Vende mejor, ya armado.
          const mensaje = `Hola, ${c.nombre}. Te escribo de ${negocio.nombre} por si todavía te interesa lo que conversamos. Si quieres, te ayudo a resolver cualquier duda.`;

          return (
            <li key={c.id} className="min-w-0">
              <Plegable
                className="group"
                claseResumen="flex min-h-[56px] items-center justify-between gap-4 py-2"
                claseContenido="pb-4"
                resumen={
                  <>
                    <span className="min-w-0">
                      <span className="block break-words font-sans text-base font-medium text-tinta">{c.nombre}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-sm text-tinta/70">
                        <span className="rounded border border-tinta/55 px-2 py-0.5 text-xs">{ETIQUETA_ETAPA[c.etapa]}</span>
                        {fecha && (
                          <span className={atrasado ? 'font-medium text-azul-texto' : ''}>
                            {atrasado ? 'Tocaba escribirle el ' : fecha === hoy ? 'Escríbele hoy' : 'Escribirle el '}
                            {fecha !== hoy && <span className="tabular-nums">{fechaLegible(fecha)}</span>}
                          </span>
                        )}
                      </span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 font-sans text-xl leading-none text-tinta/70">
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">−</span>
                    </span>
                  </>
                }
              >
                {c.nota && (
                  <p className="whitespace-pre-line break-words font-sans text-sm leading-relaxed text-tinta">{c.nota}</p>
                )}

                <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${c.nota ? 'mt-4' : ''}`}>
                  {/* Un fijo no tiene WhatsApp: el botón abriría un chat que no le llega a nadie. */}
                  {c.telefono && esCelularColombiano(c.telefono) && (
                    <a
                      href={`${enlaceWhatsapp(c.telefono)}?text=${encodeURIComponent(mensaje)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={CLASE_BOTON_PANEL}
                    >
                      Escribirle por WhatsApp
                      <span className="sr-only"> a {c.nombre} (se abre en otra pestaña)</span>
                    </a>
                  )}
                  <BotonBorrarCliente id={c.id} nombre={c.nombre} />
                </div>

                <div className="mt-4 border-t border-tinta/12 pt-4">
                  <p className="mb-4 font-sans text-sm font-medium text-tinta">Editar o cambiar la fecha</p>
                  <FormularioCliente portafolioId={negocio.id} cliente={c} />
                </div>
              </Plegable>
            </li>
          );
        })}
      </ul>
    </Tarjeta>
  );
}
