// Datos reales del equipo. Se reemplaza acá directamente cuando llegan
// nombre y foto de cada persona — sin foto, EquipoSection cae al círculo de
// iniciales, así que agregar gente de a una no deja huecos rotos en la UI.

export interface MiembroEquipo {
  iniciales: string;
  nombre: string;
  rol: string;
  /** Ruta dentro de /public, ej. "/equipo/luis.jpg". Opcional: sin foto, se muestran las iniciales. */
  foto?: string;
}

export const equipo: MiembroEquipo[] = [
  {
    iniciales: "EM",
    nombre: "Estefanía Makiu",
    rol: "Gestora Administrativa y de Formalización",
    foto: "/equipo/estefania.jpg",
  },
  {
    iniciales: "LR",
    nombre: "Luis Ríos",
    rol: "Ingeniero de Innovación e Implementación Web",
    foto: "/equipo/luis.jpg",
  },
  {
    iniciales: "CJ",
    nombre: "Camila Jaramillo",
    rol: "Líder de Crecimiento de Negocios y Experiencia de Usuario",
    foto: "/equipo/camila.jpg",
  },
];
