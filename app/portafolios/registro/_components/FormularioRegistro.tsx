'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';

import {
  registrarPortafolio,
  type EstadoRegistro,
} from '@/lib/actions/registrarPortafolio';
import { TAMANO_MAX_FOTO } from '@/lib/validation/portafolio.schema';
import type { Categoria } from '@/lib/db/portafolios.repo';
import type { Posicion } from './SelectorUbicacionClient';

const SelectorUbicacion = dynamic(() => import('./SelectorUbicacionClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full items-center justify-center border border-tinta/15 bg-tinta/[0.02] sm:h-[580px]">
      <span className="font-mono text-xs text-tinta/40">cargando mapa…</span>
    </div>
  ),
});

const ESTADO_INICIAL: EstadoRegistro = { estado: 'inicial' };

// ─── piezas ──────────────────────────────────────────────────

function Seccion({
  numero,
  titulo,
  ayuda,
  completa,
  ancho = 'angosto',
  children,
}: {
  numero: string;
  titulo: string;
  ayuda?: string;
  completa?: boolean;
  ancho?: 'angosto' | 'completo';
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-tinta/12 pt-8">
      <legend className="sr-only">{titulo}</legend>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-tinta/35">{numero}</span>
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/60">
          {titulo}
        </h2>
        {completa && (
          <span className="font-mono text-xs text-terracota" aria-label="completo">
            ✓
          </span>
        )}
      </div>

      {ayuda && (
        <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tinta/55">
          {ayuda}
        </p>
      )}

      <div
        className={`mt-6 flex flex-col gap-6 ${ancho === 'angosto' ? 'max-w-xl' : ''}`}
      >
        {children}
      </div>
    </fieldset>
  );
}

function Campo({
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
          <span className="ml-2 font-mono text-xs font-normal text-tinta/35">
            opcional
          </span>
        )}
      </label>

      {ayuda && (
        <p id={idAyuda} className="mt-1 font-sans text-xs text-tinta/50">
          {ayuda}
        </p>
      )}

      <div className="mt-2">
        {children({
          id,
          ...(describedBy ? { 'aria-describedby': describedBy } : {}),
          ...(errores?.length ? { 'aria-invalid': true as const } : {}),
        })}
      </div>

      {errores?.length ? (
        <p id={idError} className="mt-1.5 font-mono text-xs text-terracota">
          {errores[0]}
        </p>
      ) : null}
    </div>
  );
}

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-terracota';

function BarraEnvio({ faltantes }: { faltantes: string[] }) {
  const { pending } = useFormStatus();
  const listo = faltantes.length === 0;

  return (
    <div className="sticky bottom-0 -mx-[clamp(1.5rem,5vw,6rem)] border-t border-tinta/12 bg-hueso/95 px-[clamp(1.5rem,5vw,6rem)] py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs text-tinta/50">
          {listo ? (
            <span className="text-terracota">Todo listo para enviar</span>
          ) : (
            <>
              Falta: <span className="text-tinta/70">{faltantes.join(' · ')}</span>
            </>
          )}
        </p>

        <button
          type="submit"
          disabled={pending}
          className="border border-terracota bg-terracota px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Enviando…' : 'Enviar registro →'}
        </button>
      </div>
    </div>
  );
}

// ─── formulario ──────────────────────────────────────────────

