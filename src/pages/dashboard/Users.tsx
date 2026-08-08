import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DataTable } from "@/components/dashboard/tables/DataTable";
import { Button } from "@/components/ui/Button";

const Users = () => {
  return (
    <DashboardPage
      title="Usuarios"
      description="Gestión de usuarios del área privada. Sin datos conectados todavía."
      actions={
        <Button type="button" variant="outline" disabled>
          Nuevo usuario
        </Button>
      }
    >
      <DataTable
        columns={[
          { key: "name", label: "Nombre" },
          { key: "email", label: "Correo" },
          { key: "role", label: "Rol" },
          { key: "status", label: "Estado" },
        ]}
        emptyMessage="La tabla de usuarios quedará disponible cuando exista API."
      />
    </DashboardPage>
  );
};

export default Users;
