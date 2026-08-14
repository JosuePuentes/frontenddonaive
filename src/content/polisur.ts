/**
 * Contenido institucional de POLISUR.
 * Textos basados en información pública sobre el Instituto Autónomo
 * Policía del Municipio San Francisco (Zulia, Venezuela).
 */

export const POLISUR_MEDIA = {
  logo: "/polisur/logo/escudo.png",
  parche: "/polisur/logo/parche.png",
  k9: "/polisur/logo/k9-emblema.png",
  visipol: "/polisur/logo/visipol.png",
  cuadrantesPaz: "/polisur/logo/cuadrantes-paz.png",
  justiciaPaz: "/polisur/logo/justicia-paz.png",
  home: {
    hero: "/polisur/home/hero.jpg",
    about: "/polisur/home/about.jpg",
    canina: "/polisur/home/canina.jpg",
    ciudadania: "/polisur/home/ciudadania.jpg",
  },
  unidadCanina: {
    hero: "/polisur/unidad-canina/hero.jpg",
    entrenamiento: "/polisur/unidad-canina/entrenamiento.jpg",
    binomio: "/polisur/unidad-canina/binomio.png",
  },
} as const;

export const polisurCopy = {
  brand: {
    name: "POLISUR",
    line: "Policía del Municipio San Francisco",
    fullName:
      "Instituto Autónomo Policía del Municipio San Francisco",
    identification:
      "Cuerpo de seguridad ciudadana del municipio San Francisco, estado Zulia. Fundada el 18 de abril de 1996.",
    jurisdiction:
      "Municipio San Francisco · Estado Zulia · Venezuela",
  },
  hero: {
    title: "POLISUR",
    subtitle: "Instituto Autónomo Policía del Municipio San Francisco",
    message:
      "Tres décadas al servicio del pueblo sanfranciscano: educar, proteger y servir con disciplina, prevención y presencia en las siete parroquias del municipio.",
    ctaPrimary: "Conoce la institución",
    ctaSecondary: "Preinscripción",
  },
  about: {
    eyebrow: "Nuestra institución",
    title: "Pilar de seguridad ciudadana en San Francisco",
    body:
      "POLISUR es el Instituto Autónomo Policía del Municipio San Francisco. Desde su fundación, el 18 de abril de 1996, la institución ha sostenido una labor continua de protección, orden público y convivencia ciudadana en la jurisdicción sanfranciscana, consolidándose como referencia de seguridad en la región zuliana.",
    history:
      "En 2026 la institución conmemoró su trigésimo aniversario, reafirmando el compromiso de hombres y mujeres que, con convicción y mística de servicio, trabajan por la tranquilidad del municipio. Con el apoyo de la Alcaldía y la comunidad, POLISUR ha fortalecido su despliegue mediante dotación de unidades patrulleras, equipos de comunicación y organización comunitaria a través de Cuadrantes de Paz.",
  },
  mission: {
    title: "Misión",
    body:
      "Prestar un servicio de seguridad fundamentado en educar, proteger y servir a las comunidades; garantizando credibilidad y bienestar social, para mejorar la calidad de vida de quienes residen en el municipio San Francisco, con criterios éticos, morales y sociales.",
  },
  vision: {
    title: "Visión",
    body:
      "Consolidarse como una institución modelo reconocida por su proactividad y calidad de servicio a las comunidades; con un alto nivel de profesionalismo, brindando respuestas eficaces en materia de defensa y apoyo social, ofreciendo valor agregado a la gestión pública municipal.",
  },
  values: {
    title: "Valores institucionales",
    items: [
      "Respeto, libertad y justicia",
      "Imparcialidad y rectitud",
      "Disciplina, lealtad y obediencia institucional",
      "Dedicación y servicio oportuno",
      "Trabajo en equipo con la comunidad",
    ] as const,
  },
  functions: {
    title: "Funciones",
    body:
      "Velar por la seguridad de las personas y los bienes, el mantenimiento de la moralidad, la salubridad, el urbanismo, el turismo, la defensa del ambiente, el tránsito y el orden público en la jurisdicción municipal, con patrullaje preventivo y atención ciudadana responsable.",
  },
  divisions: {
    eyebrow: "Organización",
    title: "Nuestras divisiones",
    body:
      "POLISUR organiza su labor en unidades operativas, especialidades y programas de prevención y cercanía ciudadana, con despliegue en las parroquias del municipio San Francisco.",
  },
  canina: {
    eyebrow: "Especialidad institucional",
    title: "Unidad Canina",
    body:
      "Unidad de Patrullaje Canino al servicio de la institución, orientada al apoyo operativo, la prevención y las labores especializadas donde el binomio policía-canino aporta capacidad técnica al servicio de la ciudadanía.",
    cta: "Conocer la Unidad",
  },
  citizen: {
    eyebrow: "Ciudadanía",
    title: "Al servicio de nuestra ciudadanía",
    body:
      "La relación con la comunidad se sustenta en el respeto, la información transparente y la organización en Mesas y Cuadrantes de Paz, como vía para atender necesidades de seguridad y convivencia junto a los vecinos del municipio.",
    pillars: [
      "Servicio",
      "Prevención",
      "Seguridad",
      "Cuadrantes de Paz",
    ] as const,
  },
  preinscripcion: {
    title: "¿Quieres formar parte de POLISUR?",
    body:
      "Complete el formulario institucional con sus datos de contacto y la unidad a la que desea pertenecer.",
    cta: "Realizar preinscripción",
  },
  footer: {
    attention: "Atención ciudadana",
    attentionNote:
      "POLISUR mantiene canales de atención y patrullaje preventivo en el municipio San Francisco. Consulte en la institución los horarios y puntos de atención vigentes.",
    contactNote:
      "Municipio San Francisco, estado Zulia — República Bolivariana de Venezuela.",
    socialNote:
      "Siga las redes y comunicados oficiales de POLISUR para información institucional actualizada.",
  },
} as const;

export const polisurDivisionItems = [
  {
    key: "unidad-canina",
    name: "Unidad Canina",
    summary:
      "Patrullaje canino y apoyo especializado con binomios entrenados al servicio de la institución.",
    to: "/polisur/unidad-canina",
    featured: true,
    image: POLISUR_MEDIA.home.canina,
    imagePosition: "center 40%",
  },
  {
    key: "unidad-operativa",
    name: "Unidades operativas",
    summary:
      "Patrullaje preventivo, orden público y respuesta operativa en las siete parroquias del municipio.",
    to: "/polisur/divisiones",
    featured: false,
    image: POLISUR_MEDIA.home.about,
    imagePosition: "center",
  },
  {
    key: "prevencion",
    name: "Prevención y Cuadrantes de Paz",
    summary:
      "Vinculación comunitaria, Mesas y Cuadrantes de Paz, y prevención para la convivencia ciudadana.",
    to: "/polisur/divisiones",
    featured: false,
    image: POLISUR_MEDIA.home.ciudadania,
    imagePosition: "center",
  },
] as const;
