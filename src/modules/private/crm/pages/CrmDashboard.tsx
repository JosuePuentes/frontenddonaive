import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { Widget } from "@/components/dashboard/widgets/Widget";
import { EmptyState } from "@/components/page/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { crmFlowStages } from "@/constants/crm";

const CrmDashboard = () => {
  return (
    <DashboardPage
      title="CRM"
      description="Arquitectura comercial para transformar contactos en oportunidades, propuestas y proyectos. Sin datos conectados todavía."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Oportunidades nuevas" value="—" badge="Vacío" hint="Sin leads conectados" />
        <StatCard label="En diagnóstico" value="—" badge="Vacío" hint="Pendiente de datos" />
        <StatCard label="Propuestas" value="—" badge="Vacío" hint="Sin propuestas activas" />
        <StatCard label="Negociaciones" value="—" badge="Vacío" hint="Pipeline vacío" />
        <StatCard label="Clientes ganados" value="—" badge="Vacío" hint="Sin cierres registrados" />
        <StatCard label="Clientes perdidos" value="—" badge="Vacío" hint="Sin pérdidas registradas" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Widget
          title="Flujo comercial"
          description="Representación conceptual del recorrido comercial de Donaive."
        >
          <div className="flex flex-wrap gap-2">
            {crmFlowStages.map((stage) => (
              <Badge key={stage} variant="outline">
                {stage}
              </Badge>
            ))}
          </div>
        </Widget>

        <EmptyState
          title="Sin actividad comercial"
          description="Cuando exista API/CRM backend, aquí se resumirá el estado del pipeline."
        />
      </div>
    </DashboardPage>
  );
};

export default CrmDashboard;
