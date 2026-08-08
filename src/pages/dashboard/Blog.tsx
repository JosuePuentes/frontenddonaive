import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";
import { Button } from "@/components/ui/Button";

const Blog = () => {
  return (
    <DashboardPage
      title="Blog"
      description="Administración editorial del blog. CMS no conectado."
      actions={
        <Button type="button" variant="outline" disabled>
          Nuevo artículo
        </Button>
      }
    >
      <DataTable
        columns={[
          { key: "title", label: "Título" },
          { key: "status", label: "Estado" },
          { key: "updatedAt", label: "Actualizado" },
        ]}
        emptyMessage="No hay entradas. Estructura lista para CMS/API."
      />
    </DashboardPage>
  );
};

export default Blog;
