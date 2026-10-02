import type { NegocioEnNumeros as Datos } from '@/lib/db/cuenta.repo';

/**
 * «Tu negocio en números»: vistas de tu ficha y contactos (toques en WhatsApp,
 * teléfono, correo o redes) por mes. Barras de CSS, sin librería de gráficos: son
 * seis meses y dos series. Los números van escritos encima de cada barra y el
 * mismo dato está en una tabla para lectores de pantalla, así que el color nunca
 * es lo único que dice algo.
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «2026-10» → «oct». Sin `Date`: una zona horaria no debe correr el mes. */
function mesCorto(mes: string): string {
  return MESES[Number(mes.slice(5, 7)) - 1] ?? mes;
}

const ALTURA_PX = 112;

function Barra({ valor, maximo, clase }: { valor: number; maximo: number; clase: string }) {
  // Un valor mayor que 0 siempre se ve (mínimo 3 px): una barra invisible diría "cero".
  const alto = valor === 0 ? 0 : Math.max(3, Math.round((valor / maximo) * ALTURA_PX));
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
      <span className="font-cifra text-xs tabular-nums text-tinta/70">{valor}</span>
      <div aria-hidden="true" className={clase} style={{ height: alto }} />
    </div>
  );
}

function Grafico({ negocio }: { negocio: Datos }) {
  const maximo = Math.max(1, ...negocio.meses.flatMap((m) => [m.vistas, m.contactos]));
  const totalVistas = negocio.meses.reduce((t, m) => t + m.vistas, 0);
  const totalContactos = negocio.meses.reduce((t, m) => t + m.contactos, 0);

  return (
    <figure className="border border-tinta/12 p-6">
      <figcaption>
        <h3 className="font-display text-xl font-medium text-tinta">{negocio.nombre}</h3>
        <p className="mt-1 font-sans text-xs text-tinta/60">
          Últimos {negocio.meses.length} meses:{' '}
          <span className="font-cifra tabular-nums">{totalVistas}</span> vistas y{' '}
          <span className="font-cifra tabular-nums">{totalContactos}</span> contactos
        </p>
      </figcaption>

      <div className="mt-6 flex items-end gap-2 sm:gap-4" style={{ height: ALTURA_PX + 24 }}>
        {negocio.meses.map((m) => (
          <div key={m.mes} className="flex h-full min-w-0 flex-1 items-end gap-1">
            <Barra valor={m.vistas} maximo={maximo} clase="w-full bg-tinta/30" />
            <Barra valor={m.contactos} maximo={maximo} clase="w-full bg-azul-texto" />
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="mt-2 flex gap-2 border-t border-tinta/20 pt-2 sm:gap-4">
        {negocio.meses.map((m) => (
          <span
            key={m.mes}
            className="min-w-0 flex-1 text-center font-cifra text-xs uppercase text-tinta/60"
          >
            {mesCorto(m.mes)}
          </span>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-sans text-xs text-tinta/70">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 bg-tinta/30" /> Vistas de tu ficha
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 bg-azul-texto" /> Contactos
        </li>
      </ul>

      <table className="sr-only">
        <caption>Vistas y contactos por mes de {negocio.nombre}</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Vistas</th>
            <th scope="col">Contactos</th>
          </tr>
        </thead>
        <tbody>
          {negocio.meses.map((m) => (
            <tr key={m.mes}>
              <th scope="row">{m.mes}</th>
              <td>{m.vistas}</td>
              <td>{m.contactos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function NegocioEnNumeros({ negocios }: { negocios: Datos[] }) {
  return (
    <section aria-labelledby="en-numeros" className="mt-16 border-t border-tinta/12 pt-10">
      <h2 id="en-numeros" className="font-sans text-xs uppercase tracking-wider text-tinta/60">
        Tu negocio en números
      </h2>
      <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
        Cuántas personas abrieron tu ficha y cuántas tocaron un medio de contacto. Son conteos
        sumados por mes: no sabemos quién fue.
      </p>

      {negocios.length === 0 ? (
        <p className="mt-6 max-w-xl font-sans leading-relaxed text-tinta/70">
          Aquí verás las cifras cuando tu negocio esté publicado.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {negocios.map((n) => (
            <Grafico key={n.portafolio_id} negocio={n} />
          ))}
        </div>
      )}
    </section>
  );
}
