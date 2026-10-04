'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { TarjetaEmprendimiento } from '@/components/vitrina/TarjetaEmprendimiento';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import type { Categoria, Portafolio } from '@/lib/db/portafolios.repo';
import { nombreCampoFormulario } from '@/lib/validation/camposPersonalizados.schema';
import { normalizarRedSocial, parseProductos } from '@/lib/validation/portafolio.schema';

/**
 * «Así te verán en Constelaciones»: la tarjeta REAL de la vitrina
 * (`TarjetaEmprendimiento`) alimentada por lo que la persona va escribiendo.
 *
 * Envuelve el formulario sin tocarlo: escucha los eventos que suben de sus
 * campos (input, change y click, este último para lo que se cambia con un botón,
 * como «Usar esta» del sugeridor) y relee el `<form>` con `FormData`. Así sirve
 * para el registro y para «Mi ficha» sin volver controlados dos formularios
 * largos. Lo que se escribe no sale del navegador: la vista previa es local.
 *
 * En el celular va debajo del formulario, plegable; desde `lg`, al lado y fija.
 */
const VACIO: Portafolio = {
  id: 'vista-previa',
  nombre: 'Nombre de tu negocio',
  descripcion: null,
  categoria_id: 'otros',
  categoria_nombre: 'Otros',
  categoria_otra: null,
  direccion: 'Tu dirección',
  barrio: 'tu barrio',
  latitud: 0,
  longitud: 0,
  whatsapp: null,
  telefono: null,
  correo: null,
  instagram: null,
  facebook: null,
  foto_url: null,
  menu_url: null,
  productos: [],
  creado_en: '',
  punto_referencia: null,
  horario: [],
  medios_pago: [],
  verificado_en: null,
  campos_extra: {},
};

function leer(
  form: HTMLFormElement,
  base: Portafolio,
  categorias: Categoria[],
  campos: DefinicionCampo[],
  foto: string | null,
): Portafolio {
  const fd = new FormData(form);
  const t = (k: string) => {
    const v = fd.get(k);
    return typeof v === 'string' ? v.trim() : '';
  };
  const red = (k: 'instagram' | 'facebook', dominio: string) =>
    fd.has(k) ? normalizarRedSocial(dominio)(t(k)) || null : base[k];
  const categoriaId = fd.has('categoria_id') ? t('categoria_id') || 'otros' : base.categoria_id;

  const camposExtra = { ...base.campos_extra };
  for (const c of campos) {
    const n = nombreCampoFormulario(c.slug);
    if (c.tipo === 'si_no') camposExtra[c.slug] = fd.get(n) === 'on';
    else if (fd.has(n)) camposExtra[c.slug] = t(n);
  }

  return {
    ...base,
    nombre: t('nombre') || 'Nombre de tu negocio',
    descripcion: t('descripcion') || null,
    categoria_id: categoriaId,
    categoria_nombre: categorias.find((c) => c.id === categoriaId)?.nombre ?? 'Otros',
    direccion: t('direccion') || 'Tu dirección',
    barrio: t('barrio') || 'tu barrio',
    whatsapp: t('whatsapp') || null,
    correo: t('correo') || null,
    instagram: red('instagram', 'instagram.com'),
    facebook: red('facebook', 'facebook.com'),
    productos: fd.has('productos') ? parseProductos(t('productos')) : base.productos,
    foto_url: foto ?? base.foto_url,
    campos_extra: camposExtra,
  };
}

export function VistaPreviaEnVivo({
  children,
  categorias,
  base = VACIO,
  definicionesCampos,
  nota,
  lateral,
}: {
  children: React.ReactNode;
  categorias: Categoria[];
  /** La ficha guardada (en «Mi ficha»); sin ella, la tarjeta arranca vacía. */
  base?: Portafolio;
  definicionesCampos?: DefinicionCampo[];
  /** Qué pasa con lo que se escribe: en revisión o publicado al guardar. */
  nota: string;
  /** Más tarjetas bajo la vista previa, en la misma columna. */
  lateral?: React.ReactNode;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const foto = useRef<string | null>(null);
  // Solo los campos que la vitrina publica (032): un dato privado no se muestra como público.
  const publicos = useMemo(() => (definicionesCampos ?? []).filter((c) => c.publico), [definicionesCampos]);
  const [vista, setVista] = useState<Portafolio>(base);

  const releer = useCallback(() => {
    // Un tick después: el sugeridor y los chips cambian el valor en su propio manejador.
    setTimeout(() => {
      const form = contenedor.current?.querySelector('form');
      if (form) setVista(leer(form, base, categorias, publicos, foto.current));
    }, 0);
  }, [base, categorias, publicos]);

  const alCambiar = useCallback(
    (e: React.SyntheticEvent) => {
      const campo = e.target as HTMLInputElement;
      if (campo.type === 'file' && campo.name === 'foto') {
        if (foto.current) URL.revokeObjectURL(foto.current);
        const archivo = campo.files?.[0];
        foto.current = archivo ? URL.createObjectURL(archivo) : null;
      }
      releer();
    },
    [releer],
  );

  useEffect(
    () => () => {
      if (foto.current) URL.revokeObjectURL(foto.current);
    },
    [],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <div ref={contenedor} className="min-w-0" onInput={alCambiar} onChange={alCambiar} onClick={releer}>
        {children}
      </div>
      <aside className={`flex min-w-0 flex-col gap-5 ${lateral ? '' : 'lg:sticky lg:top-6'}`}>
        <Tarjeta titulo="Así te verán en Constelaciones" id="vista-previa-titulo" plegable abierta resumen="en vivo">
          <p className="font-sans text-sm leading-relaxed text-tinta/70">{nota}</p>
          {/* De día aunque el panel esté en oscuro: es como se ve el sitio (.modo-dia). */}
          <div className="modo-dia mt-3 rounded-xl bg-hueso px-4 pb-4 text-tinta [&_article]:border-t-0 [&_article]:pb-0 [&_article]:pt-4">
            <TarjetaEmprendimiento portafolio={vista} indice={0} definicionesCampos={publicos} vistaPrevia />
          </div>
        </Tarjeta>
        {lateral}
      </aside>
    </div>
  );
}
