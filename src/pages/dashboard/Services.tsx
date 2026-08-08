import { useMemo, useState } from "react";
import { Link } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import {
  ServiceCard,
  ServiceFilters,
} from "@/components/dashboard/services";
import { EmptyState } from "@/components/page/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";
import { demoServices } from "@/constants/services-demo";
import {
  DEFAULT_SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  type ServiceCategoryKey,
} from "@/types/services";

const Services = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ServiceCategoryKey | "all">("all");
  const [activeOnly, setActiveOnly] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return demoServices.filter((service) => {
      if (activeOnly && !service.active) return false;
      if (category !== "all" && service.category !== category) return false;
      if (!query) return true;
      return (
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        SERVICE_CATEGORY_LABELS[service.category].toLowerCase().includes(query)
      );
    });
  }, [search, category, activeOnly]);

  return (
    <DashboardPage
      title="Servicios"
      description="Catálogo administrativo de capacidades Donaive. Categorías del catálogo — no afirman productos finales definitivos."
      actions={
        <Button asChild>
          <Link to={DASHBOARD_ROUTES.servicioNuevo}>Nuevo servicio</Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="muted">DEMO visual</Badge>
        <Badge variant="outline">Sin precios reales</Badge>
        <Badge variant="outline">Sin persistencia</Badge>
      </div>

      <Card variant="outline" className="mb-6 space-y-3">
        <h2 className="text-sm font-semibold">Categorías del catálogo</h2>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SERVICE_CATEGORIES.map((item) => (
            <Badge key={item.id} variant="outline">
              {item.name}
            </Badge>
          ))}
        </div>
      </Card>

      <ServiceFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        activeOnly={activeOnly}
        onActiveOnlyChange={setActiveOnly}
        className="mb-6"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin servicios en esta vista"
          description="Ajuste filtros o cree un servicio (shell visual)."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      <EmptyState
        className="mt-8"
        title="Sin catálogo persistido"
        description="Los servicios DEMO solo ilustran listado, filtros y acciones. La conexión llegará con backend."
      />
    </DashboardPage>
  );
};

export default Services;
