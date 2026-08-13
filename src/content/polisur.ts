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
    /** PNG con fondo transparente: dos funcionarios + canino. No alterar. */
    binomio: "/polisur/unidad-canina/binomio.png",
  },
} as const;

export const polisurCopy = {
  brand: {
    name: "POLISUR",
    line: "Policía Municipio San Francisco",
    identification: "Institución de seguridad ciudadana",
  },
  hero: {
    title: "POLISUR",
    subtitle: "Policía Municipio San Francisco",
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
  divisions: {
    eyebrow: "Organización",
    title: "Nuestras divisiones",
    body:
      "Presentación preliminar de unidades. El listado oficial se actualizará con la información institucional validada.",
  },
  canina: {
    eyebrow: "Especialidad institucional",
    title: "Unidad Canina",
    body:
      "Una unidad especializada al servicio de la institución. Aquí se publicará la presentación oficial, funciones y trayectoria de la Unidad Canina.",
    cta: "Conocer la Unidad",
  },
  citizen: {
    eyebrow: "Ciudadanía",
    title: "Al servicio de nuestra ciudadanía",
    body:
      "La relación con la ciudadanía se basa en respeto, presencia institucional y atención responsable. Los canales oficiales de atención se publicarán cuando estén validados.",
    pillars: ["Servicio", "Prevención", "Seguridad", "Cercanía"] as const,
  },
  preinscripcion: {
    title: "¿Quieres formar parte de POLISUR?",
    body:
      "Si deseas iniciar un proceso de preinscripción, utiliza el canal institucional preparado para aspirantes.",
    cta: "Realizar preinscripción",
  },
  footer: {
    attention: "Atención ciudadana",
    attentionNote:
      "Los canales oficiales de atención se publicarán cuando estén validados.",
    contactNote:
      "Teléfono, correo y dirección institucional se agregarán con datos oficiales.",
    socialNote: "Redes sociales oficiales pendientes de publicación.",
  },
} as const;

/** Unidades genéricas editables — no presentar como catálogo oficial cerrado. */
export const polisurDivisionItems = [
  {
    key: "unidad-canina",
    name: "Unidad Canina",
    summary:
      "Especialidad institucional con enfoque en entrenamiento y servicio.",
    to: "/polisur/unidad-canina",
    featured: true,
    image: POLISUR_MEDIA.home.canina,
    imagePosition: "center 40%",
  },
  {
    key: "unidad-operativa",
    name: "Unidades operativas",
    summary: "Espacio para las unidades operativas oficiales de la institución.",
    to: "/polisur/divisiones",
    featured: false,
    image: POLISUR_MEDIA.home.about,
    imagePosition: "center",
  },
  {
    key: "prevencion",
    name: "Prevención y cercanía",
    summary: "Espacio para las áreas de prevención y vinculación ciudadana.",
    to: "/polisur/divisiones",
    featured: false,
    image: POLISUR_MEDIA.home.ciudadania,
    imagePosition: "center",
  },
] as const;
