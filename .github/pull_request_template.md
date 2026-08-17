# Qué cambia

<!-- Una o dos frases en lenguaje llano. Qué hace distinto el sitio después
     de este PR, no qué archivos tocaste. -->

## Por qué

<!-- El problema que resuelve. Si es un bug, cómo se reproducía.
     Si es una decisión de diseño, qué alternativa se descartó y por qué. -->

## Cómo lo probé

<!-- Qué corriste y qué viste. "Anda bien" no es una prueba.
     Ejemplos: "npm run typecheck limpio", "registré un negocio con foto y
     verifiqué foto_url en la base", "abrí /aliados en móvil 375px". -->

- [ ] `npm run typecheck` sin errores
- [ ] `npm run lint` sin errores
- [ ] Probado en el navegador

## Base de datos

<!-- Borrar esta sección si el PR no toca la base. -->

- [ ] Incluye migración nueva en `lib/db/migrations/`
- [ ] La migración corre sobre una base con datos, no solo sobre una vacía
- [ ] **Ojo:** el proyecto Neon tiene una sola branch. Correr `npm run db:migrar`
      en local aplica el cambio en producción.

## Datos personales

<!-- Borrar si no aplica. Obligatorio si el PR recolecta, guarda o expone
     cualquier dato de una persona. -->

- [ ] No agrega ningún identificador que persista entre visitas (cookie,
      localStorage, huella de navegador)
- [ ] Si guarda datos personales nuevos, están declarados en
      `/legal/politica-datos`
- [ ] Leí `docs/analitica.md` antes de agregar cualquier medición

## Capturas

<!-- Si cambia algo visible: antes y después. -->
