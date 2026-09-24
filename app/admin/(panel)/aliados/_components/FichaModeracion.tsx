'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';
import { useFormStatus } from 'react-dom';

import {
  moderarPortafolio,
  type EstadoModeracion,
} from '@/lib/actions/moderarPortafolio';
import { editarPortafolioModerador } from '@/lib/actions/editarPortafolioModerador';
import type { Categoria, EstadoPortafolio, PortafolioAdmin } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import { formatearCamposExtra } from '@/lib/camposExtra';
import { FormularioEdicionPortafolio } from '@/components/FormularioEdicionPortafolio';
import { BadgeEstado, type TonoBadge } from '@/components/admin/BadgeEstado';
import { FotoAmpliable } from '@/components/FotoAmpliable';

const ESTADO_INICIAL: EstadoModeracion = { estado: 'inicial' };

function Boton({
  accion,
  etiqueta,
  variante,
  confirmar,
}: {
  accion: string;
  etiqueta: string;
  variante: 'primaria' | 'secundaria';
  /** Si viene, pide confirmación antes de dejar pasar el submit. */
  confirmar?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="accion"
      value={accion}
      disabled={pending}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={[
        'border px-4 py-2 font-sans text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variante === 'primaria'
          ? 'border-azul-texto bg-azul-texto text-hueso hover:bg-transparent hover:text-azul-texto'
          : 'border-tinta/20 text-tinta/65 hover:border-azul-texto hover:text-azul-texto',
      ].join(' ')}
    >
      {etiqueta}
    </button>
  );
}

const ETIQUETA_HORARIO: Record<string, string> = {
  mananas: 'Mañanas',
  tardes: 'Tardes',
  noches: 'Noches',
  fines_semana: 'Fines de semana',
  bajo_pedido: 'Bajo pedido o cita',
};
const ETIQUETA_MEDIO_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transferencia: 'Transferencia',
  datafono: 'Datáfono',
};

const ETIQUETA_ESTADO: Record<EstadoPortafolio, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Publicado',
  rechazado: 'Rechazado',
  archivado: 'Archivado',
};

const TONO_ESTADO: Record<EstadoPortafolio, TonoBadge> = {
  pendiente: 'neutral',
  aprobado: 'positivo',
  rechazado: 'negativo',
  archivado: 'atenuado',
};

/** timeZone fijo: servidor (UTC) y navegador del moderador (Colombia) arman
 * textos distintos para la misma fecha si no se fija, y React tira un error
 * de hidratación (#418) al notar que no coinciden. El replace es por lo
 * mismo: el ICU de Node y el de Chrome separan "9:17 p. m." con espacios
 * distintos — el texto se ve igual y React igual lo marca como distinto. */
function formatFechaCo(iso: string): string {
  return new Date(iso)
    .toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    })
    .replace(/\s/g, ' ');
}

