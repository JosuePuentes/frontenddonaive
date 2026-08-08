import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";

const Files = () => {
  return (
    <DashboardPage
      title="Archivos"
      description="Gestión de archivos administrativos. Sin almacenamiento conectado."
    >
      <DataTable
        columns={[
          { key: "name", label: "Archivo" },
          { key: "folder", label: "Carpeta" },
          { key: "updatedAt", label: "Actualizado" },
        ]}
        emptyMessage="No hay archivos en el scaffolding."
      />
    </DashboardPage>
  );
};

export default Files;
