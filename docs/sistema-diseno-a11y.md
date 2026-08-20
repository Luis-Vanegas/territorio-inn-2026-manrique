# Sistema de diseño y accesibilidad · Constelaciones (Manrique, Comuna 3)

Este documento adapta el sistema de accesibilidad, movimiento y componentes a lo que **ya existe** en este repo: paleta editorial de 3 colores (`tailwind.config.ts`), breakpoints custom (`sm 640 / lg 1024 / xl 1440`, sin `md`), Fraunces + Geist Sans + JetBrains Mono, mapa en Leaflet, y componentes reales (`ModalRegistroExitoso`, `ScrollReveal`, `FiltroCategorias`, `FormularioRegistro`). No es un doc genérico: cada número de contraste está calculado sobre los colores exactos de `[tailwind.config.ts](tailwind.config.ts)`, y cada regla de movimiento se compara contra el código que ya corre en `[components/](components/)`.

Complementa — no reemplaza — a `[docs/decisiones-diseno.md](docs/decisiones-diseno.md)`. Ese documento explica el *por qué* de la paleta editorial; este explica cómo usarla sin romper accesibilidad.

---

## 0. El hallazgo que ordena todo lo demás — y un bug real que encontré

El sistema original que me pasaste pensaba en una paleta semántica de 4 colores (azul/ámbar/rojo/verde) y la probaba contra daltonismo. Acá el problema es otro: **este proyecto tiene un solo acento** (terracota) y usa opacidades de `tinta` para las jerarquías de texto en vez de tokens sólidos con nombre. Esa decisión es correcta para el tono editorial — pero abre una trampa distinta: es fácil bajar la opacidad "porque se ve más sutil" y cruzar sin darte cuenta la línea de los 4.5:1 que pide WCAG AA.

Calculé el contraste real (fórmula de luminancia relativa WCAG, no estimado) de los tres colores base entre sí y until varias opacidades de `tinta` que ya están en uso en el código:

