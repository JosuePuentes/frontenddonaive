import type { LegalContent } from "@/types/content";

export const privacyContent: LegalContent = {
  title: "Política de Privacidad",
  description:
    "Documento estructural preliminar. Se ampliará cuando los flujos de datos y formularios estén activos.",
  sections: [
    {
      id: "alcance",
      title: "Alcance",
      paragraphs: [
        "Esta política describe, de forma preliminar, cómo Donaive trata la información cuando un usuario interactúa con el sitio.",
      ],
    },
    {
      id: "datos",
      title: "Datos",
      paragraphs: [
        "Cuando existan formularios u otros canales de contacto, se indicará qué datos se solicitan y con qué finalidad.",
      ],
    },
  ],
};

export const termsContent: LegalContent = {
  title: "Términos y Condiciones",
  description:
    "Documento estructural preliminar sobre el uso del sitio y la presentación de servicios de Donaive.",
  sections: [
    {
      id: "uso",
      title: "Uso del sitio",
      paragraphs: [
        "El contenido publicado tiene carácter informativo y puede actualizarse a medida que la plataforma evolucione.",
      ],
    },
    {
      id: "servicios",
      title: "Servicios",
      paragraphs: [
        "La descripción de capacidades no constituye una oferta cerrada. Cada solución se define según el problema y el contexto de la organización.",
      ],
    },
  ],
};
