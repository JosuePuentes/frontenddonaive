import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";

const Media = () => {
  return (
    <DashboardPage
      title="Media"
      description="Biblioteca de medios. Sin carga de archivos en esta etapa."
    >
      <DataTable
        columns={[
          { key: "name", label: "Nombre" },
          { key: "type", label: "Tipo" },
          { key: "size", label: "Tamaño" },
        ]}
        emptyMessage="No hay activos multimedia todavía."
      />
    </DashboardPage>
  );
};

export default Media;
