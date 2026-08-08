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
    problem: "Procesos manuales y falta de control operativo",
    status: "diagnosis",
    estimatedValue: null,
    diagnosisId: "demo-diagnosis-1",
    hasProposal: false,
    isDemo: true,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "demo-2",
    organization: "Organización DEMO B",
    problem: "Información dispersa para tomar decisiones",
    status: "proposal",
    estimatedValue: null,
    diagnosisId: "demo-diagnosis-1",
    proposalId: "demo-proposal-1",
    hasProposal: true,
    isDemo: true,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: "demo-3",
    organization: "Organización DEMO C",
    problem: "Necesidad de estructurar responsabilidades",
    status: "negotiation",
    estimatedValue: null,
    proposalId: "demo-proposal-1",
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
