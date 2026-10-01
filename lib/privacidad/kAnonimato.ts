/**
 * Regla k = 5 de los datos abiertos (`/api/datos`, Ley 1581 de 2012).
 *
 * Una celda con menos de 5 negocios no se publica con su número: sale como
 * «<5». En una comuna con pocos negocios, «2 peluquerías en Versalles» ya
 * apunta a dos personas con nombre y apellido, y el consentimiento de registro
 * cubre «estadísticas agregadas y anónimas», no esto.
 *
 * Puro y sin `server-only`: lo importan el repo y `scripts/verificar-datos-k.mjs`
 * (con `--experimental-strip-types`, que no resuelve imports sin extensión: no
 * agregar imports de valor acá).
 *
 * ── Supresión complementaria ──
 *
 * Esconder solo las celdas chicas no alcanza cuando el total se publica: con
 * `total = 20` y celdas `8, 9, <5`, la celda escondida es 20 − 17 = 3, exacta.
 * Por eso, en una PARTICIÓN con total publicado (categorías, barrios), si queda
 * escondida exactamente una celda se esconde también la menor de las visibles:
 * quien reste ya solo obtiene la suma de dos celdas.
 *
 * Límite conocido y aceptado: comparar fotos tomadas en horas distintas puede
 * revelar que una celda subió en uno. La caché de 1 h y el volumen del barrio lo
 * acotan; no se resuelve con ruido porque son conteos de gente real.
 */

export const K_MINIMO = 5;
export const CELDA_PEQUENA = '<5';

export type Celda = number | typeof CELDA_PEQUENA;

export function celda(n: number): Celda {
  return n >= K_MINIMO ? n : CELDA_PEQUENA;
}

/**
 * Convierte `negocios` en `Celda`. `particion: true` cuando las filas son una
 * partición del total que también se publica (activa la supresión complementaria).
 * Conserva el orden de entrada.
 */
export function suprimir<T extends { negocios: number }>(
  filas: readonly T[],
  { particion = false }: { particion?: boolean } = {},
): (Omit<T, 'negocios'> & { negocios: Celda })[] {
  const ocultas = filas.map((f) => f.negocios < K_MINIMO);

  if (particion && ocultas.filter(Boolean).length === 1) {
    let menor = -1;
    filas.forEach((f, i) => {
      if (!ocultas[i] && (menor === -1 || f.negocios < (filas[menor]?.negocios ?? Infinity))) menor = i;
    });
    if (menor !== -1) ocultas[menor] = true;
  }

  return filas.map((f, i) => ({ ...f, negocios: ocultas[i] ? CELDA_PEQUENA : f.negocios }));
}

// ─── Detector de fugas (lo usa el verificador, también contra el endpoint vivo) ───

/** Claves que jamás deben aparecer en una respuesta de datos abiertos. */
const CLAVES_PROHIBIDAS =
  /^(whatsapp|telefono|correo|email|direccion|latitud|longitud|lat|lon|lng|token|token_publico|ip|ip_hash|ip_registro|contacto|instagram|facebook|foto|foto_url|menu_url|descripcion|usuario|usuario_id|google_sub|portafolio_id|productos|punto_referencia|campos_extra|capturado_por|consentimiento|respuesta|respuestas)$/i;

const CLAVES_CONTEO = new Set(['negocios', 'negocios_aprobados']);

/**
 * Recorre una respuesta y devuelve las violaciones: claves prohibidas, conteos
 * con número menor a 5 (o no enteros), y textos que parecen un correo o un
 * teléfono. Lista vacía = limpia.
 */
export function hallarFugas(valor: unknown, ruta = '$'): string[] {
  const fugas: string[] = [];

  if (typeof valor === 'string') {
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(valor)) fugas.push(`${ruta}: parece un correo`);
    const esFecha = /^\d{4}-\d{2}-\d{2}(T|$)/.test(valor);
    if (!esFecha && /\d[\d\s-]{6,}\d/.test(valor)) fugas.push(`${ruta}: parece un teléfono`);
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => fugas.push(...hallarFugas(v, `${ruta}[${i}]`)));
  } else if (valor && typeof valor === 'object') {
    for (const [clave, v] of Object.entries(valor)) {
      const aqui = `${ruta}.${clave}`;
      if (CLAVES_PROHIBIDAS.test(clave)) fugas.push(`${aqui}: clave prohibida`);
      if (CLAVES_CONTEO.has(clave)) {
        const ok = v === CELDA_PEQUENA || (Number.isInteger(v) && (v as number) >= K_MINIMO);
        if (!ok) fugas.push(`${aqui}: conteo ${JSON.stringify(v)} (debe ser entero >= ${K_MINIMO} o "${CELDA_PEQUENA}")`);
      }
      fugas.push(...hallarFugas(v, aqui));
    }
  }

  return fugas;
}
