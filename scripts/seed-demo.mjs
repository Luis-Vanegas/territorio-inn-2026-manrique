#!/usr/bin/env node
/**
 * Datos de demostración para desarrollo y para mostrar el módulo funcionando.
 *
 *   node scripts/seed-demo.mjs            carga los registros de demo
 *   node scripts/seed-demo.mjs --limpiar  los borra
 *
 * NO son emprendimientos reales. Son ejemplos plausibles para probar el mapa,
 * los filtros y la cola de moderación sin esperar registros de verdad.
 *
 * Todos llevan el prefijo [DEMO] en el nombre para que sea imposible
 * confundirlos con un registro ciudadano — y para que --limpiar sepa cuáles
 * borrar sin tocar nada más.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MARCA = '[DEMO]';

function cargarEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    for (const linea of readFileSync(join(RAIZ, '.env.local'), 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {}
}

/**
 * Coordenadas dentro del polígono real de Manrique.
 * Verificadas con scripts/verificar-geo.mjs: si alguna cayera fuera, el CHECK
 * de la base rechazaría el insert.
 */
const DEMO = [
  {
    nombre: 'Panadería La Esperanza',
    descripcion: 'Pan artesanal, buñuelos y pasteles por encargo. Abrimos desde las 5 de la mañana.',
    categoria: 'alimentacion',
    direccion: 'Calle 70 #45-12',
    barrio: 'Manrique Central',
    lat: 6.2731, lng: -75.5453,
    whatsapp: '3001234567',
    estado: 'aprobado',
  },
  {
    nombre: 'Taller El Buen Motor',
    descripcion: 'Mecánica de motos, cambio de aceite y revisión técnica. Veinte años en el barrio.',
    categoria: 'tecnologia',
    direccion: 'Carrera 45 #72-30',
    barrio: 'Campo Valdés',
    lat: 6.2760, lng: -75.5478,
    whatsapp: '3109876543',
    telefono: '6044445566',
    estado: 'aprobado',
  },
  {
    nombre: 'Sazón de la Abuela',
    descripcion: 'Almuerzos caseros y sancocho los domingos. Servicio a domicilio en la comuna.',
    categoria: 'alimentacion',
    direccion: 'Calle 75 #42-18',
    barrio: 'San Blas',
    lat: 6.2782, lng: -75.5442,
    whatsapp: '3205554433',
    instagram: 'sazondelaabuela',
    estado: 'aprobado',
  },
  {
    nombre: 'Estilos Carolina',
    descripcion: 'Peluquería y manicure. Atención con cita previa.',
    categoria: 'belleza',
    direccion: 'Carrera 42 #68-05',
    barrio: 'Manrique Oriental',
    lat: 6.2708, lng: -75.5418,
    whatsapp: '3116667788',
    estado: 'aprobado',
  },
  {
    nombre: 'Confecciones Mariela',
    descripcion: 'Arreglos de ropa, uniformes escolares y confección a medida.',
    categoria: 'moda',
    direccion: 'Calle 67 #44-22',
    barrio: 'Las Granjas',
    lat: 6.2690, lng: -75.5462,
    whatsapp: '3123334455',
    correo: 'confeccionesmariela@ejemplo.com',
    estado: 'aprobado',
  },
  {
    nombre: 'Refuerzo Escolar Manrique',
    descripcion: 'Clases de matemáticas y español para primaria y bachillerato.',
    categoria: 'educacion',
    direccion: 'Carrera 43 #74-16',
    barrio: 'La Salle',
    lat: 6.2795, lng: -75.5495,
    whatsapp: '3138889900',
    // Este queda pendiente a propósito: sirve para probar la cola de moderación.
    estado: 'pendiente',
  },
];

async function main() {
  cargarEnv();
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  if (process.argv.includes('--limpiar')) {
    const borrados = await sql`
      delete from portafolios where nombre like ${MARCA + '%'} returning id
    `;
    await sql`delete from admins where email = 'demo@territorio-inn.co'`;
    console.log(`Borrados ${borrados.length} registros de demo.`);
    return;
  }

  // La FK de moderado_por exige un admin existente para los aprobados.
  await sql`
    insert into admins (email, nombre, password_hash, activo)
    values ('demo@territorio-inn.co', 'Moderador demo', 'sin-acceso', false)
    on conflict (email) do nothing
  `;

  let creados = 0;

  for (const d of DEMO) {
    const aprobado = d.estado === 'aprobado';

    await sql`
      insert into portafolios (
        nombre, descripcion, categoria_id, direccion, barrio, latitud, longitud,
        whatsapp, telefono, correo, instagram,
        acepto_terminos, acepto_habeas_data, version_terminos,
        estado, moderado_por, moderado_en
      ) values (
        ${`${MARCA} ${d.nombre}`}, ${d.descripcion}, ${d.categoria},
        ${d.direccion}, ${d.barrio}, ${d.lat}, ${d.lng},
        ${d.whatsapp ?? null}, ${d.telefono ?? null},
        ${d.correo ?? null}, ${d.instagram ?? null},
        true, true, '2026-01-v1',
        ${d.estado},
        ${aprobado ? 'demo@territorio-inn.co' : null},
        ${aprobado ? new Date().toISOString() : null}
      )
    `;
    creados++;
  }

  console.log(`Cargados ${creados} registros de demo.`);
  console.log(`  aprobados: ${DEMO.filter((d) => d.estado === 'aprobado').length}`);
  console.log(`  pendientes: ${DEMO.filter((d) => d.estado === 'pendiente').length}`);
  console.log('\nPara borrarlos: node scripts/seed-demo.mjs --limpiar');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
