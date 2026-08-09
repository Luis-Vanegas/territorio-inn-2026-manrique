import 'server-only';
import { neon } from '@neondatabase/serverless';

/**
 * Único punto del código que conoce el driver de la base.
 *
 * Migrabilidad: todo el SQL del proyecto es Postgres estándar y las queries
 * viven en los repositorios, no acá. Para mover el proyecto a Supabase, RDS o
 * un Postgres administrado, se cambia este archivo — nada más.
 *
 * Se usa el driver HTTP (no Pool): las server actions y los server components
 * hacen consultas sueltas y sin estado, que es justo para lo que sirve. Las
 * migraciones sí usan Pool, porque necesitan transacciones interactivas.
 */

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Falta DATABASE_URL. En local va en .env.local; en Vercel, en Project Settings → Environment Variables.',
  );
}

export const sql = neon(process.env.DATABASE_URL);
