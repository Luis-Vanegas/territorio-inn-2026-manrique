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
import { nombreCampoFormulario } from '@/lib/validation/camposPersonalizados.schema';
import type { Categoria } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import type { Posicion } from './SelectorUbicacionClient';
import { ChipsUnica, ChipsMultiple } from './Chips';
import { SelectConOtro } from './SelectConOtro';
import { CampoFormulario } from '@/components/CampoFormulario';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';

// ─── opciones de los chips ───────────────────────────────────
// Los `value` (name="horario" / "medios_pago" / "tipo_negocio" / "formalidad"
// / "mayor_dolor") tienen que calzar exacto con lo que espera `desdeFormData`
// en el schema.

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

const OPCIONES_TIPO_NEGOCIO_UI = [
  { valor: 'emprendimiento', etiqueta: 'Emprendimiento' },
  { valor: 'micronegocio', etiqueta: 'Micronegocio' },
  { valor: 'local', etiqueta: 'Local establecido' },
  { valor: 'otro', etiqueta: 'Otro' },
];

const OPCIONES_FORMALIDAD_UI = [
  { valor: 'rut_camara', etiqueta: 'Tengo RUT o Cámara de Comercio' },
  { valor: 'en_tramite', etiqueta: 'Estoy en trámite' },
  { valor: 'no_tengo', etiqueta: 'No tengo' },
  { valor: 'prefiero_no_decir', etiqueta: 'Prefiero no decir' },
];

