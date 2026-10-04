import { ESTRELLA_PATH } from '@/components/mapa/formas';
import type { RolFirmamento } from '@/lib/firmamento/navegacion';

/**
 * El sello de cada rol (DESIGN.md › Firmamento con sesión): ✦ negocio sobre
 * `amarillo`, ● equipo sobre `azul`, ■ entidad sobre `morado`. La forma es la
 * que distingue (no solo el color) y el texto de al lado dice el rol, así que
 * el sello es decorativo. Fondo y forma son fijos: se leen igual con el sitio en
 * claro o en oscuro.
 */
const SELLO: Record<RolFirmamento, { fondo: string; forma: string }> = {
  negocio: { fondo: 'bg-amarillo', forma: '#0B1026' },
  equipo: { fondo: 'bg-noche-azul', forma: '#0B1026' },
  entidad: { fondo: 'bg-noche-morado', forma: '#0B1026' },
};

export function FormaRol({ rol, tamano = 40 }: { rol: RolFirmamento; tamano?: number }) {
  const { fondo, forma } = SELLO[rol];
  return (
    <span
      aria-hidden="true"
      style={{ width: tamano, height: tamano }}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${fondo}`}
    >
      <svg viewBox="0 0 24 24" width={tamano * 0.5} height={tamano * 0.5} focusable="false">
        {rol === 'negocio' && <path d={ESTRELLA_PATH} fill={forma} />}
        {rol === 'equipo' && <circle cx="12" cy="12" r="9" fill={forma} />}
        {rol === 'entidad' && <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" fill={forma} />}
      </svg>
    </span>
  );
}
