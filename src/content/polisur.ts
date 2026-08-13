/**
 * Contenido editable de POLISUR.
 * Sustituir textos cuando la institución proporcione versión oficial.
 * No inventar lemas, divisiones ni datos de contacto no validados.
 */

export const POLISUR_MEDIA = {
  logo: "/polisur/logo/escudo.png",
  home: {
    hero: "/polisur/home/hero.jpg",
    about: "/polisur/home/about.jpg",
    canina: "/polisur/home/canina.jpg",
    ciudadania: "/polisur/home/ciudadania.jpg",
  },
  unidadCanina: {
    hero: "/polisur/unidad-canina/hero.jpg",
    entrenamiento: "/polisur/unidad-canina/entrenamiento.jpg",
  },
} as const;

export const polisurCopy = {
  brand: {
    name: "POLISUR",
    line: "Institución de seguridad ciudadana",
  },
  hero: {
    title: "POLISUR",
    message:
      "Trabajamos por la seguridad de nuestra comunidad con disciplina, prevención y servicio público.",
    ctaPrimary: "Conoce la institución",
    ctaSecondary: "Preinscripción",
  },
  about: {
    eyebrow: "Nuestra institución",
    title: "Compromiso con la seguridad ciudadana",
    body:
      "POLISUR orienta su labor al servicio público, la prevención y la protección de la ciudadanía. Esta sección se actualizará con el texto institucional oficial.",
  },
  canina: {
    title: "Unidad Canina",
    body:
      "Una unidad especializada al servicio de la institución. Aquí se publicará la presentación oficial, funciones y trayectoria de la Unidad Canina.",
    cta: "Conoce la Unidad Canina",
  },
  citizen: {
    eyebrow: "Atención ciudadana",
    title: "Cercanía, prevención y servicio",
    body:
      "La relación con la ciudadanía se basa en respeto, presencia institucional y atención responsable. Los canales oficiales de atención se publicarán cuando estén validados.",
  },
  preinscripcion: {
    title: "Formar parte de POLISUR",
    body:
      "Si deseas iniciar un proceso de preinscripción, utiliza el canal institucional preparado para aspirantes.",
    cta: "Ir a preinscripción",
  },
} as const;

export const polisurAccessItems = [
  {
    key: "institucion",
    label: "Nuestra institución",
    description: "Identidad y compromiso institucional",
    to: "/polisur#institucion",
  },
  {
    key: "divisiones",
    label: "Divisiones",
    description: "Organización operativa",
    to: "/polisur/divisiones",
  },
  {
    key: "canina",
    label: "Unidad Canina",
    description: "Especialidad y entrenamiento",
    to: "/polisur/unidad-canina",
  },
  {
    key: "ciudadania",
    label: "Atención ciudadana",
    description: "Servicio a la comunidad",
    to: "/polisur#ciudadania",
  },
  {
    key: "preinscripcion",
    label: "Preinscripción",
    description: "Aspirantes a la institución",
    to: "/polisur/preinscripcion",
  },
] as const;

/** Unidades genéricas editables — no presentar como catálogo oficial cerrado. */
export const polisurDivisionItems = [
  {
    key: "unidad-canina",
    name: "Unidad Canina",
    summary: "Especialidad institucional con enfoque en entrenamiento y servicio.",
    to: "/polisur/unidad-canina",
    featured: true,
  },
  {
    key: "unidad-operativa",
    name: "Unidades operativas",
    summary: "Espacio para las unidades operativas oficiales de la institución.",
    to: "/polisur/divisiones",
    featured: false,
  },
  {
    key: "prevencion",
    name: "Prevención y cercanía",
    summary: "Espacio para las áreas de prevención y vinculación ciudadana.",
    to: "/polisur/divisiones",
    featured: false,
  },
] as const;