/** Solo los campos con valor: una lista con cinco "—" no informa nada. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
        {etiqueta}
      </dt>
      <dd className="font-sans text-sm text-tinta/75">{valor}</dd>
    </div>
  );
}

export function FichaModeracion({
  portafolio,
  definicionesCampos,
  categorias,
}: {
  portafolio: PortafolioAdmin;
  definicionesCampos: DefinicionCampo[];
  categorias: Categoria[];
}) {
  const [estado, accion] = useActionState(moderarPortafolio, ESTADO_INICIAL);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [editando, setEditando] = useState(false);
  const camposExtra = formatearCamposExtra(portafolio.campos_extra, definicionesCampos);

  // Aprobado o rechazado, la ficha desaparece de la lista al revalidar.
  // Este mensaje cubre el instante entre la respuesta y el refresco.
  if (estado.estado === 'ok') {
    return (
      <article className="border-t border-tinta/12 py-6">
        <p className="font-sans text-xs text-azul-texto">
          {portafolio.nombre} — {estado.mensaje}
        </p>
      </article>
    );
  }

  return (
    <article className="border-t border-tinta/12 py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-xs uppercase tracking-wider text-morado-texto">
              {portafolio.categoria_nombre}
            </span>
            <BadgeEstado etiqueta={ETIQUETA_ESTADO[portafolio.estado]} tono={TONO_ESTADO[portafolio.estado]} />
          </div>

          <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-tinta">
            {portafolio.nombre}
          </h3>

          {portafolio.moderado_por && portafolio.moderado_en && (
            <p className="mt-1 font-sans text-xs text-tinta/60">
              {ETIQUETA_ESTADO[portafolio.estado]} por {portafolio.moderado_por} ·{' '}
              {formatFechaCo(portafolio.moderado_en)}
            </p>
          )}

          {portafolio.estado === 'rechazado' && portafolio.motivo_rechazo && (
            <p className="mt-3 max-w-prose border-l-2 border-amarillo bg-amarillo/10 px-4 py-3 font-sans text-sm leading-relaxed text-tinta">
              {portafolio.motivo_rechazo}
            </p>
          )}

          {portafolio.descripcion && (
            <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-tinta/70">
              {portafolio.descripcion}
            </p>
          )}

          <dl className="mt-5 flex flex-col gap-1.5">
            <Dato etiqueta="Dirección" valor={portafolio.direccion} />
            <Dato etiqueta="Barrio" valor={portafolio.barrio} />
            <Dato etiqueta="Referencia" valor={portafolio.punto_referencia} />
            <Dato
              etiqueta="Coords"
              valor={`${portafolio.latitud.toFixed(6)}, ${portafolio.longitud.toFixed(6)}`}
            />
            <Dato etiqueta="Otra categoría" valor={portafolio.categoria_otra} />
            <Dato etiqueta="WhatsApp" valor={portafolio.whatsapp} />
            <Dato etiqueta="Teléfono" valor={portafolio.telefono} />
            <Dato etiqueta="Correo" valor={portafolio.correo} />
            <Dato etiqueta="Instagram" valor={portafolio.instagram} />
            <Dato etiqueta="Facebook" valor={portafolio.facebook} />
            <Dato
              etiqueta="Horario"
              valor={
                portafolio.horario.length > 0
                  ? portafolio.horario.map((h) => ETIQUETA_HORARIO[h] ?? h).join(', ')
                  : null
              }
            />
            <Dato
              etiqueta="Pagos"
              valor={
                portafolio.medios_pago.length > 0
                  ? portafolio.medios_pago.map((m) => ETIQUETA_MEDIO_PAGO[m] ?? m).join(', ')
                  : null
              }
            />
            <Dato etiqueta="Recibido" valor={formatFechaCo(portafolio.creado_en)} />
            {camposExtra.map((c) => (
              <Dato key={c.etiqueta} etiqueta={c.etiqueta} valor={c.valor} />
            ))}
          </dl>

          {portafolio.productos.length > 0 && (
            <dl className="mt-4 flex flex-col gap-1">
              {portafolio.productos.map((prod) => (
                <div key={prod.nombre} className="flex gap-3">
                  <dt className="w-24 shrink-0 font-sans text-xs uppercase tracking-wide text-tinta/60">
                    Producto
                  </dt>
                  <dd className="font-sans text-sm text-tinta/75">
                    {prod.nombre}
                    {prod.precio && <span className="text-tinta/60"> — {prod.precio}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:w-56">
          {portafolio.foto_url && (
            <FotoAmpliable
              src={portafolio.foto_url}
              alt={`Foto enviada por ${portafolio.nombre}`}
              className="relative block aspect-[4/3] w-full overflow-hidden bg-tinta/5"
            >
              <Image
                src={portafolio.foto_url}
                alt={`Foto enviada por ${portafolio.nombre}`}
                fill
                sizes="224px"
                className="object-cover"
              />
            </FotoAmpliable>
          )}

          {portafolio.menu_url && (
            <a
              href={portafolio.menu_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-tinta/60 underline decoration-azul/40 underline-offset-4 hover:text-azul-texto"
            >
              Ver menú / flyer enviado ↗
            </a>
          )}
        </div>
      </div>

      {portafolio.estado !== 'archivado' && (
        <form action={accion} className="mt-6">
          <input type="hidden" name="id" value={portafolio.id} />

          {portafolio.estado === 'pendiente' && mostrarRechazo && (
            <div className="mb-4 max-w-xl">
              <label
                htmlFor={`motivo-${portafolio.id}`}
                className="block font-sans text-sm font-medium text-tinta"
              >
                Motivo del rechazo
              </label>
              <p className="mt-1 font-sans text-xs text-tinta/65">
                Lo va a leer el emprendedor. Explica qué corregir.
              </p>
              <textarea
                id={`motivo-${portafolio.id}`}
                name="motivo_rechazo"
                rows={3}
                minLength={10}
                className="mt-2 w-full border border-tinta/20 bg-transparent p-3 font-sans text-sm text-tinta focus:border-azul focus:outline-none"
              />
            </div>
          )}

          {estado.estado === 'error' && (
            <p role="alert" className="mb-3 font-sans text-xs text-azul-texto">
              {estado.mensaje}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {portafolio.estado === 'pendiente' &&
              (!mostrarRechazo ? (
                <>
                  <Boton accion="aprobar" etiqueta="Aprobar y publicar" variante="primaria" />
                  <button
                    type="button"
                    onClick={() => setMostrarRechazo(true)}
                    className="border border-tinta/20 px-4 py-2 font-sans text-xs text-tinta/65 transition-colors hover:border-azul-texto hover:text-azul-texto"
                  >
                    Rechazar…
                  </button>
                </>
              ) : (
                <>
                  <Boton accion="rechazar" etiqueta="Confirmar rechazo" variante="primaria" />
                  <button
                    type="button"
                    onClick={() => setMostrarRechazo(false)}
                    className="border border-tinta/20 px-4 py-2 font-sans text-xs text-tinta/65 transition-colors hover:border-azul-texto hover:text-azul-texto"
                  >
                    Cancelar
                  </button>
                </>
              ))}

            {portafolio.estado === 'aprobado' && (
              <>
                <button
                  type="button"
                  onClick={() => setEditando((v) => !v)}
                  className="border border-tinta/20 px-4 py-2 font-sans text-xs text-tinta/65 transition-colors hover:border-azul-texto hover:text-azul-texto"
                >
                  {editando ? 'Cerrar edición' : 'Editar ficha'}
                </button>
                <Boton
                  accion="archivar"
                  etiqueta="Archivar"
                  variante="secundaria"
                  confirmar="¿Archivar este registro? Se quita del mapa de Aliados."
                />
              </>
            )}

            {portafolio.estado === 'rechazado' && (
              <>
                <Boton accion="aprobar" etiqueta="Aprobar y publicar" variante="primaria" />
                <Boton
                  accion="archivar"
                  etiqueta="Archivar"
                  variante="secundaria"
                  confirmar="¿Archivar este registro?"
                />
              </>
            )}
          </div>
        </form>
      )}

      {editando && portafolio.estado === 'aprobado' && (
        <div className="mt-8 border-t border-tinta/12 pt-8">
          <FormularioEdicionPortafolio
            portafolio={portafolio}
            categorias={categorias}
            accion={editarPortafolioModerador.bind(null, portafolio.id)}
          />
        </div>
      )}
    </article>
  );
}