const OPCIONES_MAYOR_DOLOR_UI = [
  { valor: 'cuentas_ganancia', etiqueta: 'Llevar las cuentas, las ventas del día y saber si hay ganancias reales.' },
  { valor: 'inventario_vencimientos', etiqueta: 'Controlar el inventario (saber qué hay, qué falta y qué se vence).' },
  { valor: 'clientes_redes', etiqueta: 'Conseguir nuevos clientes y manejar la publicidad o redes sociales.' },
  { valor: 'cobros_facturas', etiqueta: 'Cobrar, organizar las facturas o manejar los fiados.' },
  { valor: 'todo_bajo_control', etiqueta: 'Todo lo tengo bajo control por ahora.' },
];

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
  // Antes solo el ✓ chiquito del título marcaba una sección completa — con la
  // paleta plana del sitio (hueso/tinta/terracota, sin verdes de "éxito") eso
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
            ? 'border-l-2 border-terracota bg-terracota/[0.03] py-3 pl-3 -ml-3 sm:pl-4 sm:-ml-4'
            : '',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-xs text-tinta/35">{numero}</span>
          <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/60">
            {titulo}
          </h2>
          {completa && (
            <span className="font-mono text-xs text-terracota-texto" aria-label="completo">
              ✓ completo
            </span>
          )}
        </div>

        {ayuda && (
          <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/55">
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
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-terracota';

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
          className="h-full bg-terracota transition-[width] duration-300 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs text-tinta/50">
          {listo ? (
            <span className="text-terracota-texto">✓ Todo listo para enviar</span>
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
          className="border border-terracota-texto bg-terracota-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto disabled:cursor-not-allowed disabled:opacity-50"
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
  const [estado, accion] = useFormState(registrarPortafolio, ESTADO_INICIAL);

  // Marca de tiempo de cuándo se abrió el formulario, para el chequeo de
  // tiempo mínimo de llenado en el server (anti-bot).
  const [iniciadoEn] = useState(() => Date.now());

  const [coords, setCoords] = useState<Posicion | null>(null);
  const [ubicacionValida, setUbicacionValida] = useState(false);
  const [nombreFoto, setNombreFoto] = useState<string | null>(null);

  const [categoriaId, setCategoriaId] = useState('');
  const [barrio, setBarrio] = useState('');
  const [barrioEsOtro, setBarrioEsOtro] = useState(false);
  const [horario, setHorario] = useState<string[]>([]);
  const [mediosPago, setMediosPago] = useState<string[]>([]);

  // Toggles de bloques colapsados: simples booleanos, sin animación — lo
  // importante es que sea claro que hay más campos ahí atrás. Se pueden
  // volver a cerrar (no es una revelación de una sola vía): el botón
  // alterna el mismo booleano en cada click.
  const [mostrarOtraRed, setMostrarOtraRed] = useState(false);
  const [mostrarMasInfo, setMostrarMasInfo] = useState(false);

  // Investigación — va a aliados_investigacion, no a portafolios, y nunca se
  // publica. tipo_negocio y mayor_dolor son obligatorios a pedido del
  // cliente; el resto (nombre del dueño, formalidad) se queda opcional.
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [formalidad, setFormalidad] = useState('');
  const [mayorDolor, setMayorDolor] = useState<string[]>([]);

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

  // Máximo 2 elegidas, y "todo bajo control" es excluyente: marcarla suelta
  // cualquier otra, y marcar cualquier otra estando ella activa la suelta a
  // ella. Mismo patrón que se usaba para "Toda la comuna" en cobertura.
  const alCambiarMayorDolor = useCallback(
    (nuevos: string[]) => {
      const teniaTodo = mayorDolor.includes('todo_bajo_control');
      const tieneTodo = nuevos.includes('todo_bajo_control');

      if (tieneTodo && !teniaTodo) {
        setMayorDolor(['todo_bajo_control']);
        return;
      }

      if (teniaTodo && nuevos.length > 1) {
        setMayorDolor(nuevos.filter((v) => v !== 'todo_bajo_control'));
        return;
      }

      if (nuevos.length > 2) {
        // Ya había 2 marcadas: se ignora el intento de marcar una tercera.
        return;
      }

      setMayorDolor(nuevos);
    },
    [mayorDolor],
  );

  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const err = (campo: string): string[] | undefined => errores[campo];

  const camposRequeridos = camposPersonalizados.filter((c) => c.requerido);

  // Dirección, barrio y ubicación son siempre obligatorios — sin condición
  // según cómo atiende el negocio (eso ya no existe: ver nota en la
  // sección 01 sobre por qué se sacó tipo_presencia).
  const REQUISITOS: [boolean, string][] = [
    [Boolean(coords && ubicacionValida), 'ubicación'],
    [llenos.nombre, 'nombre'],
    [llenos.categoria, 'categoría'],
    [tipoNegocio !== '', 'tipo de negocio'],
    [mayorDolor.length > 0, 'qué te complica'],
    [llenos.direccion, 'dirección'],
    [llenos.barrio, 'barrio'],
    [llenos.contacto, 'contacto'],
    [llenos.consentimiento, 'consentimiento'],
    ...camposRequeridos.map(
      (c) => [Boolean(llenosPersonalizados[c.slug]), c.etiqueta.toLowerCase()] as [boolean, string],
    ),
  ];
  const faltantes = REQUISITOS.filter(([cumplido]) => !cumplido).map(([, nombre]) => nombre);

  // Investigación ahora es fija, entre "Tu negocio" y "Contacto" (el cliente
  // la quiere "de las primeras a responder"), así que su número y los de
  // Contacto/Horario/Foto quedan hardcodeados en el JSX como 01 y 02. Los
  // campos personalizados van entre "Foto" y "Permisos". Si no hay ninguno
  // activo, Permisos ocupa el número que Foto no usó — no tiene sentido
  // reservar un número que ese día no existe.
  const numeroCampos = '07';
  const numeroPermisos = camposPersonalizados.length > 0 ? '08' : '07';

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
          className="max-w-xl border border-terracota/40 bg-terracota/5 px-4 py-3 font-sans text-sm text-terracota-texto"
        >
          {estado.mensaje}
        </p>
      )}

      {/* La ubicación va primero: es lo que distingue a esta vitrina de una
          lista de negocios, y es el paso que más se abandona si aparece al
          final, después de diez campos de texto.

          Antes había acá un ChipsUnica de "cómo atendés" (tipo_presencia)
          que condicionaba si mapa/dirección/barrio eran obligatorios. El
          cliente probó esa versión y pidió sacarla — esa info no le servía.
          Vuelven a ser siempre obligatorios, como en el diseño original. */}
      <Seccion
        numero="01"
        titulo="¿Dónde queda tu negocio?"
        ayuda="Toca el botón para usar el GPS de tu celular, o marca el punto en el mapa."
        completa={Boolean(coords && ubicacionValida && llenos.direccion && llenos.barrio)}
        ancho="completo"
      >
        <SelectorUbicacion valorInicial={coords} alCambiar={alCambiarUbicacion} />

        <input type="hidden" name="latitud" value={coords?.lat ?? ''} />
        <input type="hidden" name="longitud" value={coords?.lng ?? ''} />

        {(err('latitud') || err('longitud')) && (
          <p className="font-mono text-xs text-terracota-texto">
            {err('latitud')?.[0] ?? err('longitud')?.[0]}
          </p>
        )}

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
      </Seccion>

      <Seccion
        numero="02"
        titulo="Tu negocio"
        completa={llenos.nombre && llenos.categoria}
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
          etiqueta="Categoría"
          requerido
          errores={err('categoria_id')}
        >
          {(p) => (
            <select
              {...p}
              name="categoria_id"
              required
              value={categoriaId}
              onChange={(e) => {
                setCategoriaId(e.target.value);
                marcar('categoria', e.target.value !== '');
              }}
              className={claseInput}
            >
              <option value="">Elige una…</option>
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
            etiqueta="¿Qué tipo de negocio es?"
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

      {/* Preguntas que nunca se publican — van a aliados_investigacion, una
          tabla privada, para el estudio del proyecto sobre los negocios de
          Manrique. Se movió más arriba y ya no está colapsada: el cliente la
          quiere de las primeras a responder, no algo que se descubre al
          final del formulario. */}
      <Seccion
        numero="03"
        titulo="Para el proyecto de investigación"
        ayuda="Estas últimas nos ayudan a entender mejor los negocios de Manrique para el proyecto de investigación. Nunca se publica."
        completa={tipoNegocio !== '' && mayorDolor.length > 0}
      >
        <CampoFormulario
          id="nombre_dueno"
          etiqueta="Nombre del dueño o representante"
          ayuda="Privado — no se publica, es solo para nuestro estudio."
          errores={err('nombre_dueno')}
        >
          {(p) => (
            <input
              {...p}
              name="nombre_dueno"
              type="text"
              maxLength={80}
              placeholder="Nombre completo"
              className={claseInput}
            />
          )}
        </CampoFormulario>

        <CampoFormulario
          id="tipo_negocio"
          etiqueta="¿Cómo describirías tu negocio?"
          requerido
          errores={err('tipo_negocio')}
        >
          {(p) => (
            <ChipsUnica
              {...p}
              name="tipo_negocio"
              opciones={OPCIONES_TIPO_NEGOCIO_UI}
              valor={tipoNegocio}
              alCambiar={setTipoNegocio}
              requerido
            />
          )}
        </CampoFormulario>

        {tipoNegocio === 'otro' && (
          <CampoFormulario
            id="tipo_negocio_detalle"
            etiqueta="¿Cuál?"
            errores={err('tipo_negocio_detalle')}
          >
            {(p) => (
              <input
                {...p}
                name="tipo_negocio_detalle"
                type="text"
                maxLength={80}
                className={claseInput}
              />
            )}
          </CampoFormulario>
        )}

        <CampoFormulario id="formalidad" etiqueta="¿Tienes RUT o Cámara de Comercio?">
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
          id="mayor_dolor"
          etiqueta="De las siguientes tareas del día a día, ¿cuál sientes que te quita más tiempo o te genera más dolores de cabeza?"
          ayuda="Elige hasta 2."
          requerido
          errores={err('mayor_dolor')}
        >
          {(p) => (
            <ChipsMultiple
              {...p}
              name="mayor_dolor"
              opciones={OPCIONES_MAYOR_DOLOR_UI}
              valores={mayorDolor}
              alCambiar={alCambiarMayorDolor}
            />
          )}
        </CampoFormulario>

        <CampoFormulario
          id="necesidad_crecer"
          etiqueta="Pensando en el futuro: ¿qué crees que le hace falta a tu negocio hoy para crecer más, organizarse mejor o dar el siguiente paso?"
          ayuda="¡Cuéntanos con confianza! Esta información es clave para nuestra investigación sobre las necesidades reales del sector."
          errores={err('necesidad_crecer')}
        >
          {(p) => (
            <textarea
              {...p}
              name="necesidad_crecer"
              rows={4}
              maxLength={500}
              className={`${claseInput} resize-y`}
            />
          )}
        </CampoFormulario>
      </Seccion>

      <Seccion
        numero="04"
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
            className="self-start font-mono text-sm text-tinta/55 underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
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
        numero="05"
        titulo="Horario y medios de pago"
        ayuda="Opcional, pero ayuda a que la gente sepa qué esperar antes de escribirte."
      >
        <button
          type="button"
          onClick={() => setMostrarMasInfo((v) => !v)}
          className="self-start font-mono text-xs text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
        >
          {mostrarMasInfo
            ? '− Ocultar'
            : '+ Agregar más información sobre tu negocio (opcional)'}
        </button>

        {mostrarMasInfo && (
          <>
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
          </>
        )}
      </Seccion>

      <Seccion numero="06" titulo="Una foto" ayuda="Ayuda muchísimo a que te encuentren. JPG, PNG o WebP, hasta 5 MB.">
        <CampoFormulario id="foto" etiqueta="Fotografía del negocio" errores={err('foto')}>
          {(p) => (
            <input
              {...p}
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                // Se avisa antes de enviar: subir 8 MB para que el server los
                // rechace gasta los datos del celular de la persona.
                if (f && f.size > TAMANO_MAX_FOTO) {
                  setNombreFoto(`"${f.name}" pesa más de 5 MB — elige otra`);
                  e.target.value = '';
                  return;
                }
                setNombreFoto(f ? f.name : null);
              }}
              className="w-full font-sans text-sm text-tinta/70 file:mr-4 file:border file:border-tinta/20 file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-xs file:text-tinta hover:file:border-terracota hover:file:text-terracota-texto"
            />
          )}
        </CampoFormulario>

        {nombreFoto && <p className="font-mono text-xs text-tinta/50">{nombreFoto}</p>}
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
                    className="mt-1 h-4 w-4 shrink-0 accent-terracota"
                    onChange={(e) => marcarPersonalizado(c.slug, e.target.checked)}
                  />
                  <span className="font-sans text-sm text-tinta/75">
                    {c.etiqueta}
                    {!c.requerido && (
                      <span className="ml-2 font-mono text-xs text-tinta/35">opcional</span>
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
              className="mt-1 h-4 w-4 shrink-0 accent-terracota"
            />
            <span className="font-sans text-sm leading-relaxed text-tinta/75">
              Confirmo que soy dueño o represento este negocio, que la información
              es veraz y que acepto los{' '}
              <Link
                href="/legal/terminos"
                target="_blank"
                className="underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
              >
                términos y condiciones
              </Link>
              .
            </span>
          </label>
          {err('acepto_terminos') && (
            <p className="font-mono text-xs text-terracota-texto">{err('acepto_terminos')![0]}</p>
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
                className="underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
              >
                política de tratamiento de datos
              </Link>
              . Entiendo que los datos del negocio se publican de forma pública.
            </span>
          </label>
          {err('acepto_habeas_data') && (
            <p className="font-mono text-xs text-terracota-texto">
              {err('acepto_habeas_data')![0]}
            </p>
          )}
        </div>
      </Seccion>

      <BarraEnvio faltantes={faltantes} total={REQUISITOS.length} />
      </form>

      <Link
        href="/aliados"
        className="mt-20 inline-block font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
      >
        ← Volver al mapa
      </Link>
    </>
  );
}
