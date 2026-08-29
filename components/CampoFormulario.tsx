// Etiqueta + ayuda + control + error, con todo asociado como corresponde.
//
// ── Por qué existe este archivo ──
//
// Había tres copias de este componente, una por formulario. Una estaba bien
// hecha; las otras dos ponían la <label> como HERMANA del campo, sin htmlFor
// y sin envolverlo. Para el navegador eso no es una etiqueta de nada: el campo
// se queda sin nombre accesible y el lector de pantalla, al no encontrarlo,
// lee el placeholder. Es decir, en "Nombre" la persona ciega escuchaba
// "Juan Pablo Gómez" y podía creer que el campo ya estaba lleno.
//
// Falla WCAG 1.3.1, 3.3.2 y 4.1.2, las tres de nivel A. Y de paso hacía que
// tocar la etiqueta no enfocara el campo, que es el área de clic grande que
// necesita quien tiene dificultades motrices.
//
// La copia rota nació de copiar el formulario de al lado, igual que el voseo
// de lib/actions. Por eso la corrección no es parchear dos archivos: es que
// quede UNA sola copia y no haya de dónde copiar mal.
//
// ── El contrato ──
//
// `children` es una función y no un nodo a propósito: recibe el id y los
// aria-* ya calculados y los aplica al control con {...p}. Es la única forma
// de garantizar que la asociación exista, porque el componente no puede
// alcanzar un elemento que le llega ya construido.
//
// `requerido` se omite en los campos opcionales, que muestran el distintivo.
// El texto de la etiqueta nunca dice "(opcional)": eso lo pone el componente,
// para que todos los formularios lo digan igual.

export function CampoFormulario({
  id,
  etiqueta,
  ayuda,
  requerido,
  errores,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  requerido?: boolean;
  errores?: string[];
  children: (p: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
  }) => React.ReactNode;
}) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = errores?.length ? `${id}-error` : undefined;
  const describedBy = [idAyuda, idError].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="block font-sans text-sm font-medium text-tinta">
        {etiqueta}
        {!requerido && (
          <span className="ml-2 font-mono text-sm font-normal text-tinta/65">
            opcional
          </span>
        )}
      </label>

      {ayuda && (
        <p id={idAyuda} className="mt-1.5 font-sans text-sm leading-snug text-tinta/65">
          {ayuda}
        </p>
      )}

      <div className="mt-2.5">
        {children({
          id,
          ...(describedBy ? { 'aria-describedby': describedBy } : {}),
          ...(errores?.length ? { 'aria-invalid': true as const } : {}),
        })}
      </div>

      {errores?.length ? (
        <p id={idError} className="mt-1.5 font-mono text-sm text-terracota-texto">
          {errores[0]}
        </p>
      ) : null}
    </div>
  );
}
