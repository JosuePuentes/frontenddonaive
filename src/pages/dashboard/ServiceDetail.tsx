import { useState } from "react";
import { Link, useParams } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { ServiceCategoryBadge } from "@/components/dashboard/services";
import { EmptyState } from "@/components/page/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";
import { demoServices } from "@/constants/services-demo";
import { PRICING_MODEL_LABELS } from "@/types/services";

const ServiceDetail = () => {
  const { id = "" } = useParams();
  const service = demoServices.find((item) => item.id === id);
  const [active, setActive] = useState(service?.active ?? false);

  if (!service) {
    return (
      <DashboardPage
        title="Servicio"
        description="Detalle del catálogo."
        actions={
          <Button asChild variant="outline">
            <Link to={DASHBOARD_ROUTES.servicios}>Volver</Link>
          </Button>
        }
      >
        <EmptyState
          title="Servicio no disponible"
          description="No hay datos persistidos. Use un servicio DEMO del listado."
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title={service.name}
      description="Detalle del servicio — scaffolding sin persistencia."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled title="Sin persistencia">
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setActive((value) => !value)}
            title="Solo estado visual local"
          >
            {active ? "Desactivar" : "Activar"}
          </Button>
          <Button asChild variant="ghost">
            <Link to={DASHBOARD_ROUTES.servicios}>Volver</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {service.isDemo ? <Badge variant="muted">DEMO</Badge> : null}
        <ServiceCategoryBadge category={service.category} />
        <Badge variant={active ? "electric" : "muted"}>
          {active ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="default" className="space-y-3 lg:col-span-2">
          <h2 className="text-base font-semibold">Descripción</h2>
          <p className="text-body-small text-muted-foreground">
            {service.description}
          </p>
        </Card>

        <Card variant="outline" className="space-y-2">
          <h2 className="text-base font-semibold">Modelo de precio</h2>
          <p className="text-body-small text-muted-foreground">
            {PRICING_MODEL_LABELS[service.pricingModel]}
          </p>
          <p className="text-body-small text-muted-foreground">
            Precio base:{" "}
            {service.basePrice == null
              ? "Personalizado / no definido"
              : `${service.currency ?? ""} ${service.basePrice}`}
          </p>
        </Card>

        <Card variant="outline" className="space-y-2">
          <h2 className="text-base font-semibold">Duración estimada</h2>
          <p className="text-body-small text-muted-foreground">
            {service.estimatedDuration ?? "—"}
          </p>
        </Card>

        <Card variant="outline" className="space-y-2 lg:col-span-2">
          <h2 className="text-base font-semibold">Entregables</h2>
          {service.deliverables && service.deliverables.length > 0 ? (
            <ul className="list-inside list-disc text-body-small text-muted-foreground">
              {service.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-body-small text-muted-foreground">—</p>
          )}
        </Card>

        {service.tags && service.tags.length > 0 ? (
          <Card variant="ghost" className="flex flex-wrap gap-2 lg:col-span-2">
            {service.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </Card>
        ) : null}
      </div>
    </DashboardPage>
  );
};

export default ServiceDetail;
