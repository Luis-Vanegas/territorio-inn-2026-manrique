import { Estrella } from '@/components/firmamento/Estrella';

/**
 * Cabecera de cada página del panel de entidad: el nombre de la entidad (el
 * `<h1>` de la barra superior dice la sección, no quién eres) y una frase de lo
 * que se puede ver aquí. No es un encabezado: el esquema de títulos de la página
 * sigue siendo h1 (sección) y h2 (partes).
 */
export function EncabezadoEntidad({ entidad, children }: { entidad: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="flex items-center gap-2.5 font-display text-2xl font-medium leading-tight text-tinta sm:text-3xl">
        <Estrella tamano={20} className="shrink-0" />
        <span className="min-w-0 break-words">{entidad}</span>
      </p>
      <p className="mt-3 font-sans text-base leading-relaxed text-tinta/70">{children}</p>
    </div>
  );
}
