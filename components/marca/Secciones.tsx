import Image from 'next/image';

import type { Imagen, Nota, Seccion } from '@/lib/marca';

/**
 * Pinta las secciones de una guía. Un componente por tipo de sección; el
 * contenido vive en `lib/marca.ts`.
 *
 * Es solo lectura a propósito: nada acá guarda estado ni pide nada. Los
 * checklists se ven como una lista de cosas por revisar (con ✓), no como
 * casillas vacías — una casilla vacía en una página que no se puede marcar
 * invita a un clic que no hace nada.
 *
 * Contraste: el texto no baja de `tinta/70` (piso del proyecto: `/65`, ver
 * docs/sistema-diseno-a11y.md). Cuando el sitio usa terracota como color de
 * texto es `terracota-texto`, nunca `terracota` a secas.
 */

function Encabezado({
  id,
  kicker,
  titulo,
  bajada,
}: {
  id: string;
  kicker: string;
  titulo: string;
  bajada?: string;
}) {
  return (
    <header>
      <p className="font-mono text-sm uppercase tracking-wider text-terracota-texto">{kicker}</p>
      <h2
        id={id}
        className="mt-3 max-w-3xl font-display text-3xl font-medium leading-tight text-tinta sm:text-4xl"
      >
        {titulo}
      </h2>
      {bajada && (
        <p className="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-tinta/70">{bajada}</p>
      )}
    </header>
  );
}

/** La barra oscura de las láminas: una regla, un tip, un reto. */
function BarraNota({ nota }: { nota: Nota }) {
  return (
    <p className="mt-8 bg-tinta px-5 py-4 font-sans leading-relaxed text-hueso">
      <span className="font-mono text-sm uppercase tracking-wider">{nota.etiqueta}:</span>{' '}
      {nota.texto}
    </p>
  );
}

function Cierre({ texto }: { texto: string }) {
  return (
    <p className="mt-8 max-w-2xl border-l-2 border-terracota pl-4 font-display text-xl leading-snug text-tinta">
      {texto}
    </p>
  );
}

function Foto({ imagen, sizes }: { imagen: Imagen; sizes: string }) {
  return (
    <Image
      src={imagen.src}
      alt={imagen.alt}
      width={imagen.ancho}
      height={imagen.alto}
      sizes={sizes}
      className="h-auto w-full"
    />
  );
}

/** Los `[CORCHETES]` son lo que la persona cambia: se marcan para que salten a la vista. */
function ConCorchetes({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\[[^\]]+\])/g).map((trozo, i) =>
        trozo.startsWith('[') ? (
          <span key={i} className="bg-terracota/10 px-1 font-mono text-[0.85em] text-terracota-texto">
            {trozo}
          </span>
        ) : (
          trozo
        ),
      )}
    </>
  );
}

