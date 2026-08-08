import type { ContactContent } from "@/types/content";

export const contactContent: ContactContent = {
  eyebrow: "Contacto",
  title: "Cuéntanos qué problema estás intentando resolver",
  description:
    "No necesitas saber qué software necesitas. Necesitas contarnos qué problema tienes. A partir de ahí analizamos el contexto y determinamos cómo puede abordarse.",
  supportingTitle: "Cómo empezamos la conversación",
  supportingDescription:
    "El objetivo de este espacio es captar personas u organizaciones que tengan un problema concreto que quieran resolver.",
  formIntro: "Formulario visual preparado para una futura conexión.",
  formNote:
    "Este formulario no envía información todavía. Está listo en frontend para conectarse más adelante.",
  ctaLabel: "Enviar mensaje",
  closingMessage:
    "No necesitas saber qué software necesitas. Necesitas contarnos qué problema tienes.",
  fields: [
    {
      id: "nombre",
      label: "Nombre",
      type: "text",
      placeholder: "Tu nombre",
      required: true,
    },
    {
      id: "organizacion",
      label: "Empresa / Organización",
      type: "text",
      placeholder: "Nombre de la organización",
    },
    {
      id: "correo",
      label: "Correo",
      type: "email",
      placeholder: "correo@empresa.com",
      required: true,
    },
    {
      id: "telefono",
      label: "Teléfono",
      type: "tel",
      placeholder: "+58 000 0000000",
    },
    {
      id: "tipo",
      label: "Tipo de organización",
      type: "select",
      options: [
        "Empresa",
        "Emprendimiento",
        "Comercio",
        "Servicios",
        "Institución",
        "Proyecto tecnológico",
        "Otro",
      ],
      required: true,
    },
    {
      id: "problema",
      label: "¿Qué problema necesitas resolver?",
      type: "textarea",
      placeholder: "Descríbenos el problema, el contexto y el impacto.",
      required: true,
    },
    {
      id: "presupuesto",
      label: "Presupuesto aproximado",
      type: "select",
      options: [
        "Por definir",
        "Menos de 1.000 USD",
        "1.000 – 5.000 USD",
        "5.000 – 15.000 USD",
        "Más de 15.000 USD",
      ],
    },
    {
      id: "origen",
      label: "Cómo nos conociste",
      type: "select",
      options: [
        "Sitio web",
        "Instagram",
        "Facebook",
        "WhatsApp",
        "Recomendación",
        "Academy",
        "Evento",
        "Otro",
      ],
    },
  ],
  blocks: [
    {
      id: "enfoque",
      title: "Empezamos por el problema",
      description:
        "No limitamos el contacto a solicitar desarrollo web. Queremos entender qué está ocurriendo y cuál es el impacto.",
    },
    {
      id: "siguiente",
      title: "Qué ocurre después",
      description:
        "Cuando el formulario esté conectado, usaremos esta información para evaluar el contexto y proponer el siguiente paso.",
    },
  ],
};
