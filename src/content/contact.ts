import type { PageContent } from "@/types/content";
import { ROUTES } from "@/constants/routes";

export const contactContent: PageContent = {
  eyebrow: "Contacto",
  title: "Cuéntanos qué problema tienes",
  description:
    "El objetivo de este espacio es captar personas u organizaciones que tengan un problema que quieran resolver.",
  blocks: [
    {
      id: "enfoque",
      title: "Cómo empezamos",
      description:
        "Empezamos por entender el problema, el contexto y el impacto. No limitamos el contacto a solicitar desarrollo web.",
    },
    {
      id: "preparacion",
      title: "Formulario",
      description:
        "El formulario funcional se conectará más adelante. Por ahora, esta página define la intención y el mensaje principal.",
    },
  ],
  notes: [`CTA principal: ${ROUTES.contacto}`],
};
