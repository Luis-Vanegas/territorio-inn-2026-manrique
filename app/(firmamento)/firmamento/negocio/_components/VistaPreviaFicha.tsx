import Image from 'next/image';
import Link from 'next/link';

import { grupoDeCategoria } from '@/lib/categorias/grupos';
import type { PortafolioAdmin } from '@/lib/db/portafolios.repo';
import { svgForma } from '@/components/mapa/formas';

/**
 * «Así te ven tus vecinos»: una vista previa de la ficha con los mismos datos que
 * la vitrina (foto, categoría con su forma, nombre, descripción, barrio y medios
 * de pago). La categoría va con su forma además del color (DESIGN.md ›
 * Categorías). La tarjeta es de día (`.modo-dia`) como en la vitrina: es lo que ve el
 * visitante. Solo se enlaza a la ficha real si está publicada: una pendiente no
 * existe todavía en la vitrina y el enlace llevaría a la lista.
 */
const MEDIOS: Record<string, string> = {
  efectivo: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transferencia: 'Transferencia',
  datafono: 'Datáfono',
};

export function VistaPreviaFicha({ portafolio }: { portafolio: PortafolioAdmin }) {
  const grupo = grupoDeCategoria(portafolio.categoria_id);
  const publicada = portafolio.estado === 'aprobado';
  const medios = portafolio.medios_pago.map((m) => MEDIOS[m] ?? m);

  return (
    <article
      aria-label={`Vista previa de la ficha de ${portafolio.nombre}`}
      className="modo-dia overflow-hidden rounded-xl bg-hueso text-tinta"
    >
      {portafolio.foto_url ? (
        <div className="relative aspect-[16/9] w-full bg-tinta/10">
          <Image
            src={portafolio.foto_url}
            alt={`Foto de ${portafolio.nombre}`}
            fill
            sizes="(min-width: 1024px) 380px, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-tinta/10 px-4 text-center font-sans text-sm text-tinta/70">
          Aún no tienes foto. Con una, te reconocen al llegar.
        </div>
      )}

      <div className="p-4">
        <p className="flex items-center gap-1.5 font-sans text-xs font-medium uppercase tracking-wide text-morado-texto">
          <span aria-hidden="true" className="inline-flex" dangerouslySetInnerHTML={{ __html: svgForma(grupo, 16) }} />
          {portafolio.categoria_otra || portafolio.categoria_nombre}
        </p>
        <h3 className="mt-1 font-display text-2xl font-medium leading-tight">{portafolio.nombre}</h3>
        {portafolio.descripcion && (
          <p className="mt-2 line-clamp-4 font-sans text-sm leading-relaxed text-tinta/80">{portafolio.descripcion}</p>
        )}
        <p className="mt-2 font-sans text-sm text-tinta/70">
          {portafolio.direccion} · {portafolio.barrio}
          {medios.length > 0 && <> · {medios.join(', ')}</>}
        </p>

        {publicada ? (
          <Link
            href={`/aliados#${portafolio.id}`}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-azul-texto px-4 font-sans text-sm font-medium text-hueso"
          >
            Ver ficha en Constelaciones
          </Link>
        ) : (
          <p className="mt-4 font-sans text-sm text-tinta/70">
            Todavía no está en el mapa: aparece apenas la aprobemos.
          </p>
        )}
      </div>
    </article>
  );
}
