import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";
import { Badge } from "@/components/ui/Badge";

const CrmProposals = () => {
  return (
    <DashboardPage
      title="Propuestas"
      description="Representación de servicios, descripción, precio, condiciones y estado. Sin generación de PDF todavía."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline">draft</Badge>
        <Badge variant="outline">sent</Badge>
        <Badge variant="outline">negotiation</Badge>
        <Badge variant="outline">accepted</Badge>
        <Badge variant="outline">rejected</Badge>
        <Badge variant="outline">expired</Badge>
      </div>
      <DataTable
        columns={[
          { key: "title", label: "Propuesta" },
          { key: "organization", label: "Organización" },
          { key: "services", label: "Servicios" },
          { key: "price", label: "Precio" },
          { key: "status", label: "Estado" },
          { key: "createdAt", label: "Fecha" },
        ]}
        emptyMessage="No hay propuestas. La estructura queda lista para futura integración."
      />
    </DashboardPage>
  );
};

export default CrmProposals;
