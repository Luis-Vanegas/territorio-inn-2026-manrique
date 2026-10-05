import type { Map as MapaLeaflet } from 'leaflet';

/**
 * Frena un zoom o vuelo en curso al desmontar. react-leaflet puede haber borrado
 * ya el mapa (`map.remove()`) cuando corre la limpieza de sus hijos, y `stop()`
 * sobre un mapa borrado lanza `_leaflet_pos` (pasó en producción al navegar por
 * el menú desde el Inicio). Borrado no tiene animación que frenar: se ignora.
 */
export function detenerMapa(mapa: MapaLeaflet) {
  try {
    mapa.stop();
  } catch {
    // ya desmontado
  }
}
