import { Link, useParams } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { EmptyState } from "@/components/page/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DASHBOARD_ROUTES,
  crmPropuestaNuevaPath,
} from "@/constants/dashboard-routes";
import {
  DEMO_PROPOSAL_ID,
  demoProposal,
} from "@/constants/proposals-demo";
import { ProposalView } from "@/modules/private/crm/components/proposals/ProposalView";

const CrmProposalDetail = () => {
  const { id = "" } = useParams();
  const isDemo = id === DEMO_PROPOSAL_ID;

  return (
    <DashboardPage
      title="Detalle de propuesta"
      description="Vista profesional: problema → comprensión → solución → alcance → entregables → inversión."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={DASHBOARD_ROUTES.crmPropuestas}>Volver</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={crmPropuestaNuevaPath()}>Nueva</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline">ID: {id || "—"}</Badge>
        {isDemo ? <Badge variant="muted">DEMO</Badge> : null}
        <Badge variant="outline">Sin acciones reales</Badge>
      </div>

      {isDemo ? (
        <ProposalView proposal={demoProposal} />
      ) : (
        <EmptyState
          title="Propuesta no disponible"
          description="No hay datos persistidos. Abra el DEMO o cree una propuesta (shell visual)."
        />
      )}
    </DashboardPage>
  );
};

export default CrmProposalDetail;
