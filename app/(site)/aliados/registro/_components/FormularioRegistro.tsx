'use client';

import { useActionState, useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

import {
  registrarPortafolio,
  type EstadoRegistro,
} from '@/lib/actions/registrarPortafolio';
import { geocodificarDireccionAction } from '@/lib/actions/geocodificarDireccion';
import { manejarSeleccionFoto } from '@/lib/imagen/comprimir';
import { nombreCampoFormulario } from '@/lib/validation/camposPersonalizados.schema';
import type { Categoria } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import type { Posicion } from './SelectorUbicacionClient';
import { ChipsUnica, ChipsMultiple } from './Chips';
import { SelectConOtro } from './SelectConOtro';
import { CampoFormulario } from '@/components/CampoFormulario';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';
import { ETIQUETA_FORMALIDAD } from '@/lib/formalizacion';

// ─── opciones de los chips ───────────────────────────────────
// Los `value` (name="horario" / "medios_pago" / "formalidad")
// tienen que calzar exacto con lo que espera `desdeFormData` en el schema.

const OPCIONES_HORARIO_UI = [
  { valor: 'mananas', etiqueta: 'Mañanas' },
  { valor: 'tardes', etiqueta: 'Tardes' },
  { valor: 'noches', etiqueta: 'Noches' },
  { valor: 'fines_semana', etiqueta: 'Fines de semana' },
  { valor: 'bajo_pedido', etiqueta: 'Bajo pedido o cita' },
];

const OPCIONES_MEDIOS_PAGO_UI = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'nequi', etiqueta: 'Nequi' },
  { valor: 'daviplata', etiqueta: 'Daviplata' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'datafono', etiqueta: 'Datáfono' },
];

// ─── investigación (privado, opcional, nunca se publica) ──────
// Solo queda formalidad: personaliza /formalizacion. La pregunta de
// mayor_dolor se sacó del formulario; el schema la sigue aceptando vacía.

// La etiqueta vive en lib/formalizacion.ts: /formalizacion la reusa para
// explicar según qué respuesta se personalizó la lista de trámites.
const OPCIONES_FORMALIDAD_UI = Object.entries(ETIQUETA_FORMALIDAD).map(
  ([valor, etiqueta]) => ({ valor, etiqueta }),
);

