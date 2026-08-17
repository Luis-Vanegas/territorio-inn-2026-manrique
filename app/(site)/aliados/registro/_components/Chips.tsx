'use client';

/**
 * Chips de selección: el mismo lenguaje visual que el botón "Usar mi
 * ubicación actual" (borde terracota, relleno al seleccionar), pero
 * implementado sobre inputs nativos (radio/checkbox) ocultos con `sr-only`
 * en vez de `display:none` — así siguen siendo enfocables por teclado y
 * viajan en el FormData sin JS extra. Un div con onClick no manda nada si
 * el usuario tiene JS deshabilitado o el hidratado falla a mitad de carga.
 *
 * Objetivo táctil mínimo 44px de alto: esto se llena desde el celular.
 */

// text-sm (14px), no text-xs: esto es lo que la persona lee para elegir una
// opción, no una etiqueta decorativa — el tamaño chico es justo lo que se
// quejó de ver en el celular.
const claseChip =
  'flex min-h-11 cursor-pointer select-none items-center justify-center border px-4 py-3 text-center ' +
  'font-mono text-sm leading-snug transition-colors ' +
  'peer-checked:border-terracota peer-checked:bg-terracota peer-checked:text-hueso ' +
  'peer-focus-visible:ring-2 peer-focus-visible:ring-terracota peer-focus-visible:ring-offset-2 ' +
  'border-tinta/20 text-tinta/70 hover:border-tinta/40';

type Opcion = { valor: string; etiqueta: string };

/** Lo que `Campo` le pasa a sus hijos — mismo contrato que un input suelto. */
type PropsCampo = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
};

export function ChipsUnica({
  name,
  opciones,
  valor,
  alCambiar,
  requerido,
  id,
  ...aria
}: {
  name: string;
  opciones: Opcion[];
  valor: string;
  alCambiar: (v: string) => void;
  requerido?: boolean;
} & PropsCampo) {
  return (
    <div id={id} className="flex flex-wrap gap-2" role="radiogroup" {...aria}>
      {opciones.map((op) => (
        <label key={op.valor} className="relative">
          <input
            type="radio"
            name={name}
            value={op.valor}
            checked={valor === op.valor}
            required={requerido}
            onChange={(e) => alCambiar(e.target.value)}
            className="peer sr-only"
          />
          <span className={claseChip}>{op.etiqueta}</span>
        </label>
      ))}
    </div>
  );
}

export function ChipsMultiple({
  name,
  opciones,
  valores,
  alCambiar,
  id,
  ...aria
}: {
  name: string;
  opciones: Opcion[];
  valores: string[];
  alCambiar: (v: string[]) => void;
} & PropsCampo) {
  const alternar = (valor: string, marcado: boolean) => {
    if (marcado) {
      alCambiar(valores.includes(valor) ? valores : [...valores, valor]);
    } else {
      alCambiar(valores.filter((v) => v !== valor));
    }
  };

  return (
    <div id={id} className="flex flex-wrap gap-2" role="group" {...aria}>
      {opciones.map((op) => (
        <label key={op.valor} className="relative">
          <input
            type="checkbox"
            name={name}
            value={op.valor}
            checked={valores.includes(op.valor)}
            onChange={(e) => alternar(op.valor, e.target.checked)}
            className="peer sr-only"
          />
          <span className={claseChip}>{op.etiqueta}</span>
        </label>
      ))}
    </div>
  );
}
