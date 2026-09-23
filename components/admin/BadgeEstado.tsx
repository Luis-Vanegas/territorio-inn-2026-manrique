// Badge de estado compartido entre las tres colas de moderación (Aliados,
// Empleo, Peticiones): antes cada ficha tenía su propia copia de este mismo
// span, así que el estado de un registro se veía distinto según en qué
// panel estuvieras. `tono` es genérico (no "aprobado" | "rechazado") porque
// cada dominio tiene sus propios nombres de estado — la ficha decide cuál
// tono le corresponde a cada uno.
//
// amarillo es "señal, solo fill" (AGENTS.md): nunca text-amarillo, siempre
// de fondo con texto en tinta.
export type TonoBadge = 'neutral' | 'positivo' | 'negativo' | 'atenuado';

const CLASE_TONO: Record<TonoBadge, string> = {
  neutral: 'border-tinta/20 text-tinta/65',
  positivo: 'border-azul-texto bg-azul/10 text-azul-texto',
  negativo: 'border-amarillo bg-amarillo/20 text-tinta',
  atenuado: 'border-tinta/15 bg-tinta/5 text-tinta/60',
};

export function BadgeEstado({ etiqueta, tono }: { etiqueta: string; tono: TonoBadge }) {
  return (
    <span
      className={`inline-block border px-2 py-0.5 font-mono text-xs uppercase tracking-wide ${CLASE_TONO[tono]}`}
    >
      {etiqueta}
    </span>
  );
}
