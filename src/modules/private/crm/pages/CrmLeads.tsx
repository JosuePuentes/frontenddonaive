import { Link } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { DASHBOARD_ROUTES, crmLeadDetailPath } from "@/constants/dashboard-routes";

const CrmLeads = () => {
  return (
    <DashboardPage
      title="Leads"
      description="Contactos captados desde el sitio u otros orígenes. Tabla preparada para futura integración."
      actions={
        <Button asChild variant="outline">
          <Link to={DASHBOARD_ROUTES.crm}>Volver al CRM</Link>
        </Button>
      }
    >
      <DataTable
        columns={[
          { key: "name", label: "Nombre" },
          { key: "organization", label: "Organización" },
          { key: "problem", label: "Problema" },
          { key: "source", label: "Origen" },
          { key: "status", label: "Estado" },
          { key: "createdAt", label: "Fecha" },
        ]}
        emptyMessage="No hay leads todavía. El detalle de ejemplo está disponible en la ruta dinámica."
      />
      <p className="mt-4 text-caption text-muted-foreground">
        Vista de detalle preparada:{" "}
        <Link
          to={crmLeadDetailPath("demo")}
          className="text-primary underline-offset-2 hover:underline"
        >
          /dashboard/crm/leads/demo
        </Link>
      </p>
    </DashboardPage>
  );
};

export default CrmLeads;
