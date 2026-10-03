'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';

import { CompartirEnlace } from '@/components/firmamento/CompartirEnlace';
import { CLASE_BOTON_PANEL, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import {
  desvincularCuentaAction,
  vincularCuentaAction,
  type EstadoVinculo,
} from '@/lib/actions/vincularCuenta';

const INICIAL: EstadoVinculo = { estado: 'inicial' };

/** Id del `<datalist>` de cuentas: uno solo por página (lo pinta `ListaCuentas`), no uno por ficha. */
export const ID_LISTA_CUENTAS = 'cuentas-firmamento';

function Enviar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={CLASE_BOTON_PANEL}>
      {pending ? 'Guardando…' : texto}
    </button>
  );
}

function Mensaje({ estado }: { estado: EstadoVinculo }) {
  if (estado.estado === 'inicial') return null;
  return (
    <p
      role={estado.estado === 'error' ? 'alert' : 'status'}
      className={`mt-2 font-sans text-sm ${estado.estado === 'error' ? 'text-morado-texto' : 'text-azul-texto'}`}
    >
      {estado.mensaje}
    </p>
  );
}

/**
 * «Cuenta y acceso» de una ficha (panel del equipo): a qué cuenta de Google
 * está atado el negocio, vincularlo a una existente, soltarlo y «Enviar acceso»
 * (su enlace personal por WhatsApp; al abrirlo y entrar con Google queda
 * vinculado). El buscador es el `<datalist>` nativo: filtra por nombre y correo
 * sin JavaScript propio.
 *
 * Reasignar exige marcar la confirmación: el `where` del repo no pisa un dueño
 * sin ella, aunque alguien quite el `required` del navegador.
 */
export function AccesoNegocio({
  portafolioId,
  negocio,
  dueno,
  enlace,
  whatsapp,
}: {
  portafolioId: string;
  negocio: string;
  dueno: { nombre: string; correo: string } | null;
  /** /aliados/estado/<token>, absoluto. */
  enlace: string;
  whatsapp: string | null;
}) {
  const [estado, vincular] = useActionState(vincularCuentaAction, INICIAL);
  const [estadoSoltar, soltar] = useActionState(desvincularCuentaAction, INICIAL);
  const id = useId();

  const mensaje = `Hola. Este es el enlace personal de «${negocio}» en Constelaciones: ${enlace} — Ábrelo y toca «Continuar con Google» para manejar tu negocio desde tu panel. No lo compartas: con este enlace se puede editar tu ficha.`;

  return (
    <Tarjeta
      titulo="Cuenta y acceso"
      id={`${id}-titulo`}
      plegable
      resumen={dueno ? `en la cuenta de ${dueno.nombre}` : 'sin cuenta'}
      className="mb-8"
    >
      <div className="flex flex-col gap-6">
        {dueno ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 font-sans text-sm text-tinta">
              {dueno.nombre} <span className="break-all text-tinta/70">· {dueno.correo}</span>
            </p>
            <form
              action={soltar}
              onSubmit={(e) => {
                if (!window.confirm(`¿Quitar «${negocio}» de la cuenta de ${dueno.nombre}? Deja de verlo en su panel.`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="portafolio_id" value={portafolioId} />
              <Enviar texto="Desvincular" />
              <Mensaje estado={estadoSoltar} />
            </form>
          </div>
        ) : (
          <p className="font-sans text-sm text-tinta/70">
            Este negocio no está en ninguna cuenta. Vincúlalo a una que ya exista o envíale a la persona su enlace.
          </p>
        )}

        <form action={vincular}>
          <input type="hidden" name="portafolio_id" value={portafolioId} />
          <label htmlFor={`${id}-correo`} className="block font-sans text-sm font-medium text-tinta">
            {dueno ? 'Pasarlo a otra cuenta' : 'Vincular a una cuenta'}
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              id={`${id}-correo`}
              name="correo"
              type="email"
              required
              list={ID_LISTA_CUENTAS}
              autoComplete="off"
              placeholder="Busca por nombre o correo"
              aria-describedby={`${id}-ayuda`}
              className="block min-h-[44px] min-w-0 flex-1 basis-56 rounded-lg border border-tinta/55 bg-tinta/[0.03] px-3 font-sans text-base text-tinta placeholder:text-tinta/65"
            />
            <Enviar texto={dueno ? 'Reasignar' : 'Vincular'} />
          </div>
          <p id={`${id}-ayuda`} className="mt-1 font-sans text-sm text-tinta/70">
            Solo cuentas que ya entraron con Google. No uses el correo de la ficha: nadie lo verificó.
          </p>
          {dueno && (
            <label className="mt-2 flex min-h-[44px] items-center gap-2 font-sans text-sm text-tinta">
              <input type="checkbox" name="reasignar" value="si" required className="h-4 w-4 accent-azul" />
              Entiendo que {dueno.nombre} deja de manejar este negocio.
            </label>
          )}
          <Mensaje estado={estado} />
        </form>

        <div>
          <h3 className="font-sans text-sm font-medium text-tinta">Enviar acceso</h3>
          <p className="mt-1 font-sans text-sm text-tinta/70">
            {whatsapp ? 'Abre el chat con el WhatsApp de la ficha.' : 'La ficha no tiene WhatsApp: elige el chat al enviarlo.'}
          </p>
          <div className="mt-2">
            <CompartirEnlace mensaje={mensaje} numero={whatsapp} etiquetaWhatsapp="Enviar acceso por WhatsApp" />
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}

/** El `<datalist>` del buscador de cuentas, una sola vez por página. */
export function ListaCuentas({ cuentas }: { cuentas: readonly { id: string; nombre: string; correo: string }[] }) {
  return (
    <datalist id={ID_LISTA_CUENTAS}>
      {cuentas.map((c) => (
        <option key={c.id} value={c.correo} label={c.nombre} />
      ))}
    </datalist>
  );
}
