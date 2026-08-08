import type { PageContent } from "@/types/content";

export const mediaContent: PageContent = {
  eyebrow: "Media",
  title: "Ideas, análisis y tecnología aplicada",
  description:
    "Donaive Media será el espacio para contenido sobre problemas reales, pensamiento estratégico y tecnología aplicada a organizaciones.",
  categories: [
    {
      id: "temas",
      title: "Categorías editoriales",
      description: "Temas previstos para piezas futuras de Media.",
      items: [
        "Análisis",
        "Tecnología",
        "Inteligencia artificial",
        "Negocios",
        "Procesos",
        "Liderazgo",
        "Estrategia",
        "Casos y problemas reales",
      ],
    },
  ],
  blocks: [
    {
      id: "analisis",
      title: "Análisis",
      description: "Lecturas sobre fricción operativa y diagnóstico organizacional.",
    },
    {
      id: "tecnologia",
      title: "Tecnología",
      description: "Tecnología aplicada a procesos, sistemas y control.",
    },
    {
      id: "ia",
      title: "Inteligencia artificial",
      description: "Usos concretos de IA cuando aportan valor real.",
    },
    {
      id: "estrategia",
      title: "Estrategia",
      description: "Decisiones, estructura y mejora continua.",
    },
  ],
  notes: [
    "Las tarjetas actuales son placeholders de categorías.",
    "No se presentan artículos publicados inventados.",
  ],
};
