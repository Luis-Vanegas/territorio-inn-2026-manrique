// Datos reales del equipo. Se reemplaza acá directamente cuando llegan
// nombre y foto de cada persona — sin foto, EquipoSection cae al círculo de
// iniciales, así que agregar gente de a una no deja huecos rotos en la UI.

export interface MiembroEquipo {
  iniciales: string;
  nombre: string;
  programaInstitucion: string;
  rol: string;
  /** Ruta dentro de /public, ej. "/equipo/luis.jpg". Opcional: sin foto, se muestran las iniciales. */
  foto?: string;
}

export const equipo: MiembroEquipo[] = [
  {
    iniciales: "NA",
    nombre: "Nombre Apellido",
    programaInstitucion: "Programa · ITM",
    rol: "Rol en el proyecto",
  },
  {
    iniciales: "NA",
    nombre: "Nombre Apellido",
    programaInstitucion: "Programa · ITM",
    rol: "Rol en el proyecto",
  },
  {
    iniciales: "NA",
    nombre: "Nombre Apellido",
    programaInstitucion: "Programa · ITM",
    rol: "Rol en el proyecto",
  },
];