function VistaSeccion({ seccion, id }: { seccion: Seccion; id: string }) {
  const cabecera = (
    <Encabezado
      id={id}
      kicker={seccion.kicker}
      titulo={seccion.titulo}
      bajada={seccion.bajada}
    />
  );

  switch (seccion.tipo) {
    case 'tarjetas': {
      const Lista = seccion.numeradas ? 'ol' : 'ul';
      // 3 o 6 tarjetas caben en tres columnas; 4 (o 2) se ven mejor en dos.
      const columnas = seccion.items.length % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

      return (
        <>
          {cabecera}
          <Lista role="list" className={`mt-10 grid list-none gap-6 sm:grid-cols-2 ${columnas}`}>
            {seccion.items.map((item, i) => (
              <li key={item.titulo} className="flex h-full flex-col border border-tinta/15 bg-white p-6">
                {item.imagen && (
                  <div className="mb-5">
                    <Foto
                      imagen={item.imagen}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    />
                  </div>
                )}
                {seccion.numeradas && (
                  <span
                    className="mb-4 grid h-9 w-9 place-items-center rounded-full border border-terracota font-mono text-sm text-terracota-texto"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                )}
                <h3 className="font-display text-xl font-medium text-tinta">{item.titulo}</h3>
                <p className="mt-2 font-sans leading-relaxed text-tinta/70">{item.texto}</p>
              </li>
            ))}
          </Lista>
          {seccion.nota && <BarraNota nota={seccion.nota} />}
        </>
      );
    }

    case 'checklist':
      return (
        <>
          {cabecera}
          <ul role="list" className="mt-10 grid list-none gap-3 sm:grid-cols-2">
            {seccion.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border border-tinta/15 bg-white px-4 py-3 font-sans text-tinta"
              >
                <span className="font-mono text-terracota-texto" aria-hidden="true">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          {seccion.nota && <BarraNota nota={seccion.nota} />}
          {seccion.cierre && <Cierre texto={seccion.cierre} />}
        </>
      );

    case 'plantillas':
      return (
        <>
          {cabecera}
          <ul
            role="list"
            className={`mt-10 grid list-none gap-6 ${seccion.items.length > 1 ? 'lg:grid-cols-3' : ''}`}
          >
            {seccion.items.map((item) => (
              <li key={item.titulo} className="flex h-full flex-col border border-tinta/15 bg-white p-6">
                <h3 className="font-mono text-sm uppercase tracking-wider text-tinta/70">
                  {item.titulo}
                </h3>
                {item.texto && (
                  <p className="mt-4 font-display text-xl leading-relaxed text-tinta">
                    <ConCorchetes texto={item.texto} />
                  </p>
                )}
                {item.pasos && (
                  <ol className="mt-4 list-decimal space-y-2 pl-5 font-display text-xl leading-snug text-tinta marker:font-mono marker:text-terracota-texto">
                    {item.pasos.map((paso) => (
                      <li key={paso}>{paso}</li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
          {seccion.nota && <BarraNota nota={seccion.nota} />}
        </>
      );

    case 'comparacion':
      return (
        <>
          {cabecera}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {(
              [
                { lado: seccion.mal, marca: '✗', borde: 'border-tinta/15' },
                { lado: seccion.bien, marca: '✓', borde: 'border-terracota' },
              ] as const
            ).map(({ lado, marca, borde }) => (
              <figure key={lado.etiqueta} className={`flex flex-col border ${borde} bg-white p-4 sm:p-6`}>
                <figcaption className="mb-4 font-mono text-sm uppercase tracking-wider text-tinta">
                  <span aria-hidden="true">{marca} </span>
                  {lado.etiqueta}
                </figcaption>
                {lado.imagen && (
                  <Foto imagen={lado.imagen} sizes="(min-width: 640px) 45vw, 100vw" />
                )}
                {lado.texto && (
                  <blockquote className="font-display text-xl leading-snug text-tinta">
                    {lado.texto}
                  </blockquote>
                )}
              </figure>
            ))}
          </div>
          {seccion.senales && (
            <ul role="list" className="mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 font-sans text-tinta/70">
              {seccion.senales.map((senal) => (
                <li key={senal} className="flex gap-2">
                  <span className="font-mono text-terracota-texto" aria-hidden="true">
                    ✓
                  </span>
                  {senal}
                </li>
              ))}
            </ul>
          )}
          {seccion.nota && <BarraNota nota={seccion.nota} />}
        </>
      );

    case 'frases':
      return (
        <>
          {cabecera}
          <ol role="list" className="mt-10 grid list-none gap-x-10 gap-y-8 sm:grid-cols-2">
            {seccion.items.map((frase) => (
              <li key={frase}>
                <span className="font-display text-xl text-tinta">{frase}</span>
                {/* Renglón para escribir: decorativo, la guía se completa en una hoja. */}
                <span className="mt-4 block border-b border-tinta/30" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </>
      );
  }
}

export function Secciones({ secciones }: { secciones: Seccion[] }) {
  return (
    <div className="mt-12">
      {/* Las secciones pares van sobre una banda apenas más oscura que el fondo
          y a sangre (el margen negativo cancela el padding de la página): así
          cada bloque se lee como una unidad aparte y no como un texto corrido. */}
      {secciones.map((seccion, i) => (
        <section
          key={seccion.kicker}
          aria-labelledby={`seccion-${i}`}
          className="scroll-mt-24 py-14 even:-mx-[var(--margen-editorial)] even:bg-tinta/[0.04] even:px-[var(--margen-editorial)] sm:py-20"
        >
          <VistaSeccion seccion={seccion} id={`seccion-${i}`} />
        </section>
      ))}
    </div>
  );
}
