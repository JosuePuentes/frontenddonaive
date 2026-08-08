import type { LeadSource } from "@/types/crm";

/** Mapeo de opciones del formulario público → fuentes CRM futuras. */
export const contactSourceToLeadSource: Record<string, LeadSource> = {
  "Búsqueda en internet": "website",
  "Sitio web": "website",
  Recomendación: "referral",
  "Redes sociales": "instagram",
  Instagram: "instagram",
  Facebook: "facebook",
  WhatsApp: "whatsapp",
  Academy: "academy",
  Evento: "event",
  Otro: "other",
};

export const crmFlowStages = [
  "VISITANTE",
  "CONTACTO",
  "PROBLEMA IDENTIFICADO",
  "DIAGNÓSTICO INICIAL",
  "OPORTUNIDAD",
  "PROPUESTA",
  "NEGOCIACIÓN",
  "CLIENTE",
  "PROYECTO",
  "SEGUIMIENTO",
  "MEJORA / NUEVAS OPORTUNIDADES",
] as const;