export function FormularioRegistro({ categorias }: { categorias: Categoria[] }) {
  const [estado, accion] = useFormState(registrarPortafolio, ESTADO_INICIAL);

  const [coords, setCoords] = useState<Posicion | null>(null);
  const [ubicacionValida, setUbicacionValida] = useState(false);
  const [nombreFoto, setNombreFoto] = useState<string | null>(null);

  // Espejo liviano de lo obligatorio, solo para la barra de progreso.
  // La validación de verdad vive en Zod y en la base — esto es orientación.
  const [llenos, setLlenos] = useState({
    nombre: false,
    categoria: false,
    direccion: false,
    barrio: false,
    contacto: false,
    consentimiento: false,
  });

  const marcar = useCallback(
    (campo: keyof typeof llenos, valor: boolean) =>
      setLlenos((prev) => (prev[campo] === valor ? prev : { ...prev, [campo]: valor })),
    [],
  );

  const alCambiarUbicacion = useCallback((p: Posicion | null, valida: boolean) => {
    setCoords(p);
    setUbicacionValida(valida);
  }, []);

  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const err = (campo: string): string[] | undefined => errores[campo];

  const faltantes = [
    !(coords && ubicacionValida) && 'ubicación',
    !llenos.nombre && 'nombre',
    !llenos.categoria && 'categoría',
    !llenos.direccion && 'dirección',
    !llenos.barrio && 'barrio',
    !llenos.contacto && 'contacto',
    !llenos.consentimiento && 'consentimiento',
  ].filter(Boolean) as string[];

  if (estado.estado === 'ok') {
    return (
      <div className="mt-16 max-w-xl border-t border-tinta/12 pt-10">
        <span className="font-mono text-xs uppercase tracking-wider text-terracota">
          Registro recibido
        </span>

        <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-tinta">
          Listo. Ahora lo revisamos.
        </h2>

        <p className="mt-4 font-sans leading-relaxed text-tinta/70">
          Tu emprendimiento aparece en la vitrina pública apenas el equipo termine
          de revisarlo. Guardá este código por si necesitás consultarlo:
        </p>

        <p className="mt-4 break-all border border-tinta/15 px-4 py-3 font-mono text-xs text-tinta/70">
          {estado.id}
        </p>

        {estado.avisoFoto && (
          <p className="mt-4 font-mono text-xs text-terracota">{estado.avisoFoto}</p>
        )}

        <Link
          href="/portafolios"
          className="mt-8 inline-block font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota"
        >
          ← Ver la vitrina
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="mt-14 flex flex-col gap-12">
      {estado.estado === 'error' && estado.mensaje && (
        <p
          role="alert"
          className="max-w-xl border border-terracota/40 bg-terracota/5 px-4 py-3 font-sans text-sm text-terracota"
        >
          {estado.mensaje}
        </p>
      )}

      {/* La ubicación va primero: es lo que distingue a esta vitrina de una
          lista de negocios, y es el paso que más se abandona si aparece al
          final, después de diez campos de texto. */}
      <Seccion
        numero="01"
        titulo="¿Dónde queda tu negocio?"
        ayuda="Tocá el botón para usar el GPS de tu celular, o marcá el punto en el mapa. Tiene que estar dentro de la Comuna 3."
        completa={Boolean(coords && ubicacionValida)}
        ancho="completo"
      >
        <SelectorUbicacion valorInicial={coords} alCambiar={alCambiarUbicacion} />

        <input type="hidden" name="latitud" value={coords?.lat ?? ''} />
        <input type="hidden" name="longitud" value={coords?.lng ?? ''} />

        {(err('latitud') || err('longitud')) && (
          <p className="font-mono text-xs text-terracota">
            {err('latitud')?.[0] ?? err('longitud')?.[0]}
          </p>
        )}

        <div className="grid max-w-xl grid-cols-1 gap-6">
          <Campo id="direccion" etiqueta="Dirección" requerido errores={err('direccion')}>
            {(p) => (
              <input
                {...p}
                name="direccion"
                type="text"
                required
                maxLength={200}
                placeholder="Calle 70 #45-12"
                onChange={(e) => marcar('direccion', e.target.value.trim().length >= 5)}
                className={claseInput}
              />
            )}
          </Campo>

          <Campo id="barrio" etiqueta="Barrio" requerido errores={err('barrio')}>
            {(p) => (
              <input
                {...p}
                name="barrio"
                type="text"
                required
                maxLength={80}
                placeholder="Manrique Central"
                onChange={(e) => marcar('barrio', e.target.value.trim().length >= 2)}
                className={claseInput}
              />
            )}
          </Campo>
        </div>
      </Seccion>

      <Seccion
        numero="02"
        titulo="Tu negocio"
        completa={llenos.nombre && llenos.categoria}
      >
        <Campo id="nombre" etiqueta="Nombre del negocio" requerido errores={err('nombre')}>
          {(p) => (
            <input
              {...p}
              name="nombre"
              type="text"
              required
              maxLength={80}
              placeholder="Panadería La Esperanza"
              onChange={(e) => marcar('nombre', e.target.value.trim().length >= 2)}
              className={claseInput}
            />
          )}
        </Campo>

        <Campo id="categoria_id" etiqueta="Categoría" requerido errores={err('categoria_id')}>
          {(p) => (
            <select
              {...p}
              name="categoria_id"
              required
              onChange={(e) => marcar('categoria', e.target.value !== '')}
              className={claseInput}
            >
              <option value="">Elegí una…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <Campo
          id="descripcion"
          etiqueta="¿Qué hacés?"
          ayuda="Contá en pocas líneas qué vendés o qué servicio prestás. Hasta 400 caracteres."
          errores={err('descripcion')}
        >
          {(p) => (
            <textarea
              {...p}
              name="descripcion"
              rows={4}
              maxLength={400}
              placeholder="Pan artesanal y pasteles por encargo. Atendemos de lunes a sábado desde las 5 de la mañana."
              className={`${claseInput} resize-y`}
            />
          )}
        </Campo>
      </Seccion>

      <Seccion
        numero="03"
        titulo="¿Cómo te contactan?"
        ayuda="Completá al menos uno. Es lo que va a ver la gente para escribirte."
        completa={llenos.contacto}
      >
        {/* Un solo onChange sobre el contenedor: escuchar los cinco inputs por
            separado sería el mismo chequeo repetido cinco veces. */}
        <div
          className="flex flex-col gap-6"
          onChange={(e) => {
            const cont = e.currentTarget;
            const hayAlguno = ['whatsapp', 'telefono', 'correo', 'instagram', 'facebook'].some(
              (n) =>
                (cont.querySelector(`[name="${n}"]`) as HTMLInputElement | null)?.value
                  .trim() !== '',
            );
            marcar('contacto', hayAlguno);
          }}
        >
          <Campo id="whatsapp" etiqueta="WhatsApp" errores={err('whatsapp')}>
            {(p) => (
              <input
                {...p}
                name="whatsapp"
                type="tel"
                inputMode="tel"
                placeholder="300 123 4567"
                className={claseInput}
              />
            )}
          </Campo>

          <Campo id="telefono" etiqueta="Teléfono fijo" errores={err('telefono')}>
            {(p) => (
              <input
                {...p}
                name="telefono"
                type="tel"
                inputMode="tel"
                placeholder="604 123 4567"
                className={claseInput}
              />
            )}
          </Campo>

          <Campo id="correo" etiqueta="Correo" errores={err('correo')}>
            {(p) => (
              <input
                {...p}
                name="correo"
                type="email"
                placeholder="contacto@ejemplo.com"
                className={claseInput}
              />
            )}
          </Campo>

          <Campo id="instagram" etiqueta="Instagram" errores={err('instagram')}>
            {(p) => (
              <input
                {...p}
                name="instagram"
                type="text"
                placeholder="@minegocio"
                className={claseInput}
              />
            )}
          </Campo>

          <Campo id="facebook" etiqueta="Facebook" errores={err('facebook')}>
            {(p) => (
              <input
                {...p}
                name="facebook"
                type="text"
                placeholder="facebook.com/minegocio"
                className={claseInput}
              />
            )}
          </Campo>
        </div>
      </Seccion>

      <Seccion numero="04" titulo="Una foto" ayuda="Ayuda muchísimo a que te encuentren. JPG, PNG o WebP, hasta 5 MB.">
        <Campo id="foto" etiqueta="Fotografía del negocio" errores={err('foto')}>
          {(p) => (
            <input
              {...p}
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment" // en celular abre la cámara directamente
              onChange={(e) => {
                const f = e.target.files?.[0];
                // Se avisa antes de enviar: subir 8 MB para que el server los
                // rechace gasta los datos del celular de la persona.
                if (f && f.size > TAMANO_MAX_FOTO) {
                  setNombreFoto(`"${f.name}" pesa más de 5 MB — elegí otra`);
                  e.target.value = '';
                  return;
                }
                setNombreFoto(f ? f.name : null);
              }}
              className="w-full font-sans text-sm text-tinta/70 file:mr-4 file:border file:border-tinta/20 file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-xs file:text-tinta hover:file:border-terracota hover:file:text-terracota"
            />
          )}
        </Campo>

        {nombreFoto && <p className="font-mono text-xs text-tinta/50">{nombreFoto}</p>}
      </Seccion>

      <Seccion numero="05" titulo="Permisos" completa={llenos.consentimiento}>
        <div
          onChange={(e) => {
            const cont = e.currentTarget;
            const marcados = ['acepto_terminos', 'acepto_habeas_data'].every(
              (n) =>
                (cont.querySelector(`[name="${n}"]`) as HTMLInputElement | null)?.checked,
            );
            marcar('consentimiento', marcados);
          }}
          className="flex flex-col gap-5"
        >
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="acepto_terminos"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-terracota"
            />
            <span className="font-sans text-sm leading-relaxed text-tinta/75">
              Confirmo que soy dueño o represento este negocio, que la información
              es veraz y que acepto los{' '}
              <Link
                href="/legal/terminos"
                target="_blank"
                className="underline decoration-terracota underline-offset-4 hover:text-terracota"
              >
                términos y condiciones
              </Link>
              .
            </span>
          </label>
          {err('acepto_terminos') && (
            <p className="font-mono text-xs text-terracota">{err('acepto_terminos')![0]}</p>
          )}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="acepto_habeas_data"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-terracota"
            />
            <span className="font-sans text-sm leading-relaxed text-tinta/75">
              Autorizo el tratamiento de mis datos conforme a la Ley 1581 de 2012
              y a la{' '}
              <Link
                href="/legal/politica-datos"
                target="_blank"
                className="underline decoration-terracota underline-offset-4 hover:text-terracota"
              >
                política de tratamiento de datos
              </Link>
              . Entiendo que los datos del negocio se publican de forma pública.
            </span>
          </label>
          {err('acepto_habeas_data') && (
            <p className="font-mono text-xs text-terracota">
              {err('acepto_habeas_data')![0]}
            </p>
          )}
        </div>
      </Seccion>

      <BarraEnvio faltantes={faltantes} />
    </form>
  );
}
