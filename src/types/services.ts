/**
 * Catálogo de servicios Donaive V2 — modelo conceptual (frontend only).
 * Las categorías no afirman productos finales definitivos.
 */

export const SERVICE_CATEGORY_KEYS = [
  "diagnostico_estrategia",
  "procesos_organizacion",
  "automatizacion",
  "inteligencia_artificial",
  "sistemas_saas",
  "business_intelligence",
  "formacion",
  "diseno_identidad",
] as const;

export type ServiceCategoryKey = (typeof SERVICE_CATEGORY_KEYS)[number];

export const PRICING_MODELS = [
  "fixed",
  "hourly",
  "monthly",
  "custom",
] as const;

export type PricingModel = (typeof PRICING_MODELS)[number];

export const SERVICE_CURRENCIES = ["USD", "VES", "EUR"] as const;
export type ServiceCurrency = (typeof SERVICE_CURRENCIES)[number];

export type ServiceCategory = {
  id: string;
  key: ServiceCategoryKey;
  name: string;
  description?: string;
  active: boolean;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ServiceCategoryKey;
  active: boolean;
  pricingModel: PricingModel;
  /** Opcional: proyectos personalizados no requieren precio base. */
  basePrice?: number | null;
  currency?: ServiceCurrency;
  estimatedDuration?: string;
  deliverables?: string[];
  tags?: string[];
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ServicePackage = {
  id: string;
  name: string;
  description: string;
  services: string[];
  pricingModel: PricingModel;
  /** Opcional — sin precios comerciales definitivos. */
  basePrice?: number | null;
  currency?: ServiceCurrency;
  active?: boolean;
  isDemo?: boolean;
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategoryKey, string> = {
  diagnostico_estrategia: "Diagnóstico y estrategia",
  procesos_organizacion: "Procesos y organización",
  automatizacion: "Automatización",
  inteligencia_artificial: "Inteligencia artificial",
  sistemas_saas: "Sistemas y SaaS",
  business_intelligence: "Business Intelligence",
  formacion: "Formación",
  diseno_identidad: "Diseño e identidad",
};

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  fixed: "Precio fijo",
  hourly: "Por hora",
  monthly: "Mensual",
  custom: "Personalizado",
};

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "cat-diagnostico",
    key: "diagnostico_estrategia",
    name: SERVICE_CATEGORY_LABELS.diagnostico_estrategia,
    description: "Comprensión del problema y definición de rumbo.",
    active: true,
  },
  {
    id: "cat-procesos",
    key: "procesos_organizacion",
    name: SERVICE_CATEGORY_LABELS.procesos_organizacion,
    description: "Orden, roles y flujos de trabajo.",
    active: true,
  },
  {
    id: "cat-automatizacion",
    key: "automatizacion",
    name: SERVICE_CATEGORY_LABELS.automatizacion,
    description: "Reducción de fricción operativa.",
    active: true,
  },
  {
    id: "cat-ia",
    key: "inteligencia_artificial",
    name: SERVICE_CATEGORY_LABELS.inteligencia_artificial,
    description: "Capacidades asistidas — sin afirmar producto final.",
    active: true,
  },
  {
    id: "cat-sistemas",
    key: "sistemas_saas",
    name: SERVICE_CATEGORY_LABELS.sistemas_saas,
    description: "Sistemas y plataformas a medida o SaaS.",
    active: true,
  },
  {
    id: "cat-bi",
    key: "business_intelligence",
    name: SERVICE_CATEGORY_LABELS.business_intelligence,
    description: "Visibilidad y decisiones con datos.",
    active: true,
  },
  {
    id: "cat-formacion",
    key: "formacion",
    name: SERVICE_CATEGORY_LABELS.formacion,
    description: "Transferencia de capacidad al equipo.",
    active: true,
  },
  {
    id: "cat-diseno",
    key: "diseno_identidad",
    name: SERVICE_CATEGORY_LABELS.diseno_identidad,
    description: "Identidad y experiencia visual.",
    active: true,
  },
];
