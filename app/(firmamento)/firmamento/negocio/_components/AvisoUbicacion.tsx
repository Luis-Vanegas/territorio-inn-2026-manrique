import Link from 'next/link';

import { CLASE_BOTON_PANEL } from '@/components/firmamento/panel/Tarjeta';
import { type RevisionUbicacion, ubicacionPorRevisar } from '@/lib/firmamento/ubicacion';
import { formatearNumero } from '@/lib/formato';

/**
 * «Revisa dónde quedó tu punto»: el punto cae fuera de la Comuna 3 o el barrio
 * que escogió no es donde cae el punto. Solo avisa: la ficha sigue como está y
 * nada se bloquea. Lleva directo al selector del mapa en «Mi ficha».
 * Marca «!» además del borde amarillo: el estado no depende solo del color.
 */
export function AvisoUbicacion({ revision, barrio }: { revision: RevisionUbicacion; barrio: string }) {
  if (!ubicacionPorRevisar(revision)) return null;
  const { dentro, metrosFuera, declarado, oficial } = revision;

  const lineas: string[] = [];
  if (!dentro) {
    lineas.push(
      `Tu punto en el mapa cae fuera de la Comuna 3, a unos ${formatearNumero(Math.round(metrosFuera))} m del límite. Si tu negocio está en Manrique, muévelo al lugar correcto.`,
    );
  }
  if (!declarado) {
    lineas.push(`«${barrio}» no es uno de los 15 barrios de la Comuna 3${oficial ? `; tu punto cae en ${oficial}` : ''}.`);
  } else if (oficial && declarado !== oficial) {
    lineas.push(`Escogiste ${declarado}, pero tu punto cae en ${oficial}. Puede estar mal el punto o el barrio.`);
  }

  return (
    <div className="rounded-xl border border-amarillo bg-hueso p-4">
      <p className="font-sans text-base font-medium text-tinta">
        <span aria-hidden="true" className="mr-2 text-morado-texto">!</span>
        Revisa dónde quedó tu negocio
      </p>
      {lineas.map((l) => (
        <p key={l} className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
          {l}
        </p>
      ))}
      <Link href="/firmamento/negocio/ficha#ubicacion" className={`${CLASE_BOTON_PANEL} mt-3`}>
        Mover mi punto
      </Link>
    </div>
  );
}
