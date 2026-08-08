import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ServiceCategoryBadge } from "@/components/dashboard/services/ServiceCategoryBadge";
import { servicioDetailPath } from "@/constants/dashboard-routes";
import type { Service } from "@/types/services";
import { PRICING_MODEL_LABELS } from "@/types/services";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  service: Service;
  className?: string;
};

function ServiceCard({ service, className }: ServiceCardProps) {
  return (
    <Card
      variant="default"
      className={cn(
        "flex h-full flex-col gap-3 p-4",
        service.isDemo && "border-dashed",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ServiceCategoryBadge category={service.category} />
        <Badge variant={service.active ? "electric" : "muted"}>
          {service.active ? "Activo" : "Inactivo"}
        </Badge>
        {service.isDemo ? <Badge variant="muted">DEMO</Badge> : null}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
        <p className="text-body-small text-muted-foreground line-clamp-3">
          {service.description}
        </p>
      </div>

      <div className="space-y-1 text-caption text-muted-foreground">
        <p>Modelo: {PRICING_MODEL_LABELS[service.pricingModel]}</p>
        <p>
          Precio base:{" "}
          {service.basePrice == null
            ? "Personalizado / no definido"
            : `${service.currency ?? ""} ${service.basePrice}`}
        </p>
        {service.estimatedDuration ? (
          <p>Duración: {service.estimatedDuration}</p>
        ) : null}
      </div>

      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
        <Link to={servicioDetailPath(service.id)}>Ver detalle</Link>
      </Button>
    </Card>
  );
}

export { ServiceCard };
export type { ServiceCardProps };