| Combinación | Dónde se usa hoy | Contraste real | Veredicto |
|---|---|---|---|
| `tinta` (#1A1A1A) sobre `hueso` (#F7F5F0) | Títulos, cuerpo | **15.97:1** | Sobra |
| `tinta/70` sobre `hueso` | `ModalRegistroExitoso.tsx` (párrafo) | **6.16:1** | Pasa AA |
| `tinta/65` sobre `hueso` | `FiltroCategorias.tsx` (link inactivo) | **5.22:1** | Pasa AA, es el piso seguro |
| `tinta/50` sobre `hueso` | `ModalRegistroExitoso.tsx` (botón "Cerrar", nota de fuente) | **3.28:1** | ❌ Falla AA en texto de cuerpo |
| `terracota` (#C55A3C) sobre `hueso` | Links, hover de categoría | **3.93:1** | ❌ Falla AA en texto chico (`text-xs`/`text-sm`) |
| `hueso` texto sobre `bg-terracota` | Chip de categoría **activa** en `FiltroCategorias.tsx` | **3.93:1** | ❌ Falla AA — es el mismo problema, invertido |
| `border-tinta/20` | Input de `ModalRegistroExitoso.tsx` | **1.52:1** | Decorativo, no cumple 1.4.11 si comunica estado |

> **El bug concreto:** en [FiltroCategorias.tsx:33](app/(site)/aliados/_components/FiltroCategorias.tsx:33), el chip de categoría activa hace `bg-terracota text-hueso`. Ese par da 3.93:1. WCAG AA pide 4.5:1 para texto normal — y ese chip usa `text-xs` (12px), que no califica como "texto grande" (necesita 18.66px bold o 24px para bajar el piso a 3:1). Con sol directo en la pantalla de un celular gama media en Manrique, ese chip activo se lee peor que los inactivos. Es irónico: el estado que más querés destacar es el que menos contraste tiene.

**Por qué pasó:** `terracota` (#C55A3C) fue elegido por su valor simbólico (tejas de barro), no calibrado para texto — y está bien, es el criterio correcto para un acento. El error es usarlo *también* como fondo con texto claro encima sin verificar ese segundo uso.

**La corrección no rompe la paleta, la extiende con un segundo tono derivado:**

```css
:root {
  /* Existentes en tailwind.config.ts */
  --hueso:     #F7F5F0;
  --tinta:     #1A1A1A;
  --terracota: #C55A3C;  /* 3.93:1 sobre hueso — SOLO bordes, iconos, texto grande, subrayados */

  /* Nuevo: variante de terracota calibrada para texto y fills con texto encima */
  --terracota-texto: #A34B33;  /* 5.34:1 sobre hueso · 5.34:1 con texto hueso encima */
}
```

`#A34B33` es la misma terracota bajada de luminancia hasta cruzar 4.5:1 — mismo matiz, no un color nuevo inventado. Usalo en:
- El chip activo de `FiltroCategorias.tsx`: `bg-[--terracota-texto] text-hueso` en vez de `bg-terracota text-hueso`.
- Cualquier lugar donde `terracota` sea el color del *texto* (no el borde ni el ícono) en tamaño `text-xs`/`text-sm`.

Dejá `--terracota` tal cual para bordes, subrayados de link (el subrayado no necesita 4.5:1, es decoración adyacente al texto que sí lo tiene), y el ícono `✓` — ahí 3.93:1 es válido porque no es el texto principal.

**Regla fundacional para este proyecto:** `tinta/65` es la opacidad mínima para texto de cuerpo. Por debajo de eso (`/50`, `/40`) es solo para bordes decorativos o para texto grande (`text-2xl`+). Calculé el punto exacto: el contraste cruza 4.5:1 en **`tinta/61`**, así que `/65` (ya usado en el código) es el redondeo seguro — no hace falta inventar un token nuevo, alcanza con no bajar de ahí.

---

## 1. Tokens — verificados sobre `tailwind.config.ts`

```css
:root {
  /* Ya existen — no tocar */
  --hueso:     #F7F5F0;
  --tinta:     #1A1A1A;
  --terracota: #C55A3C;

  /* Nuevo — variante de texto/fill calibrada */
  --terracota-texto: #A34B33;  /* 5.34:1 sobre hueso */

  /* Escala de opacidad de tinta — documentando lo que YA se usa, con su contraste real */
  --tinta-90: rgb(26 26 26 / 0.90);  /* no medido, prácticamente = tinta sólida */
  --tinta-70: rgb(26 26 26 / 0.70);  /* 6.16:1 — secundario */
  --tinta-65: rgb(26 26 26 / 0.65);  /* 5.22:1 — PISO para texto de cuerpo */
  --tinta-50: rgb(26 26 26 / 0.50);  /* 3.28:1 — SOLO texto ≥24px o decorativo, nunca cuerpo */
  --tinta-20: rgb(26 26 26 / 0.20);  /* 1.52:1 — decorativo puro (divisores sin significado) */
  --tinta-linea-fuerte: rgb(26 26 26 / 0.55);  /* 3.80:1 — bordes de input, bordes con significado (WCAG 1.4.11) */
}
```

### Reglas de uso para este proyecto

| Regla | Por qué | Dónde ya se rompe |
|---|---|---|
| `tinta/65` es el mínimo para texto de cuerpo. Nada por debajo, salvo texto ≥24px | 5.22:1 vs 3.28:1 en `/50` | `ModalRegistroExitoso.tsx:96` (`text-tinta/50` en `text-xs`) — bajarlo a `/65` |
| `terracota` nunca es el color de texto en `text-xs`/`text-sm` sobre `hueso` o como fill con texto encima | 3.93:1 falla AA | `FiltroCategorias.tsx` chip activo — usar `--terracota-texto` |
| Un borde que comunica estado (input, foco, selección) usa `tinta-linea-fuerte` (`/55`), no `/20` o `/15` | 1.4.11 pide ≥3:1; `/20` da 1.52:1 | `ModalRegistroExitoso.tsx:105` input readonly |
| Un solo color de acción por pantalla | Si el CTA es terracota, nada decorativo cerca compite en el mismo tono | Ya se respeta en el código actual |

**Verificá esto en cualquier página del sitio**, pegando en la consola del navegador:

```js
(() => {
  const lin = c => (c/=255, c<=.04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  const L = s => { const [r,g,b] = s.match(/\d+/g).map(Number);
    return .2126*lin(r) + .7152*lin(g) + .0722*lin(b); };
  const cr = (a,b) => { const [x,y] = [L(a),L(b)].sort((m,n)=>n-m); return (x+.05)/(y+.05); };
  const malos = [];
  document.querySelectorAll('*').forEach(el => {
    const t = el.textContent?.trim();
    if (!t || el.children.length) return;
    const s = getComputedStyle(el);
    let bg = s.backgroundColor, p = el;
    while (bg === 'rgba(0, 0, 0, 0)' && (p = p.parentElement)) bg = getComputedStyle(p).backgroundColor;
    const px = parseFloat(s.fontSize);
    const min = (px >= 24 || (px >= 18.66 && +s.fontWeight >= 700)) ? 3 : 4.5;
    const r = cr(s.color, bg || 'rgb(247,245,240)'); // hueso, no blanco puro
    if (r < min) malos.push({ texto: t.slice(0,45), ratio: +r.toFixed(2), minimo: min, px });
  });
  console.table(malos.length ? malos : [{ texto: 'Todo cumple AA ✓' }]);
})();
```

Ajusté el fondo por defecto del script a `hueso` (#F7F5F0), no blanco puro — con blanco puro el script sobreestima el contraste real de este sitio.

---

## 2. Categorías del mapa de Aliados — no son 9 fijas, son dinámicas

El documento original asumía 9 categorías fijas con glifo asignado a mano. Acá no aplica igual: las categorías salen de `lib/db/portafolios.repo.ts` y se administran desde `/admin/campos` (`[app/admin/(panel)/campos/](app/admin/(panel)/campos/)`) — cualquier persona del equipo puede crear una categoría nueva sin tocar código. Eso significa que un mapeo fijo `categoría → glifo` en un objeto hardcodeado se desactualiza la primera vez que alguien agregue una categoría desde el panel.

**El problema de fondo sigue siendo el mismo** (nadie distingue 9+ colores en pines chicos, menos con daltonismo), pero la solución tiene que vivir donde vive el dato:

- Agregar una columna `glifo` (string, nombre de ícono Lucide/Phosphor) a la tabla de categorías, editable desde `SeccionNuevoCampo.tsx` / `FormularioCampo.tsx`.
- Un glifo por defecto (`●` genérico) para toda categoría sin ícono asignado — nunca texto sin ícono en el pin.
- El color del pin sigue siendo terracota único (coherente con "un solo acento"); lo que distingue categorías es el glifo, no el tono. Esto además evita el problema de daltonismo de raíz: no hay paleta de colores por categoría que pueda fallar.
- El pin **activo/seleccionado** se distingue por tamaño + anillo + elevación (`box-shadow`), igual que el sistema original — nunca por cambio de tono, porque acá solo hay un tono de acento.

Esto es trabajo de esquema + admin, no de CSS — vale la pena que quede como tarea aparte en vez de mezclarlo en este documento de diseño.

---

## 3. Foco — aplica directo, con el acento real

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid theme('colors.terracota');
  outline-offset: 2px;
  box-shadow: 0 0 0 4px theme('colors.hueso');
  border-radius: 4px;
}

*:focus { outline: none; }        /* prohibido sin reemplazo */
*:focus-visible { outline: ...; } /* el reemplazo va siempre junto */
```

No encontré este anillo definido en `[styles/globals.css](styles/globals.css)` — vale la pena confirmar si ya existe antes de asumir que falta. Si no está, es la pieza más barata de agregar con más impacto real (afecta cada `Link`, cada botón del formulario de registro, cada campo de `FormularioContacto.tsx`).

**Prueba de 60 segundos:** Tab de punta a punta en `/aliados/registro` — es el flujo con más campos y el que más plata cívica depende de que se complete.

---

## 4. Sistema de movimiento — comparado contra `ScrollReveal.tsx` real

```css
:root {
  --dur-instant: 100ms;
  --dur-fast:    150ms;  /* salidas */
  --dur-base:    250ms;  /* entradas */
  --dur-slow:    400ms;  /* recorridos largos */
  --ease-out:    cubic-bezier(0.2, 0, 0, 1);
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);
}
```

`[components/ScrollReveal.tsx](components/ScrollReveal.tsx)` ya implementa el patrón correcto (`useInView` con `once: true`, fade + slide) pero con dos valores fuera de la escala recomendada:

```tsx
initial={{ opacity: 0, y: 24 }}                              // recomendado: máx 16px
transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} // recomendado: máx 400ms para una entrada
```

No es un error grave — 600ms y 24px se sienten bien en desktop — pero en el celular gama media que es el público real de este proyecto, esos ~350ms de más se notan como demora. Yo lo bajaría a `y: 16, duration: 0.4`, y dejaría el `ease` como está (ya es una curva de salida suave, equivalente a `--ease-out`).

**Falta `prefers-reduced-motion` en `ScrollReveal.tsx`.** Ahora mismo el componente anima siempre. Agregar el guard:

```tsx
const prefiereMenosMovimiento =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  ref={ref}
  className={className}
  initial={prefiereMenosMovimiento ? false : { opacity: 0, y: 16 }}
  animate={prefiereMenosMovimiento || enVista ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
>
```

Con `initial={false}` cuando hay preferencia reducida, Framer Motion ni siquiera monta el estado inicial oculto — no hay parpadeo.

⚠️ Mismo aviso del original: nunca envuelvas el H1 del Hero ni el CTA principal del registro en `ScrollReveal`. Revisá `[components/Hero.tsx](components/Hero.tsx)` — si el hero ya usa `ScrollReveal` en el titular, sacalo de ahí.

---

## 5. Modal — migrar `ModalRegistroExitoso` a `<dialog>` nativo

`[components/ModalRegistroExitoso.tsx](components/ModalRegistroExitoso.tsx)` hoy es un `<div role="dialog" aria-modal="true">` armado a mano: tiene `Escape` (bien) pero **no tiene atrapado de foco** — con Tab, el foco se escapa del modal hacia el header de atrás. Es justamente el caso que `<dialog>` nativo resuelve gratis.

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export function ModalRegistroExitoso() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = useRef<HTMLDialogElement>(null);

  const [datos] = useState(() => {
    const token = searchParams.get('registrado');
    if (!token) return null;
    return { token, fotoFallo: searchParams.get('foto') === 'error' };
  });

  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (!datos) return;
    setOrigin(window.location.origin);
    router.replace('/', { scroll: false });
    ref.current?.showModal();   // showModal(), no show() — así atrapa el foco y bloquea el fondo
  }, [datos, router]);

  if (!datos) return null;

  const urlEstado = `${origin}/aliados/estado/${datos.token}`;

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-registro-titulo"
      className="modal"
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
    >
      <div className="modal__panel">
        {/* ...contenido igual al actual... */}
      </div>
    </dialog>
  );
}
```

```css
.modal {
  border: 0;
  padding: 0;
  background: transparent;
  max-width: min(28rem, calc(100vw - 32px));
  opacity: 0;
  translate: 0 12px;
  transition: opacity var(--dur-fast) var(--ease-in),
              translate var(--dur-fast) var(--ease-in),
              overlay var(--dur-fast) allow-discrete,
              display var(--dur-fast) allow-discrete;
}
.modal[open] {
  opacity: 1;
  translate: 0 0;
  transition-duration: var(--dur-base);
  transition-timing-function: var(--ease-out);
}
@starting-style { .modal[open] { opacity: 0; translate: 0 12px; } }

.modal::backdrop {
  background: rgb(26 26 26 / 0.4);   /* tinta/40, ya usado hoy como bg-tinta/40 */
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-in), display var(--dur-fast) allow-discrete;
}
.modal[open]::backdrop { opacity: 1; }
@starting-style { .modal[open]::backdrop { opacity: 0; } }

.modal__panel {
  background: theme('colors.hueso');
  border: 1px solid rgb(26 26 26 / 0.15);   /* border-tinta/15, igual al actual */
  padding: 24px;
}

@media (max-width: 640px) {
  .modal {
    margin: 0;
    width: 100vw;
    max-width: 100vw;
    position: fixed;
    bottom: 0;
    translate: 0 100%;
    transition-duration: var(--dur-slow);
  }
  .modal[open] { translate: 0 0; }
  @starting-style { .modal[open] { translate: 0 100%; } }
  .modal__panel {
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
    max-height: 85dvh;
    overflow-y: auto;
  }
}
```

El resto del contenido interno (link de WhatsApp, copiar al portapapeles, link a `/aliados/estado/[token]`) queda idéntico — solo cambia el contenedor. En mobile pasa a hoja inferior automáticamente, que es donde más usuarios de este proyecto lo van a ver (registro de negocio de barrio, celular, no desktop).

---

## 6. Estados de carga — aplicado a `MapaAliadosClient` / `MapaManrique`

`[components/MapaAliadosClient.tsx](components/MapaAliadosClient.tsx)` carga Leaflet dinámicamente (probablemente con `next/dynamic` y `ssr: false`, típico para Leaflet en Next). Ese punto de carga necesita los 4 estados, no 2:

```tsx
<div
  className="relative w-full aspect-[4/3] xl:aspect-[16/9] overflow-hidden bg-hueso border border-tinta/15"
  role="region"
  aria-label="Mapa de negocios de la Comuna 3"
  aria-busy={estado === 'cargando'}
>
  {estado === 'cargando' && (
    <div className="absolute inset-0 skeleton">
      <span className="sr-only" role="status">Cargando el mapa…</span>
    </div>
  )}
  {estado === 'error' && (
    <div className="absolute inset-0 grid place-items-center gap-3 p-6 text-center font-sans text-sm text-tinta">
      <p>No pudimos cargar el mapa.</p>
      <button onClick={reintentar} className="border border-tinta/20 px-4 py-2 font-mono text-xs hover:border-terracota hover:text-terracota">
        Reintentar
      </button>
      <Link href="/aliados" className="font-mono text-xs text-[--terracota-texto] underline">
        Ver los negocios en lista →
      </Link>
    </div>
  )}
  {estado === 'listo' && <Mapa />}
</div>
```

**Estado vacío ≠ error**, igual que el original: si la Comuna 3 tiene cero negocios aprobados en el filtro activo, mostrá el polígono de Manrique igual, sin pines. `VitrinaAliados.tsx` ya tiene equivalente en modo lista (`FiltroCategorias` filtra sin resultados) — el mapa debería espejar ese mismo criterio.

El `aspect-ratio` usa `xl:aspect-[16/9]`, no `md:` — este proyecto no tiene el breakpoint `md`, ver sección 8.

---

## 7. Formulario — `FormularioRegistro.tsx`

Puntos ya cubiertos por lo que vi en `Chips.tsx` / `SelectConOtro.tsx` / `SelectorUbicacionClient.tsx` (pasos numerados, lenguaje natural) más lo que falta verificar puntualmente:

| Detalle | Por qué importa | Verificar en |
|---|---|---|
| `font-size: 16px` mínimo en todo `input` | Evita el zoom automático de Safari iOS al enfocar | Inputs de `FormularioRegistro.tsx` y `FormularioContacto.tsx` |
| `inputMode="numeric"` + `autoComplete="tel"` en teléfono/WhatsApp | Teclado correcto, ahorra segundos reales en un formulario de negocio de barrio | Campo de contacto |
| Comprimir foto en cliente antes de subir a Vercel Blob | El proyecto ya usa `@vercel/blob` — comprimir a 1600px/calidad 0.8 en cliente reduce el costo de storage además de la UX | Donde se suba la foto del negocio |
| Error de validación con `role="alert"` + `aria-invalid` | El proyecto usa Zod (`zod: ^4.4.3`) — los mensajes de error de Zod deberían mapearse a esto en el render, no solo loguearse | Validación de `FormularioRegistro.tsx` |
| Obligatoriedad en texto, no solo asterisco | `terracota` como asterisco solo da 3.93:1 y falla para daltónicos | Cualquier campo obligatorio |

No leí el archivo completo de `FormularioRegistro.tsx` — esto queda como checklist para pasar sobre el archivo real, no como diagnóstico confirmado.

---

## 8. Responsive — breakpoints reales, no los genéricos de Tailwind

Este es el punto donde el documento original **no aplica tal cual**: `[tailwind.config.ts](tailwind.config.ts)` define

```
sm   ≥640px
lg   ≥1024px
xl   ≥1440px
```

**No hay `md` (768px).** Es una decisión explícita del proyecto (mobile-first con 3 quiebres, no 5), documentada en el propio comentario del archivo. Cualquier clase `md:` que aparezca en el código no hace nada — Tailwind la ignora silenciosamente porque el breakpoint no existe en la config. Vale la pena un grep rápido si alguna vez se pega código de otro proyecto:

```bash
rg 'md:' app components --type tsx
```

Matriz adaptada a los 3 quiebres reales:

| Componente | <640px | 640–1023px (`sm`) | ≥1024px (`lg`) | ≥1440px (`xl`) |
|---|---|---|---|---|
| **Mapa** | `aspect-[4/3]`, gestos cooperativos | ancho completo | 60% junto a la lista | — |
| **Vista Aliados** | Lista | Lista | Mapa + lista lado a lado | Mapa + lista, contenido máx 1400px |
| **Modal** | Hoja inferior | Centrado | Centrado | Centrado |
| **Formulario de registro** | 1 columna, progreso fijo abajo | 1 columna | 2 columnas, pasos fijos a la izquierda | — |
| **Grid asimétrico editorial** | Apilado | Empieza a romper contra el margen | 12 columnas completas | 12 columnas, máx 1400px |

El gesto cooperativo del mapa (`scrollWheelZoom.disable()` / `dragging.disable()` hasta que el usuario toca "Explorar el mapa") sigue aplicando igual — es Leaflet real acá, no un mapa genérico, y el problema de quedar atrapado haciendo pan es el mismo.

---

## 9. Checklist de accesibilidad — para este repo puntualmente

**Estructura**
- [ ] `lang="es"` — ✓ ya está en `[app/layout.tsx:32](app/layout.tsx:32)`
- [ ] Un solo `<h1>` por ruta
- [ ] Enlace "Saltar al contenido" — no lo vi en `SiteHeader.tsx`, agregar

**Teclado**
- [ ] Anillo `:focus-visible` — confirmar si existe en `styles/globals.css` (sección 3)
- [ ] `ModalRegistroExitoso`: migrar a `<dialog>` para atrapado de foco real (sección 5)

**Color**
- [ ] Chip activo de `FiltroCategorias.tsx`: cambiar `bg-terracota` por `bg-[--terracota-texto]` (sección 0)
- [ ] `text-tinta/50` en texto de cuerpo: subir a `/65` mínimo (sección 1)
- [ ] Bordes que comunican estado: `/20` → `tinta-linea-fuerte` (`/55`)

**Movimiento**
- [ ] `ScrollReveal.tsx`: agregar guard de `prefers-reduced-motion` (sección 4)
- [ ] Bajar `y: 24` → `y: 16`, `duration: 0.6` → `0.4`

**Formularios**
- [ ] `font-size: 16px` en inputs de `FormularioRegistro.tsx` / `FormularioContacto.tsx`
- [ ] Checkboxes de consentimiento nunca premarcados (Ley 1581 — Colombia, aplica directo acá)

---

## 10. Cómo probarlo

Igual que el original, con un agregado: correr Lighthouse con throttling contra la ruta `/aliados` con el mapa cargado, no contra el home — es la ruta con más peso real (Leaflet + fetch de negocios) y la que un jurado del Presupuesto Participativo va a evaluar en vivo, probablemente desde un celular con datos móviles en la propia Comuna 3.

---

## Orden sugerido para este proyecto

1. **El bug del chip activo** (sección 0) — es el hallazgo concreto, 15 minutos de arreglo
2. **`tinta/50` → `/65`** en `ModalRegistroExitoso.tsx` — mismo commit
3. **Anillo de foco** (sección 3) — confirmar si falta, agregarlo si falta
4. **`<dialog>` nativo** en `ModalRegistroExitoso` (sección 5) — resuelve el atrapado de foco de raíz
5. **`prefers-reduced-motion` en `ScrollReveal`** (sección 4)
6. **Pasada de formulario** (sección 7) y checklist final
