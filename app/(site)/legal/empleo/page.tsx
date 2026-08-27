import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { VERSION_TERMINOS_EMPLEO } from '@/lib/validation/candidato.schema';
import { DocumentoLegal } from '../_components/DocumentoLegal';

const EMPLEO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_EMPLEO === 'true';

export const metadata: Metadata = EMPLEO_ACTIVO
  ? { title: 'Términos del módulo Empleo · Constelaciones' }
  : { title: 'Constelaciones', robots: { index: false, follow: false } };

export default function TerminosEmpleoPage() {
  if (!EMPLEO_ACTIVO) notFound();

  return (
    <DocumentoLegal
      titulo="Términos y tratamiento de datos — Empleo"
      version={VERSION_TERMINOS_EMPLEO}
      actualizado="agosto de 2026"
      avisoBorrador={false}
      volverA={{ href: '/empleo/registro', texto: '← Volver al formulario' }}
    >
      <p>
        Este documento explica qué es Constelaciones, qué datos te pedimos en
        el módulo <strong>Empleo</strong>, cuáles se publican y qué puedes
        hacer con ellos en cualquier momento.
      </p>

      <h2>01 · Qué es este proyecto</h2>
      <p>
        Constelaciones es un <strong>proyecto de investigación</strong>{' '}
        desarrollado como trabajo de un diplomado, presentado en el marco del
        Presupuesto Participativo de la Comuna 3 — Manrique, Medellín, dentro
        del Reto #2 de Empleo y Desarrollo Económico. No es una empresa, no
        cobra comisión y no vende nada.
      </p>

      <h2>02 · Qué se publica</h2>
      <p>
        A diferencia de otros módulos del sitio, acá <strong>no hay datos
        reservados</strong>: quien busca trabajo quiere que lo encuentren, así
        que todo lo que pedimos es exactamente lo que se publica.
      </p>
      <ul>
        <li>Tu nombre.</li>
        <li>Tu teléfono de contacto.</li>
        <li>Tu nivel de formación y, si aplica, tu programa o carrera.</li>
        <li>Qué sabes hacer y qué tipo de trabajo buscas.</li>
      </ul>

      <h2>03 · Qué NO te pedimos</h2>
      <p>
        No te pedimos tu documento de identidad, ni una foto, ni tu dirección
        de residencia, ni tu correo, ni datos financieros. No los pedimos y no
        los guardamos.
      </p>

      <h2>04 · Los límites, en concreto</h2>
      <ul>
        <li>
          Tus datos se usan <strong>solo</strong> para publicar tu perfil en
          este directorio.
        </li>
        <li>
          <strong>No se comparten con terceros</strong>, ni se ceden, ni se
          venden. A nadie.
        </li>
        <li>No se usan para publicidad ni para armar perfiles de nadie.</li>
      </ul>

      <h2>05 · Tu autorización</h2>
      <p>
        Antes de enviar el formulario tienes que marcar las casillas de
        aceptación. Esa confirmación es tu autorización, conforme a la Ley
        1581 de 2012 de Colombia, y queda registrada con la fecha y la versión
        de este documento que aceptaste.
      </p>

      <h2>06 · Qué NO es Constelaciones</h2>
      <p>
        Es un <strong>directorio</strong>. No te emplea, no te contrata, no
        interviene en la contratación ni en los pagos, y no certifica tu
        experiencia — es lo que cada quien cuenta de sí mismo.
      </p>

      <h2>07 · Cómo corregir o borrar tus datos</h2>
      <p>
        Escríbenos por el{' '}
        <Link href="/contacto">formulario de contacto</Link> para conocer,
        actualizar, rectificar o suprimir tu información, pedir prueba de la
        autorización que diste, o revocarla.
      </p>

      <h2>08 · Moderación</h2>
      <p>
        Ningún registro se publica automáticamente: alguien del equipo lo
        revisa antes, para filtrar spam y datos falsos.
      </p>
    </DocumentoLegal>
  );
}
