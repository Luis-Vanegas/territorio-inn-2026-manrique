// Procesa los microdatos GEIH (DANE) descargados manualmente en data/dane/geih-2026-05/CSV/
// y genera un resumen liviano en lib/data/dane-geih.json para consumo estático del sitio.
//
// Cobertura real del microdato: departamento (DPTO=08 Antioquia). No baja a municipio ni comuna.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_DIR = join(__dirname, "..", "data", "dane", "geih-2026-05", "CSV");

function leerCsv(nombreParcial) {
  const archivo = readdirSync(CSV_DIR).find((f) => f.includes(nombreParcial));
  if (!archivo) throw new Error(`No encontré un CSV que contenga "${nombreParcial}" en ${CSV_DIR}`);
  const contenido = readFileSync(join(CSV_DIR, archivo), "latin1");
  const [headerLine, ...lineas] = contenido.split("\n").filter((l) => l.trim().length > 0);
  const columnas = headerLine.split(";");
  const indice = (nombre) => {
    const i = columnas.indexOf(nombre);
    if (i === -1) throw new Error(`Columna "${nombre}" no existe en ${archivo}`);
    return i;
  };
  const filas = lineas.map((l) => l.split(";"));
  return { filas, indice };
}

const ocupados = leerCsv("Ocupados.CSV");
const idxFexOcupados = ocupados.indice("FEX_C18");
const idxP6920 = ocupados.indice("P6920");

let totalOcupados = 0;
let totalInformales = 0;
for (const fila of ocupados.filas) {
  const peso = parseFloat(fila[idxFexOcupados]) || 0;
  totalOcupados += peso;
  if (fila[idxP6920] !== "1") totalInformales += peso;
}

const noOcupados = leerCsv("No ocupados.CSV");
const idxFexNoOcup = noOcupados.indice("FEX_C18");
const idxDsi = noOcupados.indice("DSI");

let totalDesocupados = 0;
let registrosDesocupados = 0;
for (const fila of noOcupados.filas) {
  if (fila[idxDsi] === "1") {
    totalDesocupados += parseFloat(fila[idxFexNoOcup]) || 0;
    registrosDesocupados += 1;
  }
}

const pea = totalOcupados + totalDesocupados;
const tasaDesempleo = (totalDesocupados / pea) * 100;
const tasaInformalidad = (totalInformales / totalOcupados) * 100;

const resultado = {
  fuente: "DANE - GEIH (Gran Encuesta Integrada de Hogares)",
  cobertura: "Antioquia (departamento) — el microdato público no desagrega a municipio ni comuna",
  periodo: "2026-05",
  fechaProceso: new Date().toISOString().slice(0, 10),
  tasaDesempleo: Number(tasaDesempleo.toFixed(1)),
  tasaInformalidad: Number(tasaInformalidad.toFixed(1)),
  metodologia: {
    desempleo: "Desocupados (No ocupados.CSV, DSI=1) / (Ocupados + Desocupados), ponderado por FEX_C18.",
    informalidad:
      "Ocupados que no cotizan a pensión (Ocupados.CSV, P6920≠1) / total ocupados, ponderado por FEX_C18. Aproximación por seguridad social; no reproduce la metodología completa de informalidad del DANE.",
  },
  muestra: {
    registrosOcupados: ocupados.filas.length,
    registrosDesocupados,
  },
};

const outDir = join(__dirname, "..", "lib", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "dane-geih.json"), JSON.stringify(resultado, null, 2) + "\n");

console.log(resultado);
