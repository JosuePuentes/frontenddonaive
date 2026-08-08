import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";

const Services = () => {
  return (
    <DashboardPage
      title="Servicios"
      description="Administración de capacidades y servicios ofrecidos."
    >
      <DataTable
        columns={[
          { key: "name", label: "Servicio" },
          { key: "area", label: "Área" },
          { key: "status", label: "Estado" },
        ]}
        emptyMessage="Sin servicios cargados en el panel."
      />
    </DashboardPage>
  );
};

export default Services;
