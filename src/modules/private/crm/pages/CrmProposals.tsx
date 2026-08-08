import { Link } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";
import { EmptyState } from "@/components/page/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DASHBOARD_ROUTES,
  crmPropuestaDetailPath,
} from "@/constants/dashboard-routes";
import {
  DEMO_PROPOSAL_ID,
  demoProposal,
} from "@/constants/proposals-demo";
import { ProposalStatusBadge } from "@/modules/private/crm/components/proposals/ProposalStatusBadge";
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS } from "@/types/proposal";

const CrmProposals = () => {
  return (
    <DashboardPage
      title="Propuestas"
      description="Del diagnóstico a una propuesta comercial estructurada. Sin PDF, pagos ni persistencia."
      actions={
        <Button asChild>
          <Link to={DASHBOARD_ROUTES.crmPropuestaNueva}>Nueva propuesta</Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="muted">DEMO visual</Badge>
        {PROPOSAL_STATUSES.map((status) => (
          <Badge key={status} variant="outline">
            {PROPOSAL_STATUS_LABELS[status]}
          </Badge>
        ))}
      </div>

      <Card
        variant="outline"
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ProposalStatusBadge status={demoProposal.status} />
            <Badge variant="muted">DEMO</Badge>
          </div>
          <p className="text-sm font-medium text-foreground">
            {demoProposal.title}
          </p>
          <p className="text-caption text-muted-foreground">
            {demoProposal.organizationName} · sin precios reales
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={crmPropuestaDetailPath(DEMO_PROPOSAL_ID)}>Abrir DEMO</Link>
        </Button>
      </Card>

      <DataTable
        columns={[
          { key: "title", label: "Propuesta" },
          { key: "organization", label: "Organización" },
          { key: "services", label: "Servicios" },
          { key: "total", label: "Inversión" },
          { key: "status", label: "Estado" },
          { key: "createdAt", label: "Fecha" },
        ]}
        emptyMessage="No hay propuestas persistidas. Use el DEMO o cree una nueva (shell visual)."
      />

      <EmptyState
        className="mt-6"
        title="Listado vacío"
        description="La estructura queda lista para futura integración."
      />
    </DashboardPage>
  );
};

export default CrmProposals;
