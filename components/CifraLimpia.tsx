/**
 * Texto de una cifra grande en DM Mono, con los ceros en DM Sans: el cero de DM
 * Mono lleva una barra que, en 48 px, se lee como «Ø». Sin `use client`: sirve
 * al servidor (`Kpi`) y al cliente (`NumeroAnimado`).
 */
export function CifraLimpia({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(0)/).map((trozo, i) =>
        trozo === '0' ? (
          <span key={i} className="font-sans">
            0
          </span>
        ) : (
          trozo
        ),
      )}
    </>
  );
}
