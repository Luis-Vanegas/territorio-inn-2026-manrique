// SVG ilustrativo de Manrique: no es cartografía precisa, es un trazo con carácter de dibujo a mano
// que se "dibuja solo" al cargar. El contorno hereda el color del padre vía currentColor; los puntos
// llevan el acento terracota para separarse del trazo del territorio.
//
// La lectura es la del nombre del proyecto: una CONSTELACIÓN. Las líneas no apuntan a esquinas
// arbitrarias — irradian desde Manrique Central y pasan por cada barrio, así el trazo cuenta que los
// barrios están conectados entre sí y no que hay rayas decorativas sobre una mancha.
//
// ── Por qué CSS y no framer-motion ──
//
// Es el mismo mecanismo que ya usan los marcadores del mapa real (`pulso-marcador`, `pulso-usuario`
// en globals.css) y tiene una ventaja que acá pesa: si la animación no corre —JS lento, rAF
// congelado en una pestaña de fondo, un error de hidratación— el mapa se ve COMPLETO igual. Con
// `initial={{ opacity: 0 }}` de framer-motion, ese mismo escenario dejaba los nombres de los barrios
// invisibles para siempre. El estado natural del SVG es el final; la animación solo lo revela.
//
// ── Por qué los nombres de los barrios ya no van dentro del SVG ──
//
// Estaban como <text fontSize={11}> en un viewBox de 640. El SVG se escala a
// 300px de ancho en mobile, así que esos 11 se renderizaban como 5,2px reales
// —y en desktop, 7,9— heredando además el text-tinta/25 del padre. Ilegible
// dos veces: por tamaño y por contraste. Agrandar el fontSize no sirve: para
// llegar a 16px efectivos haría falta fontSize 34, y "Manrique Central" a esa
// escala tapa el dibujo.
//
// La regla es que el texto de un gráfico mide lo mismo que el texto del
// cuerpo. Como dentro del SVG no puede, sale afuera: el trazo queda decorativo
// (aria-hidden, la info no vive ahí) y los barrios son una lista HTML real que
// escala con la tipografía del sitio, se puede seleccionar, la lee el lector
// de pantalla y la indexa el buscador. En mobile el dibujo se oculta —a 360px
// de ancho no aporta— y queda solo la lista.
//
// Sin "use client": ya no hay hooks ni estado, así que este componente renderiza en el servidor.

interface MapaManriqueProps {
  className?: string;
}

// `centro: true` marca el nudo del que salen todas las líneas: se dibuja primero y late.
const BARRIOS = [
  { nombre: "Manrique Central", x: 300, y: 300, centro: true },
  { nombre: "Campo Valdés", x: 220, y: 190 },
  { nombre: "San Pablo", x: 420, y: 220 },
  { nombre: "La Cruz", x: 380, y: 420 },
  { nombre: "La Salle", x: 180, y: 400 },
];

// Cada subpath arranca en el centro (300,300) y pasa por un barrio hasta el borde: que todos nazcan
// en el mismo punto es lo que hace que el grupo lea como algo que irradia y no como rayas sueltas.
const RADIOS = [
  "M 300 300 Q 250 250 220 190 Q 170 130 120 80",
  "M 300 300 Q 370 265 420 220 Q 485 165 540 110",
  "M 300 300 Q 345 365 380 420 Q 435 485 480 540",
  "M 300 300 Q 235 350 180 400 Q 140 450 110 510",
].join(" ");

export function MapaManrique({ className }: MapaManriqueProps) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 640 640"
        className="hidden h-auto w-full text-tinta/35 sm:block"
        aria-hidden="true"
      >
        {/* pathLength=1 normaliza el largo del trazo: con `stroke-dasharray: 1` el path entero es un
            solo guion, y animar `stroke-dashoffset` de 1 a 0 lo dibuja. Sin JavaScript. */}
        <path
          className="mapa-contorno"
          pathLength={1}
          d="M 120 80 L 200 55 L 320 40 Q 400 35 460 70 L 540 110 Q 580 150 560 210 L 590 280 Q 600 340 560 380 L 520 460 Q 480 520 410 540 L 340 580 Q 260 600 190 560 L 120 520 Q 70 480 60 410 L 40 320 Q 30 240 70 180 L 90 130 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Los radios no se "dibujan" —el dasharray ya está ocupado por el punteado— sino que crecen
            desde el centro: mismo efecto de irradiación, conservando el trazo punteado. */}
        <path
          className="mapa-radios"
          d={RADIOS}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="3 7"
          strokeLinecap="round"
        />

        {/* El latido del centro: lo único que sigue vivo cuando la entrada terminó. */}
        <circle cx={300} cy={300} r={5} className="fill-terracota pulso-centro-mapa" />

        <g>
          {BARRIOS.map((barrio, i) => (
            <g
              key={barrio.nombre}
              className="mapa-barrio"
              // El índice escalona la entrada (ver `animation-delay` en globals.css) y el centro del
              // punto es el origen del scale: sin esto los puntos entran volando desde la esquina.
              style={
                {
                  "--i": i,
                  transformOrigin: `${barrio.x}px ${barrio.y}px`,
                } as React.CSSProperties
              }
            >
              <circle
                cx={barrio.x}
                cy={barrio.y}
                r={barrio.centro ? 5 : 4}
                className="fill-terracota"
                opacity={barrio.centro ? 0.85 : 0.6}
              />
            </g>
          ))}
        </g>
      </svg>

      <p className="mt-5 font-mono text-sm uppercase tracking-[0.15em] text-tinta/65">
        Barrios de la Comuna 3
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-base text-tinta/80">
        {BARRIOS.map((barrio) => (
          <li key={barrio.nombre}>{barrio.nombre}</li>
        ))}
      </ul>
    </div>
  );
}
