'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';

import { Stepper, type Paso } from '@/components/Stepper';
import { ConfirmarEnvio } from './ConfirmarEnvio';
import {
  registrarServicio,
  type EstadoRegistroServicio,
  type ValoresEnviados,
} from '@/lib/actions/registrarServicio';
import {
  OPCIONES_COMO_CONSIGUE,
  OPCIONES_FORMACION,
  OPCIONES_NECESITA,
} from '@/lib/validation/servicio.schema';
import { TAMANO_MAX_FOTO } from '@/lib/validation/portafolio.schema';
import { comprimirImagen, pesoLegible } from '@/lib/imagen/comprimir';

const ESTADO_INICIAL: EstadoRegistroServicio = { estado: 'inicial' };

const BARRIOS_COMUNA_3 = [
  'El Raizal',
  'El Pomar',
  'La Salle',
  'Las Granjas',
  'Santa Inés',
  'Campo Valdés No. 1',
  'San José de la Cima No. 1',
  'San José de la Cima No. 2',
  'La Cruz',
  'Oriente',
  'Versalles No. 1',
  'Versalles No. 2',
  'Manrique Oriental',
  'Manrique Central No. 2',
  'María Cano - Carambolas',
];

const ETIQUETAS_COMO_CONSIGUE: Record<(typeof OPCIONES_COMO_CONSIGUE)[number], string> = {
  voz_a_voz: 'De boca en boca',
  redes: 'Por redes sociales',
  volantes: 'Volantes o carteles',
  ninguno: 'Todavía no consigo',
  otro: 'De otra forma',
};

const ETIQUETAS_FORMACION: Record<(typeof OPCIONES_FORMACION)[number], string> = {
  sena: 'SENA',
  tecnico: 'Técnico o tecnólogo',
  empirico: 'Aprendí trabajando',
  ninguna: 'Ninguna',
};

const ETIQUETAS_NECESITA: Record<(typeof OPCIONES_NECESITA)[number], string> = {
  herramientas: 'Herramientas',
  capacitacion: 'Capacitación',
  transporte: 'Transporte',
  capital: 'Capital',
  clientes: 'Más clientes',
};

// Qué campo pertenece a qué paso. Sirve para saltar al paso correcto cuando el
// servidor devuelve un error: hacerle buscar a la persona en cuál de los
// cuatro pasos está el problema sería trasladarle nuestro trabajo.
const PASO_DE_CAMPO: Record<string, number> = {
  nombres: 0,
  apellidos: 0,
  categoria_id: 0,
  categoria_otra: 0,
  descripcion: 0,
  anos_experiencia: 0,
  cobertura: 1,
  telefono: 2,
  foto: 2,
  correo: 2,
  mayor_dificultad: 3,
  acepto_terminos: 3,
  acepto_habeas_data: 3,
  acepto_codigo_conducta: 3,
  acepto_investigacion: 3,
};

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-terracota';

const claseEtiqueta = 'block font-mono text-xs uppercase tracking-wider text-tinta/65';

