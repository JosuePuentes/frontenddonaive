import { Link, useParams } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Widget } from "@/components/dashboard/widgets/Widget";
import { EmptyState } from "@/components/page/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  DASHBOARD_ROUTES,
  crmDiagnosticoNuevoPath,
} from "@/constants/dashboard-routes";

const CrmLeadDetail = () => {
  const { id = "—" } = useParams();

  return (
    <DashboardPage
      title="Detalle de lead"
      description="Vista preparada para información de contacto, problema, notas e interacciones."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={crmDiagnosticoNuevoPath(id === "—" ? undefined : id)}>
              Crear diagnóstico
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={DASHBOARD_ROUTES.crmLeads}>Volver a leads</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline">ID: {id}</Badge>
        <Badge variant="muted">Sin persistencia</Badge>
      </div>

      <Card variant="outline" className="mb-4 space-y-2">
        <h2 className="text-base font-semibold">Lead → Diagnóstico</h2>
        <p className="text-body-small text-muted-foreground">
          Acción preparada para iniciar un diagnóstico a partir de este lead.
          Sin guardado en esta etapa.
        </p>
        <Button asChild size="sm">
          <Link to={crmDiagnosticoNuevoPath(id === "—" ? undefined : id)}>
            Crear diagnóstico
          </Link>
        </Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="default" className="space-y-3">
          <h2 className="text-base font-semibold">Información del contacto</h2>
          <p className="text-body-small text-muted-foreground">Nombre: —</p>
          <p className="text-body-small text-muted-foreground">Correo: —</p>
          <p className="text-body-small text-muted-foreground">Teléfono: —</p>
        </Card>

        <Card variant="default" className="space-y-3">
          <h2 className="text-base font-semibold">Organización</h2>
          <p className="text-body-small text-muted-foreground">Nombre: —</p>
          <p className="text-body-small text-muted-foreground">Tipo: —</p>
          <p className="text-body-small text-muted-foreground">Origen: —</p>
        </Card>

        <Card variant="default" className="space-y-3 lg:col-span-2">
          <h2 className="text-base font-semibold">Problema detectado</h2>
          <p className="text-body-small text-muted-foreground">
            Aquí se mostrará el problema descrito por el contacto.
          </p>
        </Card>

        <Widget title="Notas" description="Espacio para notas internas.">
          <EmptyState
            title="Sin notas"
            description="Las notas se conectarán cuando exista backend."
          />
        </Widget>

        <Widget
          title="Interacciones"
          description="Tipos preparados: note, call, email, meeting, whatsapp, system."
        >
          <EmptyState
            title="Sin interacciones"
            description="Historial vacío en este scaffolding."
          />
        </Widget>

        <Card variant="outline" className="space-y-3 lg:col-span-2">
          <h2 className="text-base font-semibold">Estado y próximo paso</h2>
          <p className="text-body-small text-muted-foreground">Estado: —</p>
          <p className="text-body-small text-muted-foreground">
            Próximo paso: —
          </p>
        </Card>
      </div>
    </DashboardPage>
  );
};

export default CrmLeadDetail;
