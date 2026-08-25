import type { Metadata } from 'next';
import Link from 'next/link';
import { VERSION_TERMINOS } from '@/lib/validation/portafolio.schema';
import { DocumentoLegal } from '../_components/DocumentoLegal';

export const metadata: Metadata = {
  title: 'Términos y condiciones · Territorio INN 2026',
};

export default function TerminosPage() {
  return (
    <DocumentoLegal
      titulo="Términos y condiciones"
      version={VERSION_TERMINOS}
      actualizado="agosto de 2026"
    >
      <p>
        Estos términos regulan el registro y la publicación de emprendimientos en
        la vitrina digital del módulo Portafolios de Territorio INN 2026.
      </p>

      <h2>01 · Quién puede registrarse</h2>
      <ul>
        <li>
          Personas que sean propietarias del negocio o cuenten con autorización
          para representarlo.
        </li>
        <li>
          El foco del proyecto es la Comuna 3 — Manrique, Medellín, pero durante
          esta etapa de pruebas se acepta cualquier ubicación: el objetivo es
          juntar datos reales para validar el funcionamiento de la vitrina.
        </li>
      </ul>

      <h2>02 · Veracidad de la información</h2>
      <p>
        Quien se registra se compromete a que los datos aportados sean veraces y
        estén actualizados. La información falsa o engañosa es causal de rechazo
        o de retiro de la vitrina.
      </p>

      <h2>03 · Fotografías</h2>
      <p>
        Las imágenes deben ser propias o contar con autorización de uso. No se
        admiten fotografías que infrinjan derechos de autor, ni que incluyan
        personas identificables sin su consentimiento.
      </p>

      <h2>04 · Moderación</h2>
      <p>
        Todo registro pasa por revisión antes de publicarse. El equipo del
        proyecto se reserva el derecho de aprobar, rechazar, editar o retirar
        cualquier contenido. Los rechazos se acompañan de un motivo.
      </p>

      <h2>05 · Contenido prohibido</h2>
      <ul>
        <li>Actividades ilegales o sin los permisos que la ley exija.</li>
        <li>
          Contenido discriminatorio, violento, sexual explícito u ofensivo.
        </li>
        <li>Suplantación de negocios o personas.</li>
        <li>Propaganda política o proselitismo electoral.</li>
      </ul>

      <h2>06 · Naturaleza del servicio</h2>
      <p>
        La vitrina es un directorio informativo de carácter público. El proyecto
        no interviene en las transacciones entre emprendedores y clientes, no
        certifica la calidad de los productos o servicios, y no responde por los
        acuerdos que se pacten entre las partes.
      </p>

      <h2>07 · Gratuidad</h2>
      <p>
        El registro y la permanencia en la vitrina son gratuitos. No se cobra por
        aparecer, ni por aparecer en mejor posición.
      </p>

      <h2>08 · Retiro</h2>
      <p>
        Puedes solicitar el retiro de tu emprendimiento en cualquier momento por
        el canal de atención indicado en la{' '}
        <Link href="/legal/politica-datos">política de tratamiento de datos</Link>.
      </p>
    </DocumentoLegal>
  );
}
