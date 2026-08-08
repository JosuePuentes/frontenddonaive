/**
 * Motor de diagnóstico Donaive V2 — modelo conceptual (frontend only).
 * Metodología: Observar → Detectar → Analizar → Diseñar → Implementar → Mejorar
 */

export const DIAGNOSIS_STATUSES = [
  "draft",
  "in_progress",
  "review",
  "completed",
  "archived",
] as const;

export type DiagnosisStatus = (typeof DIAGNOSIS_STATUSES)[number];

export const DIAGNOSIS_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type DiagnosisPriority = (typeof DIAGNOSIS_PRIORITIES)[number];

export const OBSERVATION_AREAS = [
  "ventas",
  "compras",
  "inventario",
  "finanzas",
  "recursos_humanos",
  "operaciones",
  "logistica",
  "administracion",
  "tecnologia",
  "marketing",
  "direccion",
  "otro",
] as const;

export type ObservationArea = (typeof OBSERVATION_AREAS)[number];

export const EVIDENCE_LEVELS = [
  "observado",
  "inferido",
  "por_validar",
] as const;

export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

export const ROOT_CAUSE_CATEGORIES = [
  "personas",
  "proceso",
  "tecnologia",
  "informacion",
  "estructura",
  "control",
  "comunicacion",
  "proveedor",
  "cliente",
  "externo",
  "otro",
] as const;

export type RootCauseCategory = (typeof ROOT_CAUSE_CATEGORIES)[number];

export const IMPACT_CATEGORIES = [
  "financial",
  "operational",
  "time",
  "customer",
  "risk",
  "quality",
  "compliance",
  "strategic",
] as const;

export type ImpactCategory = (typeof IMPACT_CATEGORIES)[number];

export const AUTOMATION_TYPES = [
  "workflow",
  "notification",
  "validation",
  "integration",
  "reporting",
  "AI",
  "data",
  "other",
] as const;

export type AutomationType = (typeof AUTOMATION_TYPES)[number];

export const SOLUTION_TYPES = [
  "process",
  "software",
  "SaaS",
  "automation",
  "AI",
  "dashboard",
  "training",
  "consulting",
  "hybrid",
] as const;

export type SolutionType = (typeof SOLUTION_TYPES)[number];

export const RECOMMENDATION_HORIZONS = [
  "quick_win",
  "medium_term",
  "long_term",
] as const;

export type RecommendationHorizon = (typeof RECOMMENDATION_HORIZONS)[number];

export const COMPLEXITY_LEVELS = ["low", "medium", "high"] as const;
export type ComplexityLevel = (typeof COMPLEXITY_LEVELS)[number];

export const EFFORT_LEVELS = ["low", "medium", "high"] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

/** Dimensiones de scoring — sin fórmula automática todavía. */
export type DiagnosisScoreDimensions = {
  severity?: number | null;
  impact?: number | null;
  urgency?: number | null;
  complexity?: number | null;
  automationPotential?: number | null;
};

export type Diagnosis = {
  id: string;
  leadId?: string;
  organizationId?: string;
  title: string;
  summary?: string;
  status: DiagnosisStatus;
  priority: DiagnosisPriority;
  score?: DiagnosisScoreDimensions;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
};

export type Observation = {
  id: string;
  diagnosisId: string;
  area: ObservationArea | string;
  process?: string;
  description: string;
  evidence?: string;
  frequency?: string;
  responsible?: string;
  impact?: string;
  evidenceLevel?: EvidenceLevel;
};

export type Problem = {
  id: string;
  diagnosisId: string;
  description: string;
  origin?: string;
  frequency?: string;
  affectedArea?: string;
  affectedPeople?: string;
  severity?: DiagnosisPriority;
  evidence?: string;
  evidenceLevel?: EvidenceLevel;
};

export type RootCause = {
  id: string;
  diagnosisId: string;
  cause: string;
  category: RootCauseCategory;
  evidence?: string;
  confidence?: EvidenceLevel;
};

export type Impact = {
  id: string;
  diagnosisId: string;
  category: ImpactCategory;
  description: string;
  severity?: DiagnosisPriority;
  estimatedValue?: number | null;
  frequency?: string;
};

export type CurrentProcessStep = {
  id: string;
  diagnosisId: string;
  step: number;
  responsible?: string;
  input?: string;
  action: string;
  output?: string;
  system?: string;
  problem?: string;
};

export type ProposedProcessStep = {
  id: string;
  diagnosisId: string;
  step: number;
  responsible?: string;
  input?: string;
  action: string;
  output?: string;
  automation?: string;
  system?: string;
};

/** Alias conceptuales AS-IS / TO-BE */
export type CurrentProcess = CurrentProcessStep;
export type ProposedProcess = ProposedProcessStep;

