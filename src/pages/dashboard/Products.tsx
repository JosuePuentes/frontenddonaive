import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";

const Products = () => {
  return (
    <DashboardPage
      title="Productos"
      description="Catálogo interno de productos. Scaffold sin datos."
    >
      <DataTable
        columns={[
          { key: "name", label: "Producto" },
          { key: "category", label: "Categoría" },
          { key: "status", label: "Estado" },
        ]}
        emptyMessage="Sin productos registrados."
      />
    </DashboardPage>
  );
};

export default Products;
