// robots.txt generado por Next (convención de archivo, sin dependencias).
//
// El sitio quiere ser indexado: todo el punto del proyecto es que los negocios
// de Manrique aparezcan cuando alguien los busca. Así que la regla es permitir
// todo y recortar solo lo que no debe estar en un buscador.

import type { MetadataRoute } from 'next';
import { urlSitio } from '@/lib/sitio';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Panel de moderación: no es contenido público.
        '/admin',
        // Magic link de cada negocio para editar o borrar su ficha. Las páginas
        // ya declaran `robots: noindex`, pero eso solo actúa si el crawler llega
        // a pedirlas: acá se corta antes, para que el token no aparezca siquiera
        // como URL rastreada en un log de terceros.
        '/aliados/estado',
        '/api',
      ],
    },
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