export type AutomationOpportunity = {
  id: string;
  diagnosisId: string;
  process: string;
  problem: string;
  opportunity: string;
  automationType: AutomationType;
  expectedBenefit?: string;
  complexity?: ComplexityLevel;
  priority?: DiagnosisPriority;
};

export type Solution = {
  id: string;
  diagnosisId: string;
  description: string;
  type: SolutionType;
  components?: string[];
  dependencies?: string[];
  priority?: DiagnosisPriority;
  estimatedComplexity?: ComplexityLevel;
};

export type Recommendation = {
  id: string;
  diagnosisId: string;
  title: string;
  description: string;
  priority?: DiagnosisPriority;
  impact?: string;
  effort?: EffortLevel;
  sequence: number;
  horizon?: RecommendationHorizon;
};

export const DIAGNOSIS_STATUS_LABELS: Record<DiagnosisStatus, string> = {
  draft: "Borrador",
  in_progress: "En progreso",
  review: "En revisión",
  completed: "Completado",
  archived: "Archivado",
};

export const DIAGNOSIS_PRIORITY_LABELS: Record<DiagnosisPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const OBSERVATION_AREA_LABELS: Record<string, string> = {
  ventas: "Ventas",
  compras: "Compras",
  inventario: "Inventario",
  finanzas: "Finanzas",
  recursos_humanos: "Recursos humanos",
  operaciones: "Operaciones",
  logistica: "Logística",
  administracion: "Administración",
  tecnologia: "Tecnología",
  marketing: "Marketing",
  direccion: "Dirección",
  otro: "Otro",
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  observado: "Observado",
  inferido: "Inferido",
  por_validar: "Por validar",
};

export const ROOT_CAUSE_CATEGORY_LABELS: Record<RootCauseCategory, string> = {
  personas: "Personas",
  proceso: "Proceso",
  tecnologia: "Tecnología",
  informacion: "Información",
  estructura: "Estructura",
  control: "Control",
  comunicacion: "Comunicación",
  proveedor: "Proveedor",
  cliente: "Cliente",
  externo: "Externo",
  otro: "Otro",
};

export const IMPACT_CATEGORY_LABELS: Record<ImpactCategory, string> = {
  financial: "Financiero",
  operational: "Operacional",
  time: "Tiempo",
  customer: "Cliente",
  risk: "Riesgo",
  quality: "Calidad",
  compliance: "Cumplimiento",
  strategic: "Estratégico",
};

export const AUTOMATION_TYPE_LABELS: Record<AutomationType, string> = {
  workflow: "Flujo de trabajo",
  notification: "Notificación",
  validation: "Validación",
  integration: "Integración",
  reporting: "Reportes",
  AI: "IA",
  data: "Datos",
  other: "Otro",
};

export const SOLUTION_TYPE_LABELS: Record<SolutionType, string> = {
  process: "Proceso",
  software: "Software",
  SaaS: "SaaS",
  automation: "Automatización",
  AI: "IA",
  dashboard: "Dashboard",
  training: "Capacitación",
  consulting: "Consultoría",
  hybrid: "Híbrido",
};

export const RECOMMENDATION_HORIZON_LABELS: Record<
  RecommendationHorizon,
  string
> = {
  quick_win: "Quick win",
  medium_term: "Mediano plazo",
  long_term: "Largo plazo",
};

export const DIAGNOSIS_METHODOLOGY_STAGES = [
  "OBSERVAR",
  "DETECTAR",
  "ANALIZAR",
  "DISEÑAR",
  "IMPLEMENTAR",
  "MEJORAR",
] as const;

export const DIAGNOSIS_FORM_STAGES = [
  { key: "context", label: "Contexto", step: 1 },
  { key: "observation", label: "Observación", step: 2 },
  { key: "problem", label: "Problema", step: 3 },
  { key: "cause", label: "Causa", step: 4 },
  { key: "impact", label: "Impacto", step: 5 },
  { key: "current_process", label: "Proceso actual", step: 6 },
  { key: "opportunities", label: "Oportunidades", step: 7 },
  { key: "solution", label: "Solución", step: 8 },
  { key: "recommendations", label: "Recomendaciones", step: 9 },
] as const;

export type DiagnosisFormStageKey =
  (typeof DIAGNOSIS_FORM_STAGES)[number]["key"];

export const DIAGNOSIS_VIEW_TABS = [
  { key: "summary", label: "Resumen" },
  { key: "observations", label: "Observaciones" },
  { key: "problems", label: "Problemas" },
  { key: "causes", label: "Causas" },
  { key: "impacts", label: "Impactos" },
  { key: "process", label: "Proceso actual" },
  { key: "automation", label: "Automatización" },
  { key: "solution", label: "Solución" },
  { key: "recommendations", label: "Recomendaciones" },
] as const;

export type DiagnosisViewTabKey = (typeof DIAGNOSIS_VIEW_TABS)[number]["key"];
