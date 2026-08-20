# Módulo Servicios — especificación y política

Estado: **construido, apagado por interruptor**. El código está en el repo y la
base ya tiene las tablas, pero el módulo no existe para el sitio hasta que se
prenda la variable.

```
NEXT_PUBLIC_MODULO_SERVICIOS=true
```

Con la variable ausente o en `false`, `/servicios` y `/servicios/registro`
devuelven un 404 real (no un stub) y el módulo no aparece en el menú. Se
prende primero en **Preview** desde Vercel → Project Settings → Environment
Variables, se revisa ahí, y solo después se prende en Production.

El documento de términos vive en `/legal/servicios` y sigue el mismo
interruptor: con el módulo apagado devuelve 404, porque describiría algo que
todavía no existe.

## 0 · Qué quedó construido

| Pieza | Archivo |
|---|---|
| Tablas | `lib/db/migrations/021_servicios.sql` |
| Consultas públicas | `lib/db/servicios.repo.ts` |
| Consultas reservadas | `lib/db/serviciosPrivado.repo.ts` |
| Validación | `lib/validation/servicio.schema.ts` |
| Registro | `lib/actions/registrarServicio.ts` |
| Moderación | `lib/actions/moderarServicio.ts` |
| Formulario en 4 pasos | `app/(site)/servicios/registro/` |
| Vitrina pública | `app/(site)/servicios/` |
| Panel | `app/admin/(panel)/servicios/` |
| Stepper | `components/Stepper.tsx` |
| Confirmación en `<dialog>` | `app/(site)/servicios/registro/_components/ConfirmarEnvio.tsx` |
| Términos del módulo | `app/(site)/legal/servicios/page.tsx` |
| Indicador de entorno | `lib/entorno.ts` · `components/IndicadorEntorno.tsx` |

---

## 1 · Por qué es un módulo aparte y no una fila más en `portafolios`

`portafolios` es, por definición del esquema, una tabla de **puntos físicos**:

```sql
direccion  text          not null
barrio     text          not null
latitud    numeric(9,6)  not null check (latitud between 6.25 and 6.30)
longitud   numeric(9,6)  not null check (longitud between -75.57 and -75.52)
```

Un emprendimiento **está quieto**: opera en un lugar y quiere que la gente
llegue. Un servicio **se mueve**: la persona va a la casa del cliente.

La diferencia no es de etiqueta, es de geometría y de riesgo:

| | Emprendimiento | Servicio |
|---|---|---|
| Geometría | un punto (lat, lng) | un área de cobertura (barrios) |
| Pregunta del ciudadano | "¿qué hay cerca de mí?" | "¿quién **viene** a mi barrio?" |
| Render | pin en el mapa | lista con cobertura |
| La dirección es | su fachada, pública a propósito | **su casa** — no se publica jamás |

Ya se intentó fusionarlos: la migración 009 agregó `tipo_presencia` y
`cobertura`, la 013 hizo nullable la ubicación para que entraran, y la **014
lo revirtió todo** a pedido explícito tras probarlo en vivo. No se repite ese
camino.

## 2 · Qué se publica y qué no

### Público — la ficha que ve el vecino

| Campo | Por qué es público |
|---|---|
| Nombre | Quien entra a una casa no puede ser anónimo |
| Oficio | Reusa la taxonomía de `categorias` — la misma que los negocios |
| Qué hace exactamente | "Reparo lavadoras y neveras, hago diagnóstico a domicilio" |
| Años de experiencia | Señal de oficio |
| Zonas de cobertura | Barrios donde atiende |
| Teléfono / WhatsApp | El único canal de contacto público |
| «Aceptó el compromiso» + fecha | Ver sección 3 |

### Privado — solo el equipo del proyecto

**Foto de la persona**, si decide subirla · correo electrónico · cómo consigue
clientes hoy · mayor dificultad para conseguir trabajo · si es su ingreso
principal o complementario · horas disponibles por semana · si tiene
herramientas propias · formación en el oficio (SENA / empírico / ninguna) · si
tiene ARL o seguridad social · qué necesita para trabajar mejor · si puede
salir de la comuna · IP de registro · consentimientos y versión aceptada.

**La foto es un caso aparte, y vale la pena explicarlo.** No es un elemento de
confianza pública como podría serlo en otro directorio — es lo opuesto: es el
mecanismo para poder identificar a la persona si llega a haber un problema, y
el respaldo del compromiso de conducta que acepta al registrarse. Por eso vive
en `servicios_privado` desde la migración 023 (antes vivía en la tabla
pública) y la única pantalla del sitio donde un humano la ve es
`/admin/servicios`, durante la moderación.

### Nunca se guarda — ni pública ni privadamente

- **Número de cédula, y menos una imagen de la cédula.** Nunca se pide.
- Dirección de residencia.
- Coordenadas de ningún tipo.
- Datos financieros.

> **El dato más seguro es el que nunca se guarda.** No pedir la cédula elimina
> de raíz el peor escenario de una filtración, y mantiene verdadera la promesa
> que la política pública ya hace hoy: *"nunca documento de identidad, datos
> financieros ni información sensible"*.

## 3 · Confianza: el consentimiento, no una verificación

**No hay verificación presencial ni consulta de antecedentes.** Se descartó a
pedido del equipo, y la migración 022 borró las columnas que la modelaban: una
insignia que nadie puede mover se queda en cero para siempre, y eso es peor que
no tenerla.

Lo que la ficha pública muestra es lo único que el proyecto puede afirmar con
verdad: **«Aceptó el compromiso · [fecha]»**. Significa que esa persona entregó
sus datos a conciencia y aceptó por escrito unas reglas de conducta. No dice
«es de fiar»; dice «puso su nombre y su palabra».

