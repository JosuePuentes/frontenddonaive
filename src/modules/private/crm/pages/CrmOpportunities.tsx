import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { PipelineBoard } from "@/modules/private/crm/components/PipelineBoard";
import type { Opportunity } from "@/types/crm";
import { Badge } from "@/components/ui/Badge";

/**
 * Ejemplos estáticos claramente marcados como DEMO
 * solo para visualizar el pipeline. No representan datos reales.
 */
const demoOpportunities: Opportunity[] = [
  {
    id: "demo-1",
    organization: "Organización DEMO A",
    organizationId: "demo-org-a",
    problem: "Procesos manuales y falta de control operativo",
    status: "diagnosis",
    priority: "high",
    urgency: "medium",
    estimatedValue: null,
    source: "website",
    diagnosisId: "demo-diagnosis-1",
    diagnosisIds: ["demo-diagnosis-1"],
    hasProposal: false,
    isDemo: true,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "demo-2",
    organization: "Organización DEMO B",
    organizationId: "demo-org-b",
    problem: "Información dispersa para tomar decisiones",
    status: "proposal",
    priority: "medium",
    urgency: "high",
    estimatedValue: null,
    source: "referral",
    diagnosisId: "demo-diagnosis-1",
    diagnosisIds: ["demo-diagnosis-1"],
    proposalId: "demo-proposal-1",
    proposalIds: ["demo-proposal-1"],
    primaryProposalId: "demo-proposal-1",
    hasProposal: true,
    isDemo: true,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "demo-3",
    organization: "Organización DEMO C",
    organizationId: "demo-org-c",
    problem: "Necesidad de estructurar responsabilidades",
    status: "negotiation",
    priority: "medium",
    urgency: "medium",
    estimatedValue: null,
    source: "event",
    proposalId: "demo-proposal-1",
    proposalIds: ["demo-proposal-1"],
    primaryProposalId: "demo-proposal-1",
    hasProposal: true,
    isDemo: true,
    createdAt: new Date(0).toISOString(),
  },
];

const CrmOpportunities = () => {
  return (
    <DashboardPage
      title="Oportunidades"
      description="Pipeline: Oportunidad → Diagnóstico → Propuesta → Negociación → Ganado. Las tarjetas DEMO solo ilustran el componente."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="muted">DEMO visual</Badge>
        <Badge variant="outline">Sin datos reales</Badge>
        <Badge variant="royal">Badge “Con propuesta” cuando aplica</Badge>
      </div>
      <PipelineBoard opportunities={demoOpportunities} />
    </DashboardPage>
  );
};

export default CrmOpportunities;
