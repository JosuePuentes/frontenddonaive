/**
 * Motor comercial Donaive V2 — contratos tipados (frontend only).
 * Relaciona CRM, diagnóstico, servicios, propuestas y proyectos.
 * Sin HTTP, scoring automático ni IA real.
 */

import type { DiagnosisPriority } from "@/types/diagnosis";

/** Origen del actor que crea/actualiza registros. */
export const ACTOR_SOURCES = ["human", "system", "ai_agent"] as const;
export type ActorSource = (typeof ACTOR_SOURCES)[number];

/** Motivos de pérdida — catálogo extensible. */
export const LOSS_REASON_KEYS = [
  "no_budget",
  "no_fit",
  "timing",
  "competitor",
  "no_response",
  "rejected",
  "internal_decision",
  "other",
] as const;

export type LossReasonKey = (typeof LOSS_REASON_KEYS)[number];

export type LossReason = {
  id: string;
  key: LossReasonKey | string;
  label: string;
  active: boolean;
  description?: string;
};

export const DEFAULT_LOSS_REASONS: LossReason[] = [
  { id: "loss-no-budget", key: "no_budget", label: "Sin presupuesto", active: true },
  { id: "loss-no-fit", key: "no_fit", label: "Sin encaje", active: true },
  { id: "loss-timing", key: "timing", label: "Timing", active: true },
  {
    id: "loss-competitor",
    key: "competitor",
    label: "Competencia",
    active: true,
  },
  {
    id: "loss-no-response",
    key: "no_response",
    label: "Sin respuesta",
    active: true,
  },
  { id: "loss-rejected", key: "rejected", label: "Rechazada", active: true },
  {
    id: "loss-internal",
    key: "internal_decision",
    label: "Decisión interna",
    active: true,
  },
  { id: "loss-other", key: "other", label: "Otro", active: true },
];

export const QUALIFICATION_LEVELS = [
  "qualified",
  "partially_qualified",
  "not_qualified",
] as const;

export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

/** Checklist de calificación — sin scoring matemático. */
export type QualificationCriteria = {
  problemIdentified?: boolean;
  contactReachable?: boolean;
  organizationIdentified?: boolean;
  serviceFit?: boolean;
  urgency?: boolean;
  budgetKnown?: boolean;
  decisionMakerKnown?: boolean;
  qualificationNotes?: string;
  level?: QualificationLevel;
};

export const QUALIFICATION_LEVEL_LABELS: Record<QualificationLevel, string> = {
  qualified: "Calificado",
  partially_qualified: "Parcialmente calificado",
  not_qualified: "No calificado",
};

export type EstimatedValueRange = {
  min?: number | null;
  max?: number | null;
  currency?: string;
};

export const ACTIVITY_TYPES = [
  "call",
  "meeting",
  "email",
  "whatsapp",
  "follow_up",
  "task",
  "note",
  "system",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "suggested",
] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

/**
 * Actividad / tarea comercial.
 * `suggested` permite que una IA futura proponga sin ejecutar.
 */
export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  priority?: DiagnosisPriority;
  dueAt?: string;
  assignedTo?: string;
  createdBy: ActorSource;
  organizationId?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  diagnosisId?: string;
  proposalId?: string;
  projectId?: string;
  /** Fuente/canal (website, whatsapp, system, ai_agent, …). */
  source: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
  suggested: "Sugerida",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "Llamada",
  meeting: "Reunión",
  email: "Correo",
  whatsapp: "WhatsApp",
  follow_up: "Seguimiento",
  task: "Tarea",
  note: "Nota",
  system: "Sistema",
};

/** Vínculo flexible Solution → Service / Package / custom. */
export const SOLUTION_LINK_KINDS = ["service", "package", "custom"] as const;
export type SolutionLinkKind = (typeof SOLUTION_LINK_KINDS)[number];

export type SolutionServiceLink = {
  id: string;
  solutionId: string;
  kind: SolutionLinkKind;
  serviceId?: string;
  packageId?: string;
  /** Para soluciones personalizadas o híbridas no catalogadas. */
  customLabel?: string;
  customDescription?: string;
  notes?: string;
};