const SelectorUbicacion = dynamic(() => import('./SelectorUbicacionClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full items-center justify-center border border-tinta/15 bg-tinta/[0.02] sm:h-[580px]">
      <span className="font-sans text-xs text-tinta/60">cargando mapa…</span>
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
  // Antes solo el ✓ chiquito del título marcaba una sección completa — con la
  // paleta plana del sitio (hueso/tinta/azul, sin verdes de "éxito") eso
  // se pierde de vista. Ahora la sección entera se resalta con el mismo
  // patrón de borde + fondo tenue que ya usa la página de estado para
  // "Publicado" / "Pendiente" — la misma señal, reutilizada, no una nueva.
  return (
    <fieldset className="border-t border-tinta/12 pt-8">
      <legend className="sr-only">{titulo}</legend>

      <div
        className={[
          'transition-colors',
          ancho === 'angosto' ? 'max-w-xl' : '',
          completa
            ? 'border-l-2 border-azul bg-azul/[0.03] py-3 pl-3 -ml-3 sm:pl-4 sm:-ml-4'
            : '',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-sans text-xs text-tinta/60">{numero}</span>
          <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/60">
            {titulo}
          </h2>
          {completa && (
            <span className="font-sans text-xs text-azul-texto" aria-label="completo">
              ✓ completo
            </span>
          )}
        </div>

        {ayuda && (
          <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/65">
            {ayuda}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6">{children}</div>
      </div>
    </fieldset>
  );
}


const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-azul focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-azul';

function BarraEnvio({ faltantes, total }: { faltantes: string[]; total: number }) {
  const { pending } = useFormStatus();
  const listo = faltantes.length === 0;
  const completos = total - faltantes.length;
  const porcentaje = Math.round((completos / total) * 100);

  return (
    <div className="sticky bottom-0 -mx-[clamp(1.5rem,5vw,6rem)] border-t border-tinta/12 bg-hueso/95 px-[clamp(1.5rem,5vw,6rem)] py-4 backdrop-blur">
      {/* Barra de progreso real, no solo una lista de texto: ver el avance
          moverse es lo que hace que alguien termine un formulario largo. */}
      <div className="h-1 w-full overflow-hidden bg-tinta/8" aria-hidden="true">
        <div
          className="h-full bg-azul-texto transition-[width] duration-300 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <p className="font-sans text-xs text-tinta/65">
          {listo ? (
            <span className="text-azul-texto">✓ Todo listo para enviar</span>
          ) : (
            <>
              <span className="text-tinta">{porcentaje}%</span> completado · falta{' '}
              <span className="text-tinta/70">{faltantes.join(' · ')}</span>
            </>
          )}
        </p>

        <button
          type="submit"
          disabled={pending}
          className="border border-azul-texto bg-azul-texto px-6 py-3 font-sans text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Enviando…' : 'Enviar registro →'}
        </button>
      </div>
    </div>
  );
}

// ─── formulario ──────────────────────────────────────────────

export function FormularioRegistro({
  categorias,
  camposPersonalizados,
}: {
  categorias: Categoria[];
  camposPersonalizados: DefinicionCampo[];
}) {
  const [estado, accion] = useActionState(registrarPortafolio, ESTADO_INICIAL);

  // Marca de tiempo de cuándo se abrió el formulario, para el chequeo de
  // tiempo mínimo de llenado en el server (anti-bot).
  const [iniciadoEn] = useState(() => Date.now());

  const [coords, setCoords] = useState<Posicion | null>(null);
  const [ubicacionValida, setUbicacionValida] = useState(false);
  // El mapa guarda su propia posición en estado interno y solo lee
  // `valorInicial` al montar (no reacciona a cambios del prop después). Para
  // que "Ubicar en el mapa" lo reposicione, se lo remonta cambiando `key` —
  // más simple que convertir el selector en un componente controlado.
  const [mapKey, setMapKey] = useState(0);
  const [nombreFoto, setNombreFoto] = useState<string | null>(null);
  const [nombreMenu, setNombreMenu] = useState<string | null>(null);

  const [categoriaId, setCategoriaId] = useState('');
  const [barrio, setBarrio] = useState('');
  const [barrioEsOtro, setBarrioEsOtro] = useState(false);
  const [horario, setHorario] = useState<string[]>([]);
  const [mediosPago, setMediosPago] = useState<string[]>([]);

  const [mostrarOtraRed, setMostrarOtraRed] = useState(false);

  // Investigación — va a aliados_investigacion, no a portafolios, y nunca se
  // publica. Opcional.
  const [formalidad, setFormalidad] = useState('');

  const direccionRef = useRef<HTMLInputElement>(null);
  const [geocodificando, setGeocodificando] = useState(false);
  const [errorGeocode, setErrorGeocode] = useState<string | null>(null);

  const ubicarPorDireccion = useCallback(async () => {
    const valor = direccionRef.current?.value.trim() ?? '';
    if (valor.length < 5) {
      setErrorGeocode('Escribe la dirección completa primero.');
      return;
    }

    setGeocodificando(true);
    setErrorGeocode(null);

    // try/finally: si la Server Action rechaza (caída de red, error del
    // server), el botón tiene que volver a habilitarse igual — sin esto se
    // queda trabado en "Buscando…" para siempre y no hay forma de reintentar
    // sin recargar la página.
    let resultado: Awaited<ReturnType<typeof geocodificarDireccionAction>>;
    try {
      resultado = await geocodificarDireccionAction(valor);
    } catch {
      setErrorGeocode('Algo falló buscando esa dirección. Intenta de nuevo.');
      return;
    } finally {
      setGeocodificando(false);
    }

    if (!resultado.ok) {
      setErrorGeocode(resultado.mensaje);
      return;
    }

    setCoords({ lat: resultado.lat, lng: resultado.lng });
    setUbicacionValida(true);
    setMapKey((k) => k + 1);
  }, []);

  // Espejo liviano de lo obligatorio, solo para la barra de progreso.
  // La validación de verdad vive en Zod y en la base — esto es orientación.
  const [llenos, setLlenos] = useState({
    nombre: false,
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

  // Uno por slug, solo para los campos personalizados marcados como
  // obligatorios — igual que `llenos`, es orientación para la barra de
  // progreso, no la validación real (esa vive en el server, contra la lista
  // de campos activos en ese momento).
  const [llenosPersonalizados, setLlenosPersonalizados] = useState<Record<string, boolean>>({});

  const marcarPersonalizado = useCallback(
    (slug: string, valor: boolean) =>
      setLlenosPersonalizados((prev) =>
        prev[slug] === valor ? prev : { ...prev, [slug]: valor },
      ),
    [],
  );

  const alCambiarUbicacion = useCallback((p: Posicion | null, valida: boolean) => {
    setCoords(p);
    setUbicacionValida(valida);
  }, []);

  const alCambiarBarrio = useCallback(
    (v: string, esOtro: boolean) => {
      setBarrio(v);
      setBarrioEsOtro(esOtro);
      marcar('barrio', v.trim().length >= 2);
    },
    [marcar],
  );

  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const err = (campo: string): string[] | undefined => errores[campo];

  const camposRequeridos = camposPersonalizados.filter((c) => c.requerido);

  // Ubicación, nombre, dirección, barrio, contacto y consentimiento son lo
  // único que de verdad bloquea el envío. Categoría, tipo de negocio y
  // productos son opcionales a pedido del cliente.
  const REQUISITOS: [boolean, string][] = [
    [Boolean(coords && ubicacionValida), 'ubicación'],
    [llenos.nombre, 'nombre'],
    [llenos.direccion, 'dirección'],
    [llenos.barrio, 'barrio'],
    [llenos.contacto, 'contacto'],
    [llenos.consentimiento, 'consentimiento'],
    ...camposRequeridos.map(
      (c) => [Boolean(llenosPersonalizados[c.slug]), c.etiqueta.toLowerCase()] as [boolean, string],
    ),
  ];
  const faltantes = REQUISITOS.filter(([cumplido]) => !cumplido).map(([, nombre]) => nombre);

  // Números de sección hardcodeados en el JSX (mismo patrón que ya usaba
  // este formulario): "Permisos" corre su numeración según si hay campos
  // personalizados activos ese día.
  const numeroCampos = '08';
  const numeroPermisos = camposPersonalizados.length > 0 ? '09' : '08';

  // Un registro exitoso hace redirect() del lado del server a
  // /aliados/estado/[token] — no hay estado 'ok' que mostrar acá.
  return (
    <>
      <form action={accion} className="mt-14 flex flex-col gap-12">
      {/* Honeypot + tiempo mínimo de llenado: anti-bot silencioso, no le
          agrega fricción a una persona real. */}
      <input
        type="text"
        name="sitio_web"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
      />
      <input type="hidden" name="iniciado_en" value={iniciadoEn} />

      {estado.estado === 'error' && estado.mensaje && (
        <p
          role="alert"
          className="max-w-xl border border-amarillo bg-amarillo/15 px-4 py-3 font-sans text-sm text-azul-texto"
        >
          {estado.mensaje}
        </p>
      )}

      {/* Dirección y barrio van primero: es lo que distingue a esta vitrina
          de una lista de negocios, y es el paso que más se abandona si
          aparece al final, después de diez campos de texto. La dirección
          hace doble función — texto legible para quien te busca en persona,
          y punto de partida para ubicar el pin sin tener que salir a la
          calle a activar el GPS. */}
      <Seccion
        numero="01"
        titulo="¿Dónde queda tu negocio?"
        ayuda="Escribe la dirección y toca «Ubicar en el mapa», usa el GPS de tu celular, o marca el punto tú mismo tocando el mapa."
        completa={Boolean(coords && ubicacionValida && llenos.direccion && llenos.barrio)}
        ancho="completo"
      >
        <div className="grid max-w-xl grid-cols-1 gap-6">
          <CampoFormulario
            id="direccion"
            etiqueta="Dirección"
            requerido
            errores={err('direccion')}
          >
            {(p) => (
              <input
                {...p}
                ref={direccionRef}
                name="direccion"
                type="text"
                required
                maxLength={200}
                placeholder="Calle 70 #45-12"
                onChange={(e) => marcar('direccion', e.target.value.trim().length >= 5)}
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={ubicarPorDireccion}
              disabled={geocodificando}
              className="inline-flex min-h-11 items-center gap-2 border border-tinta/20 px-4 py-2.5 font-sans text-xs text-tinta/70 transition-colors hover:border-azul-texto hover:text-azul-texto disabled:cursor-wait disabled:opacity-60"
            >
              <span aria-hidden="true">📍</span>
              {geocodificando ? 'Buscando esa dirección…' : 'Ubicar esta dirección en el mapa'}
            </button>
            {errorGeocode && (
              <p role="alert" className="font-sans text-xs text-azul-texto">
                {errorGeocode}
              </p>
            )}
          </div>

          <CampoFormulario id="barrio" etiqueta="Barrio" requerido errores={err('barrio')}>
            {(p) => (
              <SelectConOtro
                {...p}
                name="barrio"
                opciones={BARRIOS_COMUNA_3}
                valor={barrio}
                esOtro={barrioEsOtro}
                alCambiar={alCambiarBarrio}
                placeholderOtro="Escribe el barrio"
              />
            )}
          </CampoFormulario>
        </div>

        <SelectorUbicacion key={mapKey} valorInicial={coords} alCambiar={alCambiarUbicacion} />

        <input type="hidden" name="latitud" value={coords?.lat ?? ''} />
        <input type="hidden" name="longitud" value={coords?.lng ?? ''} />

        {(err('latitud') || err('longitud')) && (
          <p className="font-sans text-xs text-azul-texto">
            {err('latitud')?.[0] ?? err('longitud')?.[0]}
          </p>
        )}
      </Seccion>

      <Seccion
        numero="02"
        titulo="Tu negocio"
        completa={llenos.nombre}
      >
        <CampoFormulario
          id="nombre"
          etiqueta="Nombre del negocio"
          requerido
          errores={err('nombre')}
        >
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
        </CampoFormulario>

        <CampoFormulario
          id="categoria_id"
          etiqueta="¿Qué tipo de negocio eres?"
          ayuda="Opcional — ayuda a que te encuentren por rubro."
          errores={err('categoria_id')}
        >
          {(p) => (
            <select
              {...p}
              name="categoria_id"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={claseInput}
            >
              <option value="">Prefiero no elegir</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}
        </CampoFormulario>

        {categoriaId === 'otros' && (
          <CampoFormulario
            id="categoria_otra"
            etiqueta="¿Cuál?"
            requerido
            errores={err('categoria_otra')}
          >
            {(p) => (
              <input
                {...p}
                name="categoria_otra"
                type="text"
                required
                maxLength={60}
                placeholder="Ej: taller de bicicletas"
                className={claseInput}
              />
            )}
          </CampoFormulario>
        )}

        {/* `formalidad` no es un dato de investigación cualquiera: es lo que
            personaliza /formalizacion (pasosPara()) y lo que lee el asesor
            de IA — por eso se quedó cuando el resto de las preguntas de
            investigación se sacó del formulario. */}
        <CampoFormulario
          id="formalidad"
          etiqueta="¿Tienes RUT o Cámara de Comercio?"
          ayuda="Opcional — te ayuda a ver solo los trámites que todavía te faltan."
        >
          {(p) => (
            <ChipsUnica
              {...p}
              name="formalidad"
              opciones={OPCIONES_FORMALIDAD_UI}
              valor={formalidad}
              alCambiar={setFormalidad}
            />
          )}
        </CampoFormulario>

        <CampoFormulario
          id="descripcion"
          etiqueta="Cuéntanos, ¿a qué te dedicas?"
          ayuda="Cuéntanos en pocas líneas qué vendes o qué servicio prestas. Hasta 400 caracteres."
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
        </CampoFormulario>
      </Seccion>

      <Seccion
        numero="03"
        titulo="Productos y servicios"
        ayuda="Un producto por línea, en formato PRODUCTO - PRECIO (el precio es opcional). Ejemplo: Empanadas - $2000"
      >
        <CampoFormulario
          id="productos"
          etiqueta="¿Qué productos o servicios ofreces?"
          errores={err('productos')}
        >
          {(p) => (
            <textarea
              {...p}
              name="productos"
              rows={5}
              maxLength={2000}
              placeholder={'Empanadas - $2000\nJugo natural - $3000\nAsesoría contable'}
              className={`${claseInput} resize-y`}
            />
          )}
        </CampoFormulario>
      </Seccion>

      <Seccion
        numero="04"
        titulo="Menú o flyer"
        ayuda="Déjale a tus futuros clientes el menú o flyer de tus productos. JPG, PNG o WebP, hasta 5 MB."
      >
        <CampoFormulario id="menu" etiqueta="Menú o flyer" errores={err('menu')}>
          {(p) => (
            <input
              {...p}
              name="menu"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => manejarSeleccionFoto(e.target, setNombreMenu)}
              className="w-full font-sans text-sm text-tinta/70 file:mr-4 file:border file:border-tinta/20 file:bg-transparent file:px-4 file:py-2 file:font-sans file:text-xs file:text-tinta hover:file:border-azul hover:file:text-azul-texto"
            />
          )}
        </CampoFormulario>

        {nombreMenu && <p className="font-sans text-xs text-tinta/65">{nombreMenu}</p>}
      </Seccion>

      <Seccion
        numero="05"
        titulo="¿Cómo te contactan?"
        ayuda="El WhatsApp es obligatorio — es el canal que usa la gente para escribirte. Los demás son opcionales."
        completa={llenos.contacto}
      >
        <div className="flex flex-col gap-6">
          <CampoFormulario id="whatsapp" etiqueta="WhatsApp" requerido errores={err('whatsapp')}>
            {(p) => (
              <input
                {...p}
                name="whatsapp"
                type="tel"
                inputMode="tel"
                required
                placeholder="300 123 4567"
                onChange={(e) => marcar('contacto', e.target.value.trim() !== '')}
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <CampoFormulario id="correo" etiqueta="Correo" errores={err('correo')}>
            {(p) => (
              <input
                {...p}
                name="correo"
                type="email"
                placeholder="contacto@ejemplo.com"
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <CampoFormulario
            id="instagram"
            etiqueta="Instagram"
            ayuda="Usuario, @usuario o el link — como te resulte más fácil."
            errores={err('instagram')}
          >
            {(p) => (
              <input
                {...p}
                name="instagram"
                type="text"
                placeholder="@minegocio"
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <button
            type="button"
            onClick={() => setMostrarOtraRed((v) => !v)}
            className="self-start font-sans text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
          >
            {mostrarOtraRed ? '− Ocultar' : '+ Agregar otra red o página'}
          </button>

          {mostrarOtraRed && (
            <CampoFormulario
              id="facebook"
              etiqueta="Otra red o página"
              ayuda="Facebook, TikTok, sitio web — usuario, @usuario o el link."
              errores={err('facebook')}
            >
              {(p) => (
                <input
                  {...p}
                  name="facebook"
                  type="text"
                  placeholder="facebook.com/minegocio"
                  className={claseInput}
                />
              )}
            </CampoFormulario>
          )}
        </div>
      </Seccion>

      <Seccion
        numero="06"
        titulo="Horarios de tu negocio"
        ayuda="Opcional, pero ayuda a que la gente sepa qué esperar antes de escribirte."
      >
        <CampoFormulario id="horario" etiqueta="¿Cuándo atiendes?">
          {(p) => (
            <ChipsMultiple
              {...p}
              name="horario"
              opciones={OPCIONES_HORARIO_UI}
              valores={horario}
              alCambiar={setHorario}
            />
          )}
        </CampoFormulario>

        <CampoFormulario id="medios_pago" etiqueta="¿Cómo te pagan?">
          {(p) => (
            <ChipsMultiple
              {...p}
              name="medios_pago"
              opciones={OPCIONES_MEDIOS_PAGO_UI}
              valores={mediosPago}
              alCambiar={setMediosPago}
            />
          )}
        </CampoFormulario>

        <CampoFormulario
          id="punto_referencia"
          etiqueta="Punto de referencia"
          ayuda="Algo fácil de reconocer cerca del lugar."
          errores={err('punto_referencia')}
        >
          {(p) => (
            <input
              {...p}
              name="punto_referencia"
              type="text"
              maxLength={120}
              placeholder="Frente a la cancha de La Cruz"
              className={claseInput}
            />
          )}
        </CampoFormulario>
      </Seccion>

      <Seccion numero="07" titulo="Una foto" ayuda="Ayuda muchísimo a que te encuentren. JPG, PNG o WebP, hasta 5 MB.">
        <CampoFormulario id="foto" etiqueta="Fotografía del negocio" errores={err('foto')}>
          {(p) => (
            <input
              {...p}
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => manejarSeleccionFoto(e.target, setNombreFoto)}
              className="w-full font-sans text-sm text-tinta/70 file:mr-4 file:border file:border-tinta/20 file:bg-transparent file:px-4 file:py-2 file:font-sans file:text-xs file:text-tinta hover:file:border-azul hover:file:text-azul-texto"
            />
          )}
        </CampoFormulario>

        {nombreFoto && <p className="font-sans text-xs text-tinta/65">{nombreFoto}</p>}
      </Seccion>

      {camposPersonalizados.length > 0 && (
        <Seccion numero={numeroCampos} titulo="Información adicional">
          {camposPersonalizados.map((c) => {
            const nombre = nombreCampoFormulario(c.slug);

            if (c.tipo === 'si_no') {
              return (
                <label key={c.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name={nombre}
                    className="mt-1 h-4 w-4 shrink-0 accent-azul"
                    onChange={(e) => marcarPersonalizado(c.slug, e.target.checked)}
                  />
                  <span className="font-sans text-sm text-tinta/75">
                    {c.etiqueta}
                    {!c.requerido && (
                      <span className="ml-2 font-sans text-xs text-tinta/60">opcional</span>
                    )}
                  </span>
                </label>
              );
            }

            return (
              <CampoFormulario
                id={nombre}
                etiqueta={c.etiqueta}
                ayuda={c.ayuda ?? undefined}
                requerido={c.requerido}
                errores={err(nombre)}
                key={c.id}
              >
                {(p) => {
                  if (c.tipo === 'seleccion') {
                    return (
                      <select
                        {...p}
                        name={nombre}
                        required={c.requerido}
                        onChange={(e) => marcarPersonalizado(c.slug, e.target.value !== '')}
                        className={claseInput}
                      >
                        <option value="">Elige una…</option>
                        {(c.opciones ?? []).map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                    );
                  }

                  if (c.tipo === 'numero') {
                    return (
                      <input
                        {...p}
                        name={nombre}
                        type="number"
                        required={c.requerido}
                        onChange={(e) => marcarPersonalizado(c.slug, e.target.value.trim() !== '')}
                        className={claseInput}
                      />
                    );
                  }

                  return (
                    <input
                      {...p}
                      name={nombre}
                      type="text"
                      required={c.requerido}
                      maxLength={400}
                      onChange={(e) => marcarPersonalizado(c.slug, e.target.value.trim() !== '')}
                      className={claseInput}
                    />
                  );
                }}
              </CampoFormulario>
            );
          })}
        </Seccion>
      )}

      <Seccion numero={numeroPermisos} titulo="Permisos" completa={llenos.consentimiento}>
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
              className="mt-1 h-4 w-4 shrink-0 accent-azul"
            />
            <span className="font-sans text-sm leading-relaxed text-tinta/75">
              Confirmo que soy dueño o represento este negocio, que la información
              es veraz y que acepto los{' '}
              <Link
                href="/legal/terminos"
                target="_blank"
                className="underline decoration-azul underline-offset-4 hover:text-azul-texto"
              >
                términos y condiciones
              </Link>
              .
            </span>
          </label>
          {err('acepto_terminos') && (
            <p className="font-sans text-xs text-azul-texto">{err('acepto_terminos')![0]}</p>
          )}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="acepto_habeas_data"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-azul"
            />
            <span className="font-sans text-sm leading-relaxed text-tinta/75">
              Autorizo el tratamiento de mis datos conforme a la Ley 1581 de 2012
              y a la{' '}
              <Link
                href="/legal/politica-datos"
                target="_blank"
                className="underline decoration-azul underline-offset-4 hover:text-azul-texto"
              >
                política de tratamiento de datos
              </Link>
              . Entiendo que los datos del negocio se publican de forma pública.
            </span>
          </label>
          {err('acepto_habeas_data') && (
            <p className="font-sans text-xs text-azul-texto">
              {err('acepto_habeas_data')![0]}
            </p>
          )}
        </div>
      </Seccion>

      <BarraEnvio faltantes={faltantes} total={REQUISITOS.length} />
      </form>

      <Link
        href="/aliados"
        className="mt-20 inline-block font-sans text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
      >
        ← Volver al mapa
      </Link>
    </>
  );
}
