import type { Metadata } from 'next';
import Link from 'next/link';
import { VERSION_TERMINOS } from '@/lib/validation/portafolio.schema';
import { DocumentoLegal } from '../_components/DocumentoLegal';

export const metadata: Metadata = {
  title: 'Política de tratamiento de datos · Territorio INN 2026',
};

export default function PoliticaDatosPage() {
  return (
    <DocumentoLegal
      titulo="Política de tratamiento de datos personales"
      version={VERSION_TERMINOS}
      actualizado="septiembre de 2026"
    >
      <p>
        Esta política describe cómo se recolectan, usan y protegen los datos
        personales entregados en el módulo Portafolios de Territorio INN 2026,
        conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y la Ley 1712 de
        2014 de la República de Colombia.
      </p>

      <h2>01 · Responsable del tratamiento</h2>
      <p>
        El equipo estudiantil del proyecto Territorio INN 2026 — Reto #2: Empleo
        y Desarrollo Económico, presentado en el marco del Presupuesto
        Participativo de la Comuna 3, Manrique, Medellín. Es un proyecto
        académico y no representa a ninguna institución.
      </p>

      <h2>02 · Datos que se recolectan</h2>
      <p>
        Se pide solo lo esencial para publicar el emprendimiento y permitir el
        contacto — nunca documento de identidad, datos financieros ni
        información sensible.
      </p>
      <ul>
        <li>Nombre del emprendimiento y descripción de la actividad.</li>
        <li>Dirección, barrio y coordenadas geográficas del establecimiento.</li>
        <li>
          Medios de contacto suministrados: WhatsApp, teléfono, correo
          electrónico y redes sociales.
        </li>
        <li>Fotografía del negocio, cuando se aporta.</li>
        <li>
          Dirección IP desde la que se realiza el registro, con fines de
          seguridad y prevención de abuso.
        </li>
      </ul>

      <h2>03 · Finalidad</h2>
      <ul>
        <li>
          Publicar el emprendimiento en la vitrina digital pública del proyecto,
          para darle visibilidad comercial dentro y fuera de la comuna.
        </li>
        <li>Permitir que la ciudadanía contacte directamente al emprendedor.</li>
        <li>
          Producir estadísticas agregadas y anónimas sobre la actividad económica
          del territorio.
        </li>
        <li>
          Fines estudiantiles y académicos: este proyecto se presenta como
          ejercicio de un reto de Presupuesto Participativo, no como una
          actividad comercial del equipo.
        </li>
      </ul>
      <p>
        Los datos no se venden, ni se ceden a terceros con fines comerciales, ni
        se usan para finalidades distintas de las enunciadas.
      </p>

      <h2>04 · Publicidad de la información</h2>
      <p>
        Al aprobarse el registro, los datos del emprendimiento —incluidos los
        medios de contacto y la ubicación— quedan visibles de forma pública en
        internet. La dirección IP y los registros de consentimiento no se
        publican: son de uso interno.
      </p>

      <h2>05 · Derechos del titular</h2>
      <p>
        Como titular de los datos puedes conocer, actualizar, rectificar y
        suprimir tu información; solicitar prueba de la autorización otorgada;
        ser informado sobre el uso dado a tus datos; presentar quejas ante la
        Superintendencia de Industria y Comercio; y revocar la autorización.
      </p>

      <h2>06 · Cómo ejercerlos</h2>
      <p>
        Escribiendo al equipo del proyecto por el{' '}
        <Link href="/contacto">formulario de contacto</Link>, indicando el
        nombre del emprendimiento y el código de registro entregado al
        inscribirse. La solicitud se responde en los términos de ley.
      </p>

      <h2>07 · Dónde se almacenan los datos</h2>
      <p>
        La base de datos y las fotografías se alojan en proveedores de
        infraestructura en la nube (Neon y Vercel) cuyos servidores están fuera
        de Colombia, conforme al artículo 26 del Decreto 1377 de 2013. Al
        aceptar esta política autorizas esa transferencia internacional, que se
        hace únicamente para operar el servicio — no se comparten los datos con
        terceros distintos de estos proveedores de infraestructura.
      </p>

      <h2>08 · Conservación</h2>
      <p>
        Los datos se conservan mientras el emprendimiento permanezca activo en la
        vitrina o hasta que se solicite su supresión. Al archivarse un registro,
        la fotografía asociada se elimina del almacenamiento.
      </p>

      <h2>09 · Cambios</h2>
      <p>
        Cada registro guarda la versión de la política vigente al momento de
        aceptarla. Si esta política cambia, los consentimientos previos quedan
        asociados a la versión que efectivamente se aceptó.
      </p>
    </DocumentoLegal>
  );
}
