import { Link, useSearchParams } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Button } from "@/components/ui/Button";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";
import { ProposalWizardShell } from "@/modules/private/crm/components/proposals/ProposalWizardShell";
import { PROPOSAL_FLOW_STAGES } from "@/types/proposal";
import { Badge } from "@/components/ui/Badge";

const CrmProposalNew = () => {
  const [params] = useSearchParams();
  const diagnosisId = params.get("diagnosisId");
  const opportunityId = params.get("opportunityId");

  return (
    <DashboardPage
      title="Nueva propuesta"
      description="Construya visualmente resumen, servicios, entregables, inversión y condiciones. Sin guardado."
      actions={
        <Button asChild variant="outline">
          <Link to={DASHBOARD_ROUTES.crmPropuestas}>Volver</Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {PROPOSAL_FLOW_STAGES.map((stage) => (
          <Badge key={stage} variant="outline">
            {stage}
          </Badge>
        ))}
      </div>
      <ProposalWizardShell
        diagnosisId={diagnosisId}
        opportunityId={opportunityId}
      />
    </DashboardPage>
  );
};

export default CrmProposalNew;
