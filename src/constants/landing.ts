export const homeSeo = {
  title:
    "Donaive — Sistemas, automatización e inteligencia para organizaciones",
  description:
    "Donaive analiza problemas, diseña procesos y desarrolla sistemas, automatización e inteligencia artificial para ayudar a las organizaciones a funcionar mejor.",
} as const;

export const heroContent = {
  badge: "Diseñamos sistemas para resolver problemas reales.",
  title: "Convertimos problemas complejos en sistemas que funcionan.",
  subtitle:
    "Donaive analiza procesos, estructuras y operaciones para diseñar soluciones mediante estrategia, automatización, inteligencia artificial y tecnología.",
  primaryCta: {
    label: "Cuéntanos tu problema",
    to: "/contacto",
  },
  secondaryCta: {
    label: "Conoce nuestras soluciones",
    to: "/soluciones",
  },
} as const;

export const heroFlowSteps = [
  { id: "problema", label: "Problema", detail: "Señal operativa" },
  { id: "analisis", label: "Análisis", detail: "Causa y contexto" },
  { id: "solucion", label: "Solución", detail: "Diseño adaptado" },
  { id: "automatizacion", label: "Automatización", detail: "Sistema activo" },
  { id: "resultado", label: "Resultado", detail: "Mejora medible" },
] as const;

export const companiesContent = {
  title: "Donde existe un problema, existe una oportunidad de mejorar.",
  description:
    "Donaive adapta su metodología al contexto de cada organización, independientemente de su sector.",
  categories: [
    { id: "empresas", label: "Empresas", icon: "building" },
    { id: "emprendimientos", label: "Emprendimientos", icon: "rocket" },
    { id: "comercio", label: "Comercio", icon: "store" },
    { id: "servicios", label: "Servicios", icon: "briefcase" },
    { id: "instituciones", label: "Instituciones", icon: "landmark" },
    { id: "proyectos", label: "Proyectos tecnológicos", icon: "code" },
  ],
} as const;

export const servicesContent = {
  title: "Capacidades para mejorar cómo funciona una organización",
  description:
    "Combinamos análisis, diseño de procesos, tecnología e inteligencia artificial cuando realmente aportan valor.",
  cta: {
    label: "Explorar soluciones",
    to: "/soluciones",
  },
  items: [
    {
      id: "diagnostico",
      title: "Diagnóstico y estrategia",
      description:
        "Analizamos cómo funciona una organización para encontrar problemas, riesgos y oportunidades de mejora.",
      icon: "search",
    },
    {
      id: "procesos",
      title: "Procesos y estructura",
      description:
        "Diseñamos procesos, responsabilidades, estructuras y procedimientos para que las operaciones sean más claras y controlables.",
      icon: "workflow",
    },
    {
      id: "automatizacion",
      title: "Automatización e IA",
      description:
        "Convertimos tareas repetitivas y procesos manuales en sistemas automatizados utilizando tecnología e inteligencia artificial.",
      icon: "bot",
    },
    {
      id: "sistemas",
      title: "Sistemas y SaaS",
      description:
        "Diseñamos y desarrollamos sistemas digitales adaptados a las necesidades específicas de cada organización.",
      icon: "layers",
    },
    {
      id: "bi",
      title: "Inteligencia de negocios",
      description:
        "Transformamos datos operativos en información útil para tomar mejores decisiones.",
      icon: "chart",
    },
    {
      id: "formacion",
      title: "Formación",
      description:
        "Desarrollamos capacidades para que los equipos puedan analizar problemas, utilizar tecnología y mejorar continuamente.",
      icon: "graduation",
    },
  ],
} as const;

export const methodologyContent = {
  title: "Cómo trabaja Donaive",
  description:
    "No empezamos preguntando qué software necesita una organización. Empezamos entendiendo qué problema tiene.",
  steps: [
    {
      id: "observar",
      number: "01",
      title: "Observar",
      description: "Entender cómo funciona realmente la organización.",
    },
    {
      id: "detectar",
      number: "02",
      title: "Detectar",
      description:
        "Encontrar errores, riesgos, cuellos de botella y oportunidades.",
    },
    {
      id: "analizar",
      number: "03",
      title: "Analizar",
      description:
        "Determinar por qué ocurre el problema y cuál es su impacto.",
    },
    {
      id: "disenar",
      number: "04",
      title: "Diseñar",
      description: "Crear una solución adaptada al contexto real.",
    },
    {
      id: "implementar",
      number: "05",
      title: "Implementar",
      description:
        "Convertir el diseño en procesos, sistemas y herramientas.",
    },
    {
      id: "mejorar",
      number: "06",
      title: "Mejorar",
      description: "Medir resultados y continuar optimizando.",
    },
  ],
} as const;

export const ctaContent = {
  title: "¿Tienes un problema que todavía no has podido resolver?",
  description:
    "Cuéntanos qué está ocurriendo. Analizamos el problema y determinamos cómo puede resolverse.",
  button: {
    label: "Hablar con Donaive",
    to: "/contacto",
  },
} as const;
