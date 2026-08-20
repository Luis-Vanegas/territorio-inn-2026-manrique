import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { VERSION_TERMINOS_SERVICIO } from '@/lib/validation/servicio.schema';
import { DocumentoLegal } from '../_components/DocumentoLegal';

// Sigue al mismo interruptor que el módulo: si Servicios no está prendido, este
// documento describe algo que no existe, y publicarlo lo volvería falso.
const SERVICIOS_ACTIVO = process.env.NEXT_PUBLIC_MODULO_SERVICIOS === 'true';

export const metadata: Metadata = SERVICIOS_ACTIVO
  ? { title: 'Términos del módulo Servicios · Constelaciones' }
  : { title: 'Constelaciones', robots: { index: false, follow: false } };

export default function TerminosServiciosPage() {
  if (!SERVICIOS_ACTIVO) notFound();

  return (
    <DocumentoLegal
      titulo="Términos y tratamiento de datos — Servicios"
      version={VERSION_TERMINOS_SERVICIO}
      actualizado="agosto de 2026"
      avisoBorrador={false}
      volverA={{ href: '/servicios/registro', texto: '← Volver al formulario' }}
    >
      <p>
        Este documento explica qué es Constelaciones, qué datos te pedimos en el
        módulo <strong>Servicios</strong>, cuáles se publican, cuáles no, y qué
        podés hacer con ellos en cualquier momento. Está escrito para que se
        entienda leyéndolo una vez.
      </p>

      <h2>01 · Qué es este proyecto</h2>
      <p>
        Constelaciones es un <strong>proyecto de investigación</strong>{' '}
        desarrollado como trabajo de un diplomado, presentado en el marco del
        Presupuesto Participativo de la Comuna 3 — Manrique, Medellín, dentro del
        Reto #2 de Empleo y Desarrollo Económico.
      </p>
      <p>
        Tiene dos propósitos, y los dos son ciertos al mismo tiempo. El primero
        es <strong>académico</strong>: entender con datos reales cómo funciona la
        economía del territorio, algo que las cifras oficiales no alcanzan a
        mostrar. El segundo es <strong>práctico</strong>: que la gente del barrio
        pueda encontrar a quien necesita, y que quien trabaja por su cuenta
        consiga más clientes. No es una empresa, no cobra comisión y no vende
        nada.
      </p>

      <h2>02 · Qué se publica</h2>
      <p>
        Únicamente lo esencial para que alguien pueda encontrarte y contactarte:
      </p>
      <ul>
        <li>Tu nombre.</li>
        <li>Tu oficio y la descripción de lo que hacés.</li>
        <li>Tus años de experiencia.</li>
        <li>Los barrios donde atendés.</li>
        <li>Tu teléfono de contacto.</li>
      </ul>
      <p>
        Nada más. Esa información queda visible en internet y puede aparecer en
        buscadores — es justamente lo que hace que te encuentren.
      </p>

      <h2>03 · Qué NO se publica nunca</h2>
      <ul>
        <li>
          Tu fotografía, si decidís subirla. Nunca aparece en tu ficha ni en
          ningún lugar visible del sitio.
        </li>
        <li>
          Tu correo electrónico. Lo usamos solo para avisarte del estado de tu
          registro.
        </li>
        <li>
          Todas las respuestas del último paso del formulario: si de esto vivís,
          qué te dificulta conseguir trabajo, si tenés herramientas, tu
          formación, si tenés ARL y qué necesitás para trabajar mejor.
        </li>
      </ul>
      <p>
        Esas respuestas viven en una base separada de la que alimenta la parte
        pública del sitio, y se usan{' '}
        <strong>únicamente en forma de totales</strong> — por ejemplo «tantas
        personas no tienen ARL», nunca «esta persona no tiene».
      </p>
      <p>
        La foto tiene un propósito distinto al resto de tus datos: no busca
        darte más visibilidad. La guardamos para poder identificarte si llega a
        haber un problema con el servicio que prestaste, y como respaldo del
        compromiso de conducta que aceptás en el punto 07. Solo el equipo del
        proyecto puede verla, y únicamente para atender un reporte.
      </p>

      <h2>04 · Qué NO te pedimos</h2>
      <p>
        No te pedimos tu documento de identidad, ni una foto de él, ni tu
        dirección de residencia, ni datos financieros. No los pedimos y no los
        guardamos: en nuestra base de datos{' '}
        <strong>ni siquiera existe un lugar donde ponerlos</strong>.
      </p>

      <h2>05 · Los límites, en concreto</h2>
      <ul>
        <li>
          Tus datos se usan <strong>solo</strong> para la investigación de este
          proyecto y para publicar tu servicio.
        </li>
        <li>
          <strong>No se usan para ninguna otra finalidad</strong> distinta de
          esas dos.
        </li>
        <li>
          <strong>No se comparten con terceros</strong>, ni se ceden, ni se
          venden. A nadie.
        </li>
        <li>No se usan para publicidad ni para armar perfiles de nadie.</li>
      </ul>

      <h2>06 · Tu autorización</h2>
      <p>
        Antes de enviar el formulario tenés que marcar las casillas de
        aceptación y confirmar en una última pantalla que estás seguro. Esa
        confirmación es tu autorización, conforme a la Ley 1581 de 2012 de
        Colombia, y queda registrada con la fecha y la versión de este documento
        que aceptaste. Si el texto cambia después, tu autorización sigue
        asociada a la versión que efectivamente leíste.
      </p>

      <h2>07 · Tu compromiso</h2>
      <p>
        Como vas a prestar un servicio en la casa de otra persona, al
        registrarte aceptás también un compromiso de conducta: identificarte al
        llegar, acordar el precio y el alcance antes de empezar, no ingresar a
        áreas que no te autorizaron y respetar la propiedad de quien te
        contrata.
      </p>
      <p>
        Tu foto, si la subiste, queda guardada en privado como respaldo de este
        compromiso: no es una vitrina, es la forma en que el equipo puede saber
        con quién está tratando si algo sale mal.
      </p>
      <p>
        Ese compromiso es lo que se muestra en tu ficha pública. No es una
        verificación —el proyecto no comprueba identidad ni antecedentes de
        nadie— pero sí le dice a quien te va a contratar que pusiste tu nombre y
        tu palabra.
      </p>

      <h2>08 · Qué NO es Constelaciones</h2>
      <p>
        Es un <strong>directorio</strong>. No te emplea, no te contrata, no
        interviene en los pagos, no certifica tu competencia técnica y no
        responde por los servicios que acuerdes con un cliente. La relación es
        directa entre vos y la persona que te contacta.
      </p>

      <h2>09 · Podés borrarlo todo cuando quieras</h2>
      <p>
        Apenas envíes el registro te damos un <strong>enlace privado</strong>.
        Con ese enlace, sin contraseña ni trámite, podés ver tu ficha,
        corregirla o eliminarla por completo en cualquier momento. Guardalo: es
        la única llave, y no la tenemos duplicada.
      </p>
      <p>
        También podés escribirnos por el{' '}
        <Link href="/contacto">formulario de contacto</Link> para conocer,
        actualizar, rectificar o suprimir tu información, pedir prueba de la
        autorización que diste, o revocarla.
      </p>

      <h2>10 · Moderación</h2>
      <p>
        Ningún registro se publica automáticamente: alguien del equipo lo revisa
        antes. También podemos retirar una ficha si recibimos un reporte, sin
        que eso implique un juicio sobre la persona — se suspende mientras se
        revisa.
      </p>
    </DocumentoLegal>
  );
}
