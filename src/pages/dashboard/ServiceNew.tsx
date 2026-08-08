import { Link } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { ServiceForm } from "@/components/dashboard/services";
import { Button } from "@/components/ui/Button";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";

const ServiceNew = () => {
  return (
    <DashboardPage
      title="Nuevo servicio"
      description="Formulario visual del catálogo. No guarda datos."
      actions={
        <Button asChild variant="outline">
          <Link to={DASHBOARD_ROUTES.servicios}>Volver</Link>
        </Button>
      }
    >
      <ServiceForm />
    </DashboardPage>
  );
};

export default ServiceNew;