function Error({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null;
  return (
    <p role="alert" className="mt-2 font-sans text-xs text-terracota">
      {mensajes[0]}
    </p>
  );
}

function Campo({
  etiqueta,
  ayuda,
  children,
  errores,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
  errores?: string[];
}) {
  return (
    <div>
      <label className={claseEtiqueta}>{etiqueta}</label>
      {ayuda && <p className="mt-1 font-sans text-xs text-tinta/50">{ayuda}</p>}
      <div className="mt-2">{children}</div>
      <Error mensajes={errores} />
    </div>
  );
}

/** Sí / No / prefiero no decir. Un booleano no alcanza: "no contestó" es un dato. */
function TriEstado({
  nombre,
  etiqueta,
  valorPrevio,
}: {
  nombre: string;
  etiqueta: string;
  /** true → 'si' marcado, false → 'no' marcado, null/undefined → ninguno. */
  valorPrevio?: boolean | null;
}) {
  return (
    <fieldset>
      <legend className={claseEtiqueta}>{etiqueta}</legend>
      <div className="mt-2 flex gap-5">
        {[
          { v: 'si', t: 'Sí' },
          { v: 'no', t: 'No' },
        ].map(({ v, t }) => (
          <label key={v} className="flex items-center gap-2 font-sans text-sm text-tinta/80">
            <input
              type="radio"
              name={nombre}
              value={v}
              defaultChecked={valorPrevio === (v === 'si')}
              className="accent-terracota"
            />
            {t}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormularioServicio({
  categorias,
}: {
  categorias: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(registrarServicio, ESTADO_INICIAL);
  const [paso, setPaso] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [iniciadoEn] = useState(() => Date.now());
  // Aviso de la foto elegida: sin esto, un archivo demasiado grande solo se
  // descubría al enviar, y el error volvía como una pantalla genérica.
  const [nombreFoto, setNombreFoto] = useState<string | null>(null);

  const errores = useMemo(
    () => (estado.estado === 'error' ? (estado.errores ?? {}) : {}),
    [estado],
  );

  const valoresPrevios: Partial<ValoresEnviados> = useMemo(
    () => (estado.estado === 'error' ? (estado.valores ?? {}) : {}),
    [estado],
  );

  // Al volver con errores, saltar al primer paso que tenga uno: hacerle buscar
  // a la persona en cuál de los cuatro pasos está el problema sería pasarle
  // nuestro trabajo.
  //
  // También lleva la cuenta de cuántas respuestas llegaron (`intentoId`):
  // React 19 resetea los inputs no controlados al terminar CUALQUIER acción,
  // así que sin repoblar explícitamente la persona perdería las cuatro
  // pantallas por, por ejemplo, olvidarse de elegir la foto. `defaultValue` /
  // `defaultChecked` solo se aplican al MONTAR un input — por eso los campos
  // de abajo lo combinan con `key={intentoId}`: cambiar la key fuerza a React
  // a recrear el nodo con el valor nuevo en vez de ignorarlo.
  //
  // Se ajusta DURANTE el render y no en un efecto. Un efecto acá dispararía un
  // segundo render en cascada —y el linter lo marca con razón—; comparar la
  // respuesta anterior con la nueva en el cuerpo del componente es el patrón
  // que React documenta para derivar estado de un cambio de props.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  const [intentoId, setIntentoId] = useState(0);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    setIntentoId((n) => n + 1);
    // `categoria_id` es el único campo CONTROLADO del formulario (necesita
    // estado de React para mostrar/ocultar "¿Cuál?" cuando elige "otros"). El
    // reset nativo de React 19 actúa sobre el DOM sin pasar por `onChange`,
    // así que el `<select>` queda visualmente vacío aunque el estado interno
    // no haya cambiado — React no tiene forma de notar la diferencia sin este
    // empujón explícito. Los demás campos, no controlados, se repueblan más
    // abajo con `defaultValue`/`defaultChecked` + `key={intentoId}`.
    if (estado.estado === 'error') setCategoria(estado.valores?.categoria_id ?? '');
    const primero = Object.keys(errores)[0];
    const destino = primero === undefined ? undefined : PASO_DE_CAMPO[primero];
    if (destino !== undefined) setPaso(destino);
  }

  const pasos: Paso[] = useMemo(
    () => [
      {
        titulo: 'Qué sabes hacer',
        ayuda: 'Esto es lo que va a leer quien necesita tu servicio.',
        contenido: (
          <div className="flex flex-col gap-8">
            <Campo
              etiqueta="Nombres"
              ayuda="Se guardan completos, en privado. En tu ficha pública solo se ve el primero, junto con tu primer apellido."
              errores={errores.nombres}
            >
              <input
                key={`nombres-${intentoId}`}
                name="nombres"
                defaultValue={valoresPrevios.nombres}
                className={claseInput}
                placeholder="Juan Pablo"
              />
            </Campo>

            <Campo etiqueta="Apellidos" errores={errores.apellidos}>
              <input
                key={`apellidos-${intentoId}`}
                name="apellidos"
                defaultValue={valoresPrevios.apellidos}
                className={claseInput}
                placeholder="Gómez Ríos"
              />
            </Campo>

            <Campo etiqueta="Tu oficio" errores={errores.categoria_id}>
              {/* No controlado a propósito, igual que el resto del paso 4: un
                  <select> CONTROLADO (`value=`) no tiene "valor por defecto"
                  nativo, así que cuando React 19 resetea el formulario al
                  terminar la acción, el navegador lo manda al primer <option>
                  (vacío) — y como el estado `categoria` en memoria nunca
                  cambió, React no nota la diferencia y no lo reaplica. Con
                  `defaultValue` + `key={intentoId}`, el nodo se remonta con el
                  valor correcto como SU PROPIO default, inmune a ese reset.
                  `onChange` sigue actualizando `categoria` — eso es solo para
                  mostrar u ocultar "¿Cuál?" cuando elige "otros". */}
              <select
                key={`categoria_id-${intentoId}`}
                name="categoria_id"
                defaultValue={valoresPrevios.categoria_id ?? ''}
                onChange={(e) => setCategoria(e.target.value)}
                className={claseInput}
              >
                <option value="">Elige uno…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            {categoria === 'otros' && (
              <Campo etiqueta="¿Cuál?" errores={errores.categoria_otra}>
                <input
                  key={`categoria_otra-${intentoId}`}
                  name="categoria_otra"
                  defaultValue={valoresPrevios.categoria_otra ?? ''}
                  className={claseInput}
                  placeholder="Escribilo"
                />
              </Campo>
            )}

            <Campo
              etiqueta="¿Qué haces exactamente?"
              ayuda="Mientras más concreto, más confianza genera. Ej: “Reparo lavadoras y neveras, hago diagnóstico a domicilio sin costo.”"
              errores={errores.descripcion}
            >
              <textarea
                key={`descripcion-${intentoId}`}
                name="descripcion"
                rows={4}
                defaultValue={valoresPrevios.descripcion}
                className={claseInput}
                maxLength={400}
              />
            </Campo>

            <Campo etiqueta="Años de experiencia" errores={errores.anos_experiencia}>
              <input
                key={`anos_experiencia-${intentoId}`}
                name="anos_experiencia"
                type="number"
                min={0}
                max={70}
                defaultValue={valoresPrevios.anos_experiencia}
                className={claseInput}
                placeholder="5"
              />
            </Campo>
          </div>
        ),
      },
      {
        titulo: 'Dónde atiendes',
        ayuda:
          'Elige los barrios a los que puedes ir. No te pedimos tu dirección: no la guardamos ni la publicamos.',
        contenido: (
          <div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {BARRIOS_COMUNA_3.map((b) => (
                <label
                  key={b}
                  className="flex items-center gap-2.5 font-sans text-sm text-tinta/80"
                >
                  <input
                    key={`${b}-${intentoId}`}
                    type="checkbox"
                    name="cobertura"
                    value={b}
                    defaultChecked={(valoresPrevios.cobertura ?? []).includes(b)}
                    className="accent-terracota"
                  />
                  {b}
                </label>
              ))}
            </div>
            <Error mensajes={errores.cobertura} />
          </div>
        ),
      },
      {
        titulo: 'Cómo te contactan',
        ayuda: 'El teléfono es lo único de este paso que se publica.',
        contenido: (
          <div className="flex flex-col gap-8">
            <Campo
              etiqueta="Teléfono o WhatsApp"
              ayuda="Se publica. Es la única forma que va a tener la gente de escribirte."
              errores={errores.telefono}
            >
              <input
                key={`telefono-${intentoId}`}
                name="telefono"
                defaultValue={valoresPrevios.telefono}
                className={claseInput}
                placeholder="300 123 4567"
              />
            </Campo>

            <Campo
              etiqueta="Correo (opcional)"
              ayuda="NO se publica. Lo usamos solo para avisarte del estado de tu registro."
              errores={errores.correo}
            >
              <input
                key={`correo-${intentoId}`}
                name="correo"
                type="email"
                defaultValue={valoresPrevios.correo ?? ''}
                className={claseInput}
              />
            </Campo>

            <Campo
              etiqueta="Una foto tuya (privada, obligatoria)"
              ayuda="No se publica en ningún lado ni se muestra en tu ficha. La pedimos siempre para poder identificarte si llega a haber un problema — es lo que respalda el compromiso que aceptas en el último paso. JPG, PNG o WebP, hasta 5 MB."
              errores={errores.foto}
            >
              <input
                name="foto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  // `e.target` se guarda ANTES del await: después de un punto de
                  // suspensión React ya limpió `currentTarget`.
                  const input = e.target;
                  const f = input.files?.[0];

                  if (!f) {
                    setNombreFoto(null);
                    return;
                  }

                  // Se avisa antes de enviar: subir una foto que el servidor va a
                  // rechazar gasta los datos del celular de la persona al pedo.
                  if (f.size > TAMANO_MAX_FOTO) {
                    setNombreFoto(`"${f.name}" pesa más de 5 MB — elige otra`);
                    input.value = '';
                    return;
                  }

                  setNombreFoto(`${f.name} · optimizando…`);

                  // Se reemplaza el archivo del input por la versión liviana: es
                  // lo que efectivamente viaja al enviar el formulario.
                  const optimizada = await comprimirImagen(f);
                  if (optimizada !== f) {
                    const dt = new DataTransfer();
                    dt.items.add(optimizada);
                    input.files = dt.files;
                    setNombreFoto(
                      `${f.name} · ${pesoLegible(f.size)} → ${pesoLegible(optimizada.size)}`,
                    );
                  } else {
                    setNombreFoto(`${f.name} · ${pesoLegible(f.size)}`);
                  }
                }}
                className="font-sans text-sm text-tinta/70 file:mr-3 file:border file:border-tinta/20 file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-tinta/70"
              />
              {nombreFoto && (
                <p className="mt-2 font-mono text-xs text-tinta/50">{nombreFoto}</p>
              )}
            </Campo>
          </div>
        ),
      },
      {
        titulo: 'Para el proyecto',
        ayuda:
          'Estas respuestas NO se publican. Son para entender qué necesita quien trabaja por su cuenta en Manrique.',
        contenido: (
          <div className="flex flex-col gap-8">
            <Campo
              etiqueta="¿Qué es lo que más te dificulta conseguir trabajo?"
              errores={errores.mayor_dificultad}
            >
              <textarea
                key={`mayor_dificultad-${intentoId}`}
                name="mayor_dificultad"
                rows={3}
                defaultValue={valoresPrevios.mayor_dificultad}
                className={claseInput}
                maxLength={300}
              />
            </Campo>

            <Campo etiqueta="¿Cómo consigues clientes hoy?">
              <select
                key={`como_consigue_clientes-${intentoId}`}
                name="como_consigue_clientes"
                defaultValue={valoresPrevios.como_consigue_clientes ?? ''}
                className={claseInput}
              >
                <option value="">Prefiero no decir</option>
                {OPCIONES_COMO_CONSIGUE.map((o) => (
                  <option key={o} value={o}>
                    {ETIQUETAS_COMO_CONSIGUE[o]}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="¿Formación en el oficio?">
              <select
                key={`formacion-${intentoId}`}
                name="formacion"
                defaultValue={valoresPrevios.formacion ?? ''}
                className={claseInput}
              >
                <option value="">Prefiero no decir</option>
                {OPCIONES_FORMACION.map((o) => (
                  <option key={o} value={o}>
                    {ETIQUETAS_FORMACION[o]}
                  </option>
                ))}
              </select>
            </Campo>

            <TriEstado
              key={`ingreso_principal-${intentoId}`}
              nombre="ingreso_principal"
              etiqueta="¿De esto vives principalmente?"
              valorPrevio={valoresPrevios.ingreso_principal}
            />
            <TriEstado
              key={`herramientas_propias-${intentoId}`}
              nombre="herramientas_propias"
              etiqueta="¿Tienes herramientas propias?"
              valorPrevio={valoresPrevios.herramientas_propias}
            />
            <TriEstado
              key={`tiene_arl-${intentoId}`}
              nombre="tiene_arl"
              etiqueta="¿Tienes ARL o seguridad social?"
              valorPrevio={valoresPrevios.tiene_arl}
            />
            <TriEstado
              key={`sale_de_comuna-${intentoId}`}
              nombre="sale_de_comuna"
              etiqueta="¿Puedes salir de la Comuna 3?"
              valorPrevio={valoresPrevios.sale_de_comuna}
            />

            <fieldset>
              <legend className={claseEtiqueta}>¿Qué necesitas para trabajar mejor?</legend>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                {OPCIONES_NECESITA.map((o) => (
                  <label
                    key={o}
                    className="flex items-center gap-2 font-sans text-sm text-tinta/80"
                  >
                    <input
                      key={`${o}-${intentoId}`}
                      type="checkbox"
                      name="necesita"
                      value={o}
                      defaultChecked={(valoresPrevios.necesita ?? []).includes(o)}
                      className="accent-terracota"
                    />
                    {ETIQUETAS_NECESITA[o]}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Código de conducta: no es un checkbox más. Es el compromiso que
                queda registrado con fecha, versión e IP. */}
            <div className="border-l-2 border-terracota bg-terracota/[0.04] px-4 py-4">
              <p className="font-mono text-xs uppercase tracking-wider text-tinta/65">
                Compromiso
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4 font-sans text-sm leading-relaxed text-tinta/80">
                <li>Me identifico al llegar donde el cliente.</li>
                <li>Acuerdo el precio y el alcance antes de empezar.</li>
                <li>No ingreso a áreas de la casa que no me autorizaron.</li>
                <li>Respeto la propiedad de quien me contrata.</li>
              </ul>
              <label className="mt-4 flex items-start gap-2.5 font-sans text-sm text-tinta">
                <input
                  key={`acepto_codigo_conducta-${intentoId}`}
                  type="checkbox"
                  name="acepto_codigo_conducta"
                  defaultChecked={Boolean(valoresPrevios.acepto_codigo_conducta)}
                  className="mt-1 accent-terracota"
                />
                Me comprometo a cumplirlo.
              </label>
              <Error mensajes={errores.acepto_codigo_conducta} />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-2.5 font-sans text-sm text-tinta">
                <input
                  key={`acepto_terminos-${intentoId}`}
                  type="checkbox"
                  name="acepto_terminos"
                  defaultChecked={Boolean(valoresPrevios.acepto_terminos)}
                  className="mt-1 accent-terracota"
                />
                <span>
                  Leí y acepto los{' '}
                  <Link
                    href="/legal/servicios"
                    target="_blank"
                    className="text-terracota underline underline-offset-2"
                  >
                    términos del módulo Servicios
                  </Link>{' '}
                  — qué es este proyecto, qué se publica y qué no.
                </span>
              </label>
              <Error mensajes={errores.acepto_terminos} />

              <label className="flex items-start gap-2.5 font-sans text-sm text-tinta">
                <input
                  key={`acepto_habeas_data-${intentoId}`}
                  type="checkbox"
                  name="acepto_habeas_data"
                  defaultChecked={Boolean(valoresPrevios.acepto_habeas_data)}
                  className="mt-1 accent-terracota"
                />
                <span>
                  Autorizo que guarden y traten mis datos, y entiendo que mi
                  nombre, mi foto, mi oficio y mi teléfono quedan{' '}
                  <strong className="font-medium">públicos en internet</strong>.
                </span>
              </label>
              <Error mensajes={errores.acepto_habeas_data} />

              {/* Este checkbox FALTABA, y era lo que impedía guardar: el schema lo
                  exige con `z.literal(true)`, así que sin él `desdeFormData` leía
                  `null`, la validación fallaba siempre y —como tampoco había dónde
                  pintar su error— el formulario volvía al paso 4 sin decir nada.
                  Nadie podía registrarse.

                  Se agrega el campo en vez de sacar el requisito del schema porque
                  `crearServicio` guarda `acepto_investigacion = true` en la base:
                  sin una casilla real que la persona marque, esa fila afirmaría un
                  consentimiento que nunca dio. */}
              <label className="flex items-start gap-2.5 font-sans text-sm text-tinta">
                <input
                  key={`acepto_investigacion-${intentoId}`}
                  type="checkbox"
                  name="acepto_investigacion"
                  defaultChecked={Boolean(valoresPrevios.acepto_investigacion)}
                  className="mt-1 accent-terracota"
                />
                <span>
                  Autorizo que las respuestas de este último paso se usen en la{' '}
                  <strong className="font-medium">investigación del proyecto</strong>
                  , siempre en forma de totales y nunca publicadas junto a mi
                  nombre.
                </span>
              </label>
              <Error mensajes={errores.acepto_investigacion} />
            </div>
          </div>
        ),
      },
    ],
    [categorias, categoria, errores, valoresPrevios, intentoId, nombreFoto],
  );

  const ultimo = paso === pasos.length - 1;

  return (
    <form action={accion} noValidate>
      <input type="hidden" name="iniciado_en" value={iniciadoEn} />
      {/* Trampa para bots. Oculta visualmente, no con `hidden`: un bot que
          parsea el HTML la llena igual, una persona nunca la ve. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <input name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      {estado.estado === 'error' && estado.mensaje && (
        <p
          role="alert"
          className="mb-8 border-l-2 border-terracota bg-terracota/[0.04] px-4 py-3 font-sans text-sm text-tinta"
        >
          {estado.mensaje}
        </p>
      )}

      <Stepper
        pasos={pasos}
        actual={paso}
        onCambiar={setPaso}
        pie={
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setPaso((p) => Math.max(0, p - 1))}
              disabled={paso === 0}
              className="min-h-11 font-mono text-sm text-tinta/65 hover:text-tinta disabled:opacity-30"
            >
              ← Atrás
            </button>

            {ultimo ? (
              <ConfirmarEnvio />
            ) : (
              <button
                type="button"
                onClick={() => setPaso((p) => Math.min(pasos.length - 1, p + 1))}
                className="min-h-11 border border-tinta/25 px-6 py-2.5 font-mono text-sm text-tinta transition-colors hover:border-terracota hover:text-terracota"
              >
                Siguiente →
              </button>
            )}
          </div>
        }
      />
    </form>
  );
}
