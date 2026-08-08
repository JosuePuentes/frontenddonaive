import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { Widget } from "@/components/dashboard/widgets/Widget";
import { Badge } from "@/components/ui/Badge";

const modules = [
  {
    id: "activity",
    title: "Actividad",
    description: "Módulo de administración para actividad operativa.",
  },
  {
    id: "content",
    title: "Contenido",
    description: "Gestión editorial de blog, academy y media.",
  },
  {
    id: "clients",
    title: "Clientes",
    description: "Espacio reservado para relaciones y seguimiento.",
  },
  {
    id: "services",
    title: "Servicios",
    description: "Catálogo interno de capacidades y ofertas.",
  },
  {
    id: "resources",
    title: "Recursos",
    description: "Archivos, activos y materiales de trabajo.",
  },
] as const;

const Dashboard = () => {
  return (
    <DashboardPage
      title="Panel administrativo"
      description="Scaffolding del área privada de Donaive. Los datos reales se conectarán más adelante."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Módulos"
          value="—"
          hint="Placeholders conceptuales"
          badge="Admin"
        />
        <StatCard
          label="Contenido"
          value="—"
          hint="Sin CMS conectado"
          badge="Scaffold"
        />
        <StatCard
          label="Usuarios"
          value="—"
          hint="Sin autenticación real"
          badge="Stub"
        />
        <StatCard
          label="Recursos"
          value="—"
          hint="Pendiente de integración"
          badge="Ready"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {modules.map((module) => (
          <Widget
            key={module.id}
            title={module.title}
            description={module.description}
          >
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-dashed border-border bg-surface-muted/40 px-4 py-6">
              <p className="text-body-small text-muted-foreground">
                Módulo de administración preparado.
              </p>
              <Badge variant="outline">Placeholder</Badge>
            </div>
          </Widget>
        ))}
      </div>
    </DashboardPage>
  );
};

export default Dashboard;