La vitrina lo aclara arriba y visible, no en la letra chica: el proyecto no
comprueba identidad ni antecedentes de nadie.

## 4 · El consentimiento, y dónde vive el texto

El texto completo de términos y tratamiento de datos está publicado como
página real en `/legal/servicios` (`app/(site)/legal/servicios/page.tsx`), no
como copia en este documento — dos versiones del mismo texto se desincronizan
sin falta. Cubre: qué es el proyecto (investigación de un diplomado, con
utilidad práctica para la comunidad), qué se publica, qué no, qué no se pide,
los límites de uso, el compromiso de conducta y el derecho a borrarlo todo.

El consentimiento se da en tres actos, y ninguno se puede saltar:

1. **Casilla de términos** — declara haber leído `/legal/servicios`.
2. **Casilla de tratamiento de datos** — declara entender que nombre, oficio y
   teléfono quedan públicos en internet, y que la foto (si la sube) no.
3. **Confirmación en `<dialog>`** — antes de enviar se abre un diálogo que
   repite en concreto qué se publica, qué no —incluida la foto, explícita como
   privada—, y los límites (no se usa para otra finalidad, no se comparte, no
   se vende). El botón de enviar está deshabilitado hasta marcar la casilla de
   autorización.

El tercero existe porque publicar el nombre y el teléfono de una persona no
puede pasar por inercia de tanto tocar «siguiente».

Detalle técnico que no es obvio: el formulario lleva `noValidate` —los pasos
ocultos harían fallar la validación nativa con «control no enfocable»— así que
el `required` de esa casilla no bloquearía nada. El botón se deshabilita por
estado, no por atributo.

En la base, `acepto_investigacion` es `not null` con `CHECK`: sin autorización
no hay fila, y por lo tanto tampoco hay caracterización guardada.

## 5 · Arquitectura de seguridad

La seguridad es una propiedad del **esquema**, no una promesa en un documento
— mismo criterio que `docs/analitica.md` aplica a la analítica.

1. **Dos tablas: `servicios` y `servicios_privado`.** La consulta de la
   vitrina pública físicamente no toca la tabla privada. Mismo patrón que
   `aliados_investigacion`.
2. **Tipos separados en TypeScript.** El tipo `Servicio` que viaja al cliente
   no declara los campos privados: el compilador es la primera barrera, antes
   que cualquier revisión humana.
3. **`import 'server-only'`** en el repositorio de la tabla privada, como ya
   se hace en `lib/db/interacciones.repo.ts`.
4. **Sin columnas de ubicación.** No hay `latitud`, `longitud` ni `direccion`
   que puedan filtrarse, porque no existen.
5. **Foto reservada y sin metadatos.** Vive en `servicios_privado`, nunca en
   la tabla pública (migración 023) — el repositorio público (`servicios.repo.ts`)
   no la nombra en ningún lado, así que no hay consulta que pueda filtrarla por
   error. `lib/blob/fotos.ts` además procesa con `sharp` sin `withMetadata()`,
   lo que descarta el EXIF completo — incluidas las coordenadas GPS que agregan
   las cámaras de celular.
6. **Exportación CSV limitada.** El export de servicios nunca incluye la tabla
   privada, igual que el de aliados hoy excluye teléfonos y correos.
7. **Teléfono tras un clic.** Se publica detrás de un botón "Mostrar número"
   en vez de como texto plano en el HTML: no impide a un humano copiarlo, pero
   corta el scraping automatizado, que es el vector real de abuso.
8. **Rate limiting** en el registro, reusando `lib/db/rateLimit.ts`.
9. **Borrado autogestionado** con el patrón `token_publico`: un enlace sin
   login para editar o eliminar el propio registro.

## 6 · Cómo se distingue preproducción de producción

Un despliegue de preproducción es visualmente idéntico al real: mismo diseño,
mismos textos, y si comparte base, hasta los mismos registros. La única
diferencia está en la URL, que nadie mira.

`components/IndicadorEntorno.tsx` pinta una marca fija abajo a la izquierda:

| Entorno | Cómo se detecta | Qué se ve |
|---|---|---|
| Producción | `NEXT_PUBLIC_VERCEL_ENV=production` | **nada** — el componente devuelve `null` |
| Preproducción | `NEXT_PUBLIC_VERCEL_ENV=preview` | punto ámbar + `PREPRODUCCIÓN` |
| Local | la variable no existe | punto azul + `LOCAL` |

En producción no se oculta con CSS: el nodo **no llega al HTML**. Un indicador
escondido con una clase reaparece el día que alguien toca esa clase.

Se puede minimizar a un punto de 10 px, pero no cerrar: si se pudiera cerrar,
alguien lo cerraría el primer día y el aviso dejaría de existir justo cuando
hace falta.

Va en el layout raíz y no en `(site)`, porque el panel de moderación es
precisamente donde confundir los dos entornos hace daño.

## 7 · Decisiones pendientes

- **¿El apellido completo es público, o nombre y primer apellido?**
- **Qué preguntas de caracterización pide el equipo del reto** — la lista de
  la sección 2 es una propuesta, no está validada con ellos.
- Los otros dos documentos legales (`/legal/terminos` y
  `/legal/politica-datos`) siguen mostrando el aviso de «borrador técnico
  pendiente de revisión jurídica». El de Servicios no lo muestra. Si ese aviso
  ya no corresponde en los otros dos, se apaga con `avisoBorrador={false}`.
