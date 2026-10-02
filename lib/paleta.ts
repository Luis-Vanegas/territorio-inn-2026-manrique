/**
 * Paleta de noche (DESIGN.md › Firmamento): hex fijos, no cambian con el tema.
 * ÚNICO lugar donde viven los valores: `tailwind.config.ts` los esparce en
 * `colors`, el CSS los lee con `theme('colors.<nombre>')` y los SVG en texto
 * (`components/mapa/formas.ts`, `lib/categorias/grupos.ts`) importan de acá.
 * Sin imports de valor: lo carga tailwind.config.ts.
 */
export const PALETA_NOCHE = {
  noche: '#0B1026',
  'noche-2': '#121A3A',
  'noche-3': '#1A2450',
  'noche-activa': '#202C62', // fila activa de las tablas; el #23306A del prototipo dejaba tenue-2 y ladrillo en 4,3:1
  trazo: '#2C3A72', // solo decorativo: líneas, rejillas (1,6:1, no sirve de borde de control)
  'trazo-2': '#6573B0', // bordes de chips, botones e inputs: 3,75:1 sobre noche-2
  estrella: '#F3EFE4',
  tenue: '#B7BEDC',
  'tenue-2': '#8E97C2', // no usar sobre noche-activa (4,3:1)
  sodio: '#F4CC48',
  ladrillo: '#D9825B',
  'noche-morado': '#E07AD8',
  'noche-azul': '#7FB0FF',
  menta: '#5EEAD4',
} as const;
