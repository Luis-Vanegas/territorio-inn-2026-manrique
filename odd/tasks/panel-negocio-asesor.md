# Paneles según la asesoría (prototipo `firmamento-app`), con nuestros datos

## Objetivo
Que cada rol, al entrar a Firmamento, vea lo que el prototipo del asesor proponía, pero
construido con NUESTROS datos (fichas aprobadas, `aliados_investigacion`, OSM, barrios
oficiales, constelaciones, datos abiertos k = 5) y con nuestro diseño (DESIGN.md). No se
copia el diseño del prototipo ni sus datos de demostración.

## Problema
El análisis de brechas (6-oct) mostró que el dueño de un negocio no ve dónde está su
negocio en el Inicio, no puede recorrer otras constelaciones, no tiene un camino para
corregir un punto mal ubicado y la vista previa no lleva a editar. Equipo y entidad tienen
huecos menores.

## Restricciones
- Privacidad: la entidad solo ve agregados k = 5 y datos de OSM; nunca negocios uno a uno.
  El negocio solo ve SU ficha y lo público (vitrina aprobada, OSM).
- Nada del prototipo que viole k = 5 (alcance «llega a N aliados» para entidades, totales
  sin suprimir) ni datos de demostración atados a aliados reales.
- Reusar piezas existentes (AGENTS.md): `MapaAliados`/`MapaEstelar`, `Tarjeta`, `Kpi`,
  `constelacionDe`/`vecinosDeConstelacion`, `dentroDeManrique`, `barrioDe`, `sugerirCategoria`.
- Copia en español colombiano «tú» (`verificar-voseo`).

## Tareas
- [x] T1 · Inicio del negocio: tarjeta «Dónde estás» con mapa pequeño (su punto, aliados
      aprobados y comercios de OSM cercanos), nombre de su constelación o «estrella suelta»,
      cuántos negocios hay cerca y botón a «Mi constelación».
- [x] T2 · Inicio: «Editar mi ficha» junto a «Así te ven en Constelaciones».
- [x] T3 · Aviso de ubicación (Inicio y Mi constelación): fuera de la Comuna 3
      (`dentroDeManrique`) o barrio declarado distinto del oficial → «Mover mi punto» a la
      ficha, en el selector de ubicación.
- [x] T4 · Mi constelación: recorrer las demás constelaciones en el mapa y volver a la propia.
- [x] T5 · Para ti: guías según las dificultades que declaró ESE negocio (`mayor_dolor`),
      otras convocatorias abiertas y botón al asesor de formalización.
- [x] T6 · Equipo › Modelos: cuadro «Pruébalo» (el sugeridor corre en el navegador).
- [x] T7 · Entidad › Observatorio: «Dónde apoyar primero» con conteos de OSM por barrio /
      constelación (sin aliados).

Decisiones abiertas para Luis (fuera de alcance por ahora): en Equipo › alertas, «Marcar
para contactar» y «Proponer categoría al negocio» (necesitan estado nuevo en la base).

## Criterios de aceptación
- `npm run typecheck`, `npm run lint` y `npm run verificar` en verde.
- Ninguna pantalla de entidad importa repos de negocios (`verificar-entidades`).
- Guardas de rol en cada `page.tsx` (`verificar-accesos`).

## Ruta y entrega
- Rama `reto/alineacion`; un commit por tarea. Estrategia de entrega: rama única que Luis
  integra a `main` (como hasta ahora). Previsión: ~600 líneas.
- T1–T4: delegado a un escritor (varios archivos no triviales del panel de negocio).
- T5–T7: delegado a un escritor después.
- Verificación en navegador: los paneles exigen sesión de Google o de moderador; si no se
  puede entrar, queda pendiente y se dice.

## Progreso
- 6-oct: documento creado tras el análisis de brechas.
- T1 (delegado): «Dónde estás» en el inicio (`negocio/_components/DondeEstas.tsx`) con `MapaAliados`
  acercado al punto; la cuenta de «qué hay cerca» se movió a `lib/firmamento/entorno.ts`
  (`entornoDeNegocio`), que usan el inicio y «Mi constelación». typecheck, lint y verificar en verde.
  Sin verificación en navegador (el panel exige sesión de Google). Commit 2f9cc5c.
- T2 (delegado): «Editar mi ficha» junto a «Ver mi ficha en Constelaciones» en «Así te ven tus vecinos»
  (también cuando aún no está publicada). typecheck, lint y verificar en verde. Commit b368d6f.
- T3 (delegado): `AvisoUbicacion` en el inicio y en «Mi constelación» con «Mover mi punto» a
  `/firmamento/negocio/ficha#ubicacion`; la regla vive en `lib/firmamento/ubicacion.ts`
  (`revisarUbicacion`), que ahora usan también las alertas del equipo (`calidad.ts`, mismo texto).
  typecheck, lint y verificar en verde. Commit 59fadba.
- T4 (delegado): «Mi constelación» abre en la propia y deja recorrer las cercanas (lista con
  `BotonConstelacion` + «Ver una sola» del mapa) y «Volver a la mía» (`ExplorarConstelaciones`;
  `useConstelacionElegida` acepta la constelación inicial). typecheck, lint y verificar en verde. Commit 3967977.
- T5 (delegado): «Para ti» ordena las guías por la `mayor_dolor` del negocio activo
  (`dificultadesDeNegocio` en `cuenta.repo.ts`, con el filtro del dueño; reglas en
  `lib/firmamento/guiasParaTi.ts`, solo guías que existen por `slug`), suma «Otras convocatorias
  abiertas» (`listarConvocatoriasVigentes` menos las que encajan) y el asesor en una `Tarjeta`
  plegable (`Asesor` + `consultarAsesorUsuario`: `AsesorFlotante` solo vive en el layout del sitio;
  esa action usa el negocio más reciente de la cuenta, no el activo). typecheck, lint y verificar en
  verde. Sin verificación en navegador (sesión de Google). Commit d7815ea.
- T6 (delegado): «Pruébalo» en Equipo › Modelos (`PruebaSugeridor`, en el navegador, barras con
  `BarrasCategoria`). typecheck, lint y verificar en verde. Sin verificación en navegador (sesión de
  moderador). Commit 027952f.
- T7 (delegado): el observatorio ya tenía «Dónde apoyar primero» por constelación
  (`ObservatorioCielo`); se suma la parte por barrio (`entidad/_components/ApoyoPorBarrio.tsx`: los 5
  barrios con más locales de OSM, sus constelaciones y los aliados de `por_barrio` de los datos
  abiertos, ya suprimidos). Sin repos de negocios (`verificar-entidades`: 11 archivos del panel).
  typecheck, lint y verificar en verde. Sin verificación en navegador (sesión de entidad). Commit d9463b8.
