import Link from 'next/link';

import type { FilaBitacora } from '@/lib/db/bitacora.repo';

/**
 * La bitácora leída como frases (Resumen › Actividad reciente y Moderación ›
 * Historial). Guarda NOMBRES de campos, nunca valores: aquí se traducen a
 * palabras; un nombre que no esté en la tabla se muestra tal cual.
 */

const ACCION: Record<string, string> = {
  registrado: 'se registró',
  ficha_editada: 'editó la ficha',
  categoria_corregida: 'corrigió la categoría',
  categoria_mantenida: 'mantuvo la categoría',
  negocio_vinculado: 'vinculó una cuenta',
  negocio_desvinculado: 'desvinculó la cuenta',
  convocatoria_propuesta: 'propuso la convocatoria',
  aprobado: 'aprobó y publicó',
  rechazado: 'rechazó',
  archivado: 'archivó',
  convocatoria_aprobada: 'aprobó la convocatoria',
  convocatoria_descartada: 'descartó la convocatoria',
  convocatoria_vencida: 'marcó vencida la convocatoria',
};

const CAMPO: Record<string, string> = {
  nombre: 'nombre',
  descripcion: 'descripción',
  categoria_id: 'categoría',
  categoria_otra: 'texto de «Otros»',
  direccion: 'dirección',
  barrio: 'barrio',
  ubicacion: 'ubicación',
  punto_referencia: 'punto de referencia',
  whatsapp: 'WhatsApp',
  correo: 'correo',
  instagram: 'Instagram',
  facebook: 'Facebook',
  horario: 'horario',
  medios_pago: 'medios de pago',
  productos: 'productos',
  foto: 'foto',
  menu: 'menú',
  estado: 'estado',
  categorias: 'categorías',
  aplica_formalidad: 'formalidad',
};

export const textoCampos = (campos: readonly string[]) => campos.map((c) => CAMPO[c] ?? c).join(', ');

const QUIEN: Record<FilaBitacora['actor_tipo'], string> = {
  negocio: 'El negocio',
  equipo: 'El equipo',
  entidad: 'Una entidad',
  sistema: 'El sistema',
};

function quien(f: FilaBitacora): string {
  // El equipo firma con su correo; un negocio, con su id de usuario o nada: no se muestra.
  return f.actor_tipo === 'equipo' && f.actor ? f.actor : QUIEN[f.actor_tipo];
}

export function ListaBitacora({ filas }: { filas: readonly FilaBitacora[] }) {
  return (
    <ol className="flex flex-col">
      {filas.map((f) => (
        <li
          key={f.id}
          className="grid gap-x-4 gap-y-1 border-t border-tinta/12 py-3 first:border-t-0 first:pt-0 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
        >
          <time dateTime={f.creado_en.replace(' ', 'T')} className="font-sans text-xs leading-6 text-tinta/70 tabular-nums">
            {f.creado_en}
          </time>
          <p className="min-w-0 break-words font-sans text-sm leading-6 text-tinta">
            {quien(f)} {ACCION[f.accion] ?? f.accion}
            {f.portafolio_id && (
              <>
                {' '}
                <Link
                  href={`/firmamento/equipo/aliados?ficha=${f.portafolio_id}`}
                  className="text-azul-texto underline underline-offset-4"
                >
                  {f.portafolio_nombre ?? 'una ficha'}
                </Link>
              </>
            )}
            {f.campos.length > 0 && f.accion !== 'aprobado' && f.accion !== 'rechazado' && f.accion !== 'archivado' && (
              <span className="text-tinta/70"> · {textoCampos(f.campos)}</span>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
