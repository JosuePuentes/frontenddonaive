import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";
import { Badge } from "@/components/ui/Badge";

const CrmProjects = () => {
  return (
    <DashboardPage
      title="Proyectos"
      description="Proyectos relacionables posteriormente con Organization, Opportunity y Proposal."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline">planning</Badge>
        <Badge variant="outline">active</Badge>
        <Badge variant="outline">paused</Badge>
        <Badge variant="outline">completed</Badge>
        <Badge variant="outline">cancelled</Badge>
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Proyecto" },
          { key: "client", label: "Cliente" },
          { key: "status", label: "Estado" },
          { key: "owner", label: "Responsable" },
          { key: "createdAt", label: "Fecha" },
          { key: "nextStep", label: "Próximo paso" },
        ]}
        emptyMessage="No hay proyectos registrados en el scaffolding."
      />
    </DashboardPage>
  );
};

export default CrmProjects;
