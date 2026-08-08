export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "diagnosis",
  "proposal",
  "negotiation",
  "won",
  "lost",
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
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const ORGANIZATION_TYPES = [
  "empresa",
  "emprendimiento",
  "comercio",
  "servicios",
  "institucion",
  "proyecto_tecnologico",
  "otro",
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
  createdAt: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationId?: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  organizationType?: OrganizationType;
  problem: string;
  budgetRange?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  nextStep?: string;
  createdAt: string;
};

export type Opportunity = {
  id: string;
  organization: string;
  problem: string;
  status: LeadStatus;
  estimatedValue?: number | null;
  leadId?: string;
  diagnosisId?: string;
  /** Cuando existe una propuesta vinculada. */
  proposalId?: string;
  hasProposal?: boolean;
  isDemo?: boolean;
  createdAt: string;
};

export type Interaction = {
  id: string;
  leadId?: string;
  opportunityId?: string;
  type: InteractionType;
  summary: string;
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
  createdAt: string;
};

export type CrmPipelineColumn = {
  status: LeadStatus;
  label: string;
};

export const CRM_PIPELINE_COLUMNS: CrmPipelineColumn[] = [
  { status: "new", label: "Nuevo" },
  { status: "contacted", label: "Contactado" },
  { status: "qualified", label: "Calificado" },
  { status: "diagnosis", label: "Diagnóstico" },
  { status: "proposal", label: "Propuesta" },
  { status: "negotiation", label: "Negociación" },
  { status: "won", label: "Ganado" },
  { status: "lost", label: "Perdido" },
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  diagnosis: "Diagnóstico",
  proposal: "Propuesta",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
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
};
