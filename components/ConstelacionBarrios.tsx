// Los cinco barrios de la Comuna 3, escritos como una constelación.
//
// ── Por qué esto reemplazó al SVG ──
//
// Acá vivía un mapa ilustrativo con los nombres adentro, en <text> a 11 de un
// viewBox de 640: escalado a 300px de ancho, se renderizaban a 5,2px reales.
// Ilegible. Sacarles el texto arregló eso pero dejó el dibujo huérfano —una
// silueta con cinco puntos sin nombre no dice nada, y ocupaba media pantalla
// del inicio para no decirlo.
//
// El error de fondo era tratar el dibujo y el texto como dos cosas que compiten
// por el mismo espacio: o el gráfico se ve bien y la letra no se lee, o al
// revés. Acá dejan de competir. Las estrellas de una constelación no son puntos
// con una etiqueta al lado: son los nombres. Puestos en Fraunces —la misma
// tipografía de los titulares— y desplazados uno respecto de otro, el conjunto
// lee como un cielo sin que haya una sola letra por debajo de 24px.
//
// Manrique Central va al medio y más grande porque es el centro del que
// irradia todo, que es la idea que sostenía los radios punteados del mapa
// viejo. La jerarquía la carga el tamaño, no una línea que haya que ver.
//
// Sin "use client": es texto y CSS, nada más.

interface ConstelacionBarriosProps {
  className?: string;
}

// El desplazamiento es puramente visual y arranca en sm: en mobile la columna
// es angosta y cualquier sangría se come el ancho útil, así que ahí van
// alineados a la izquierda y se leen como la lista que también son.
const BARRIOS = [
  { nombre: "Campo Valdés", desplazamiento: "sm:ml-0" },
  { nombre: "San Pablo", desplazamiento: "sm:ml-24" },
  { nombre: "Manrique Central", desplazamiento: "sm:ml-8", centro: true },
  { nombre: "La Cruz", desplazamiento: "sm:ml-28" },
  { nombre: "La Salle", desplazamiento: "sm:ml-4" },
];

export function ConstelacionBarrios({ className }: ConstelacionBarriosProps) {
  return (
    <div className={className}>
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-tinta/65">
        Barrios de la Comuna 3
      </p>

      <ul className="mt-7 flex flex-col gap-5">
        {BARRIOS.map((barrio) => (
          <li
            key={barrio.nombre}
            className={`flex items-center gap-3.5 ${barrio.desplazamiento}`}
          >
            {/* El punto es decorativo: el nombre que sigue ya dice todo. */}
            <span
              aria-hidden="true"
              className={
                barrio.centro
                  ? "estrella-centro h-2.5 w-2.5 shrink-0 rounded-full bg-terracota"
                  : "h-1.5 w-1.5 shrink-0 rounded-full bg-terracota/70"
              }
            />
            <span
              className={
                barrio.centro
                  ? "font-display text-3xl font-medium leading-none text-tinta"
                  : "font-display text-2xl leading-none text-tinta/80"
              }
            >
              {barrio.nombre}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
