/**
 * Propuestas comerciales Donaive V2 — modelo conceptual (frontend only).
 * Sin cálculos fiscales reales ni precios comerciales definitivos.
 */

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "negotiation",
  "accepted",
  "rejected",
  "expired",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export type ProposalItem = {
  id: string;
  serviceId?: string;
  packageId?: string;
  /** Ítem fuera del catálogo, documentado en name/description. */
  isCustom?: boolean;
  name: string;
  description?: string;
  quantity: number;
  unitPrice?: number | null;
  discount?: number | null;
  /** Preparado para cálculo futuro; no se calcula automáticamente. */
  total?: number | null;
};

export type Proposal = {
  id: string;
  opportunityId?: string;
  organizationId?: string;
  organizationName?: string;
  diagnosisId?: string;
  /** Diagnósticos adicionales cuando la propuesta combina varios. */
  diagnosisIds?: string[];
  /** Marca la propuesta principal/activa de una Opportunity. */
  isPrimary?: boolean;
  title: string;
  summary?: string;
  problemSummary?: string;
  solutionSummary?: string;
  deliverables?: string[];
  conditions?: string;
  validUntil?: string;
  currency?: string;
  items: ProposalItem[];
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  total?: number | null;
  status: ProposalStatus;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  viewed: "Vista",
  negotiation: "Negociación",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Expirada",
};

export const PROPOSAL_FLOW_STAGES = [
  "Lead",
  "Diagnóstico",
  "Problemas",
  "Soluciones",
  "Servicios",
  "Propuesta",
  "Negociación",
  "Proyecto",
] as const;
