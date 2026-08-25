// Tarjeta de Open Graph — la imagen que se ve al compartir el link.
//
// Importa más de lo que parece: el canal real de este proyecto es WhatsApp
// entre vecinos, no Twitter. Sin esto, compartir el sitio manda un link pelado
// sin título ni imagen, y un link pelado en un grupo de barrio no lo toca nadie.
//
// Se genera con `ImageResponse` (viene en Next, cero dependencias) en vez de
// mantener un PNG en public/: el archivo estático habría que reexportarlo a
// mano cada vez que cambie el texto, y un PNG desactualizado es peor que no
// tener ninguno.
//
// Va con la tipografía por defecto de Satori y no con Fraunces a propósito:
// meter la fuente real obliga a descargar el archivo en tiempo de build, es
// decir una dependencia de red para que el build pase. El sistema se sostiene
// acá con el color y la escala, que es lo que se lee en una miniatura.

import { ImageResponse } from 'next/og';

export const alt = 'Constelaciones · Manrique — Comuna 3, Medellín';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const HUESO = '#f7f5f0';
const TINTA = '#1a1a1a';
const TERRACOTA = '#c55a3c';

export default function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: HUESO,
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', color: TERRACOTA, fontSize: 26, letterSpacing: 6 }}>
          COMUNA 3 · MEDELLÍN · 2026
        </div>

        <div
          style={{
            display: 'flex',
            color: TINTA,
            fontSize: 86,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 980,
          }}
        >
          Manrique trabaja. Faltan los datos que lo cuenten.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* La barra terracota reemplaza al isotipo: en una miniatura de
              300px un logo chico no se lee, una barra de color sí. */}
          <div style={{ display: 'flex', width: 10, height: 44, backgroundColor: TERRACOTA }} />
          <div style={{ display: 'flex', color: TINTA, fontSize: 34, letterSpacing: 1 }}>
            CONSTELACIONES
          </div>
        </div>
      </div>
    ),
    size,
  );
}
