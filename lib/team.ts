// Datos reales del equipo. Se reemplaza acá directamente cuando llegan
// nombre y foto de cada persona — sin foto, EquipoSection cae al círculo de
// iniciales, así que agregar gente de a una no deja huecos rotos en la UI.

export interface MiembroEquipo {
  iniciales: string;
  nombre: string;
  programaInstitucion: string;
  /** Opcional: no todos tienen un rol definido todavía. */
  rol?: string;
  /** Ruta dentro de /public, ej. "/equipo/luis.jpg". Opcional: sin foto, se muestran las iniciales. */
  foto?: string;
}

export const equipo: MiembroEquipo[] = [
  {
    iniciales: "LR",
    nombre: "Luis Rios Vanegas",
    programaInstitucion: "Ingeniería en Ciencia de Datos, en curso",
    foto: "/equipo/fotoitm.jpeg",
  },
  {
    iniciales: "EM",
    nombre: "Estefania Mesa Makiu",
    programaInstitucion: "Ingeniería de Diseño Industrial, en curso · ITM",
    foto: "/equipo/Estefania.jpeg",
  },
  {
    iniciales: "MJ",
    nombre: "Maria Camila Jaramillo Zapata",
    programaInstitucion: "Negocios Internacionales, en curso · Tecnológico de Antioquia",
    foto: "/equipo/fotoCamila.jpeg",
  },
];
