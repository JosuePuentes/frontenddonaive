/**
 * Propuesta DEMO — solo para visualizar la UI profesional.
 * Sin precios reales ni clientes reales.
 */
import type { Proposal } from "@/types/proposal";
import { DEMO_DIAGNOSIS_ID } from "@/constants/diagnosis-demo";

export const DEMO_PROPOSAL_ID = "demo-proposal-1";

export const demoProposal: Proposal = {
  id: DEMO_PROPOSAL_ID,
  opportunityId: "demo-2",
  organizationId: "demo-org",
  organizationName: "Organización DEMO B",
  diagnosisId: DEMO_DIAGNOSIS_ID,
  diagnosisIds: [DEMO_DIAGNOSIS_ID],
  isPrimary: true,
  title: "Propuesta DEMO — control operativo",
  summary:
    "Propuesta de demostración: del problema comprendido a un alcance de servicios combinables.",
  problemSummary:
    "Información dispersa y seguimiento manual que dificultan el control del día a día.",
  solutionSummary:
    "Estructurar el proceso, centralizar el seguimiento y habilitar visibilidad con un tablero.",
  deliverables: [
    "Diagnóstico documentado",
    "Mapa de proceso TO-BE",
    "Priorización de automatizaciones",
    "Definición de tablero de control",
  ],
  conditions:
    "Condiciones DEMO. Vigencia ilustrativa. Sin compromiso comercial real.",
  validUntil: "DEMO",
  currency: "USD",
  items: [
    {
      id: "demo-item-1",
      serviceId: "demo-svc-1",
      name: "Diagnóstico empresarial DEMO",
      description: "Comprensión del problema y recomendaciones.",
      quantity: 1,
      unitPrice: null,
      discount: null,
      total: null,
    },
    {
      id: "demo-item-2",
      serviceId: "demo-svc-2",
      name: "Diseño de procesos DEMO",
      description: "Diseño del proceso propuesto.",
      quantity: 1,
      unitPrice: null,
      discount: null,
      total: null,
    },
    {
      id: "demo-item-3",
      serviceId: "demo-svc-3",
      name: "Automatización operativa DEMO",
      description: "Oportunidades de automatización priorizadas.",
      quantity: 1,
      unitPrice: null,
      discount: null,
      total: null,
    },
  ],
  subtotal: null,
  discount: null,
  tax: null,
  total: null,
  status: "draft",
  notes: "Ejemplo DEMO. No inventa precios ni cifras de Donaive.",
  isDemo: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};
