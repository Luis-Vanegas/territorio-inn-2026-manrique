'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { DefinicionCampo, TipoCampoPersonalizado } from '@/lib/db/camposPersonalizados.repo';
import type { EstadoCampo } from '@/lib/actions/camposPersonalizados';
import { CampoFormulario } from '@/components/CampoFormulario';

const TIPOS: { valor: TipoCampoPersonalizado; etiqueta: string }[] = [
  { valor: 'texto', etiqueta: 'Texto corto' },
  { valor: 'numero', etiqueta: 'Número' },
  { valor: 'si_no', etiqueta: 'Sí / No' },
  { valor: 'seleccion', etiqueta: 'Selección (opciones fijas)' },
];

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-sm text-tinta ' +
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0';

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-terracota-texto bg-terracota-texto px-4 py-2 font-mono text-xs text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Guardando…' : children}
    </button>
  );
}

/**
 * Formulario de alta y edición, en un solo componente.
 *
 * En modo edición el tipo no se puede tocar: es la clave con la que ya se
 * guardaron valores en registros existentes, y cambiarlo los dejaría
 * huérfanos. Para cambiar el tipo, la vía es desactivar este campo y crear
 * uno nuevo — más trabajo, pero no corrompe datos que ya existen.
 */
export function FormularioCampo({
  accion,
  campoExistente,
  alGuardar,
}: {
  accion: (estado: EstadoCampo, formData: FormData) => Promise<EstadoCampo>;
  campoExistente?: DefinicionCampo;
  alGuardar?: () => void;
}) {
  const [estado, ejecutar] = useActionState<EstadoCampo, FormData>(accion, { estado: 'inicial' });
  const [tipo, setTipo] = useState<TipoCampoPersonalizado>(campoExistente?.tipo ?? 'texto');

  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};

  // Efecto, no una llamada directa en el render: reaccionar a un cambio de
  // estado con un efecto secundario (cerrar el formulario) es exactamente
  // para lo que existe useEffect.
  useEffect(() => {
    if (estado.estado === 'ok') alGuardar?.();
  }, [estado, alGuardar]);

  return (
    <form action={ejecutar} className="flex flex-col gap-5">
      {campoExistente && <input type="hidden" name="id" value={campoExistente.id} />}

      {estado.estado === 'error' && estado.mensaje && (
        <p role="alert" className="font-mono text-xs text-terracota-texto">
          {estado.mensaje}
        </p>
      )}

      <CampoFormulario
        id="campo-etiqueta"
        etiqueta="Etiqueta"
        requerido
        ayuda={
          campoExistente
            ? undefined
            : 'El identificador interno se genera solo a partir de esto y no cambia después.'
        }
        errores={errores.etiqueta}
      >
        {(p) => (
          <input
            {...p}
            name="etiqueta"
            type="text"
            required
            maxLength={80}
            defaultValue={campoExistente?.etiqueta}
            placeholder="Horario de atención"
            className={claseInput}
          />
        )}
      </CampoFormulario>

      {/* En edición el tipo no es un control sino un dato fijo, así que va como
          texto y no como <label>: una etiqueta sin campo que etiquetar es
          justamente lo que confunde al lector de pantalla. */}
      {campoExistente ? (
        <div>
          <p className="block font-sans text-sm font-medium text-tinta">Tipo de dato</p>
          <p className="mt-2 font-mono text-sm text-tinta/70">
            {TIPOS.find((t) => t.valor === campoExistente.tipo)?.etiqueta}
            <span className="ml-2 text-xs text-tinta/35">(no se puede cambiar)</span>
          </p>
        </div>
      ) : (
        <CampoFormulario id="campo-tipo" etiqueta="Tipo de dato" requerido>
          {(p) => (
            <select
              {...p}
              name="tipo"
              required
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCampoPersonalizado)}
              className={claseInput}
            >
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          )}
        </CampoFormulario>
      )}

      {tipo === 'seleccion' && (
        <CampoFormulario
          id="campo-opciones"
          etiqueta="Opciones (una por línea)"
          requerido
          errores={errores.opciones}
        >
          {(p) => (
            <textarea
              {...p}
              name="opciones"
              rows={4}
              required
              defaultValue={campoExistente?.opciones?.join('\n')}
              placeholder={'Sí\nNo\nA veces'}
              className={`${claseInput} resize-y font-mono`}
            />
          )}
        </CampoFormulario>
      )}

      {/* Sin "(opcional)" escrito a mano: lo pone CampoFormulario al omitir
          `requerido`, y así todos los formularios del sitio lo dicen igual. */}
      <CampoFormulario id="campo-ayuda" etiqueta="Texto de ayuda">
        {(p) => (
          <input
            {...p}
            name="ayuda"
            type="text"
            maxLength={200}
            defaultValue={campoExistente?.ayuda ?? ''}
            placeholder="Aparece debajo del campo, en el formulario público"
            className={claseInput}
          />
        )}
      </CampoFormulario>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="requerido"
          defaultChecked={campoExistente?.requerido}
          className="h-4 w-4 accent-terracota"
        />
        <span className="font-sans text-sm text-tinta/75">Obligatorio</span>
      </label>

      <div className="flex gap-2">
        <Boton>{campoExistente ? 'Guardar cambios' : 'Crear campo'}</Boton>
      </div>
    </form>
  );
}
