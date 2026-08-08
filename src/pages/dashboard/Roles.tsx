import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";
import { ROLES } from "@/constants/permissions";

const Roles = () => {
  return (
    <DashboardPage
      title="Roles"
      description="Roles conceptuales preparados para futura autorización en backend."
    >
      <DataTable
        columns={[
          { key: "role", label: "Rol" },
          { key: "scope", label: "Alcance" },
          { key: "status", label: "Estado" },
        ]}
        rows={ROLES.map((role) => ({
          role,
          scope: "Conceptual",
          status: "Scaffold",
        }))}
      />
    </DashboardPage>
  );
};

export default Roles;
