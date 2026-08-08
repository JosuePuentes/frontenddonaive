import type { PageContent } from "@/types/content";

export const blogContent: PageContent = {
  eyebrow: "Blog",
  title: "Estrategia, procesos, tecnología e inteligencia artificial",
  description:
    "El blog de Donaive quedará preparado para artículos y reflexiones sobre mejora organizacional y tecnología aplicada. Todavía no hay publicaciones activas.",
  categories: [
    {
      id: "editorial",
      title: "Categorías editoriales",
      description: "Estructura prevista para organizar futuros artículos.",
      items: [
        "Estrategia",
        "Procesos",
        "Tecnología",
        "IA",
        "Automatización",
        "Negocios",
        "Liderazgo",
      ],
    },
  ],
  notes: [
    "Estado vacío intencional: no se crean artículos falsos.",
    "La estructura queda lista para conectarse a CMS o API más adelante.",
  ],
};
