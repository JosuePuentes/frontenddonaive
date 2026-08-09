import type {
  ActorSource,
  EstimatedValueRange,
  QualificationCriteria,
} from "@/types/commercial";

/** Ciclo de vida del Lead (captación) — separado del pipeline de Opportunity. */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualifying",
  "qualified",
  "disqualified",
  "recycled",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  "website",
  "instagram",
  "facebook",
  "whatsapp",
  "referral",
  "academy",
  "event",
  "other",
  "direct",
  "ai_agent",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

/**
 * Tipos de organización.
 * Se mantienen claves legacy (empresa, emprendimiento, …) y se amplían
 * aliases conceptuales (company, startup, …) sin limitar artificialmente.
 */
export const ORGANIZATION_TYPES = [
  "empresa",
  "emprendimiento",
  "comercio",
  "servicios",
  "institucion",
  "proyecto_tecnologico",
  "otro",
  "company",
  "startup",
  "commerce",
  "institution",
  "academy",
  "nonprofit",
  "other",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const INTERACTION_TYPES = [
  "note",
  "call",
  "email",
  "meeting",
  "whatsapp",
  "system",
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const PROJECT_STATUSES = [
  "planning",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Pipeline comercial de Opportunity — separado de LeadStatus. */
export const OPPORTUNITY_STATUSES = [
  "qualified",
  "diagnosis",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "on_hold",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type OpportunityPriority = (typeof OPPORTUNITY_PRIORITIES)[number];

export const OPPORTUNITY_URGENCIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type OpportunityUrgency = (typeof OPPORTUNITY_URGENCIES)[number];

export type {
  Proposal,
  ProposalItem,
  ProposalStatus,
} from "@/types/proposal";

export {
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_FLOW_STAGES,
} from "@/types/proposal";

export type {
  Diagnosis,
  DiagnosisPriority,
} from "@/types/diagnosis";

export {
  DIAGNOSIS_PRIORITIES,
  DIAGNOSIS_STATUSES,
} from "@/types/diagnosis";

export type Organization = {
  id: string;
  name: string;
  type: OrganizationType;
  /** Segmento libre para clasificación futura. */
  segment?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationId?: string;
  role?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  organizationId?: string;
  organizationType?: OrganizationType;
  contactId?: string;
  problem: string;
  budgetRange?: string;
  source: LeadSource;
  status: LeadStatus;
  qualification?: QualificationCriteria;
  notes?: string;
  nextStep?: string;
  nextStepAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Opportunity = {
  id: string;
  /** Nombre de organización para display / DEMO (legacy amigable). */
  organization?: string;
  organizationId?: string;
  contactId?: string;
  leadId?: string;
  problem: string;
  status: OpportunityStatus;
  priority?: OpportunityPriority;
  urgency?: OpportunityUrgency;
  estimatedValue?: number | null;
  estimatedValueRange?: EstimatedValueRange;
  /** Probabilidad de cierre 0–100. Sin fórmula automática. */
  probability?: number | null;
  expectedCloseDate?: string;
  source?: LeadSource;
  /**
   * @deprecated Preferir diagnosisIds. Se mantiene por compatibilidad DEMO.
   */
  diagnosisId?: string;
  /** Relación Opportunity 1 → N Diagnosis. */
  diagnosisIds?: string[];
  /**
   * @deprecated Preferir proposalIds / primaryProposalId.
   */
  proposalId?: string;
  proposalIds?: string[];
  primaryProposalId?: string;
  hasProposal?: boolean;
  lossReasonId?: string;
  lossNotes?: string;
  nextStep?: string;
  nextStepAt?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type Interaction = {
  id: string;
  type: InteractionType;
  summary: string;
  organizationId?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  diagnosisId?: string;
  proposalId?: string;
  projectId?: string;
  createdBy?: ActorSource;
  source?: LeadSource | "system" | string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  owner?: string;
  nextStep?: string;
  organizationId?: string;
  opportunityId?: string;
  proposalId?: string;
  diagnosisId?: string;
  /** Preparado para Proposal accepted → Project (sin automatización). */
  createdFromProposal?: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type CrmPipelineColumn = {
  status: OpportunityStatus;
  label: string;
};

export const CRM_PIPELINE_COLUMNS: CrmPipelineColumn[] = [
  { status: "qualified", label: "Calificado" },
  { status: "diagnosis", label: "Diagnóstico" },
  { status: "proposal", label: "Propuesta" },
  { status: "negotiation", label: "Negociación" },
  { status: "won", label: "Ganado" },
  { status: "lost", label: "Perdido" },
  { status: "on_hold", label: "En espera" },
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualifying: "En calificación",
  qualified: "Calificado",
  disqualified: "Descalificado",
  recycled: "Reciclado",
};

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  qualified: "Calificado",
  diagnosis: "Diagnóstico",
  proposal: "Propuesta",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
  on_hold: "En espera",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Sitio web",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  referral: "Referido",
  academy: "Academy",
  event: "Evento",
  other: "Otro",
  direct: "Contacto directo",
  ai_agent: "Agente IA",
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  empresa: "Empresa",
  emprendimiento: "Emprendimiento",
  comercio: "Comercio",
  servicios: "Servicios",
  institucion: "Institución",
  proyecto_tecnologico: "Proyecto tecnológico",
  otro: "Otro",
  company: "Company",
  startup: "Startup",
  commerce: "Commerce",
  institution: "Institution",
  academy: "Academy",
  nonprofit: "Nonprofit",
  other: "Other",
};
