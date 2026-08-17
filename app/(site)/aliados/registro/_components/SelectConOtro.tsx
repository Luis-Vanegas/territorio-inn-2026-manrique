'use client';

/**
 * Select nativo + campo de texto que aparece cuando se elige "Otro".
 *
 * El name del select y el del input de "otro" son el MISMO: cuando está en
 * modo "otro", lo que viaja en el FormData es el texto escrito, no la
 * palabra "Otro" — por eso el select en sí NO lleva `name` cuando está en
 * modo otro, y viceversa. Así nunca viajan dos valores con el mismo name
 * a la vez.
 */

const OTRO = 'Otro';

// Mismo estilo que `claseInput` en FormularioRegistro.tsx — duplicado acá
// a propósito: es una clase de Tailwind, no lógica, y este componente no
// depende de ese archivo.
const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-terracota';

export function SelectConOtro({
  id,
  name,
  opciones,
  valor,
  esOtro,
  alCambiar,
  placeholderOtro,
  ...aria
}: {
  id?: string;
  name: string;
  opciones: string[];
  valor: string;
  esOtro: boolean;
  alCambiar: (v: string, esOtro: boolean) => void;
  placeholderOtro?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}) {
  if (esOtro) {
    return (
      <div className="flex flex-col gap-1.5">
        <input
          {...aria}
          id={id}
          name={name}
          type="text"
          required
          maxLength={80}
          value={valor}
          placeholder={placeholderOtro}
          onChange={(e) => alCambiar(e.target.value, true)}
          className={claseInput}
        />
        <button
          type="button"
          onClick={() => alCambiar('', false)}
          className="self-start font-mono text-sm text-tinta/45 underline decoration-tinta/20 underline-offset-4 hover:text-terracota"
        >
          ← Elegir de la lista
        </button>
      </div>
    );
  }

  return (
    <select
      {...aria}
      id={id}
      name={name}
      required
      value={valor}
      onChange={(e) => {
        const v = e.target.value;
        alCambiar(v === OTRO ? '' : v, v === OTRO);
      }}
      className={claseInput}
    >
      <option value="">Elige un barrio…</option>
      {opciones.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
      <option value={OTRO}>{OTRO}</option>
    </select>
  );
}
