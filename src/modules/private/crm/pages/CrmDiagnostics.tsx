import { Link } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { EmptyState } from "@/components/page/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DASHBOARD_ROUTES,
  crmDiagnosticoDetailPath,
} from "@/constants/dashboard-routes";
import {
  DEMO_DIAGNOSIS_ID,
  demoAutomations,
  demoCurrentProcess,
  demoDiagnosis,
  demoImpacts,
  demoObservations,
  demoProblems,
  demoProposedProcess,
  demoRecommendations,
  demoRootCauses,
  demoSolutions,
} from "@/constants/diagnosis-demo";
import { DiagnosisView } from "@/modules/private/crm/components/diagnosis/DiagnosisView";

const CrmDiagnostics = () => {
  return (
    <DashboardPage
      title="Diagnósticos"
      description="De un problema observado a causa, impacto y solución estructurada — metodología Donaive."
      actions={
        <Button asChild>
          <Link to={DASHBOARD_ROUTES.crmDiagnosticoNuevo}>Nuevo diagnóstico</Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="muted">DEMO visual</Badge>
        <Badge variant="outline">Sin datos reales</Badge>
      </div>

      <Card variant="outline" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {demoDiagnosis.title}
          </p>
          <p className="text-caption text-muted-foreground">
            Ejemplo DEMO para escanear secciones del motor de diagnóstico.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={crmDiagnosticoDetailPath(DEMO_DIAGNOSIS_ID)}>
            Abrir DEMO
          </Link>
        </Button>
      </Card>

      <DiagnosisView
        diagnosis={demoDiagnosis}
        observations={demoObservations}
        problems={demoProblems}
        causes={demoRootCauses}
        impacts={demoImpacts}
        currentProcess={demoCurrentProcess}
        proposedProcess={demoProposedProcess}
        automations={demoAutomations}
        solutions={demoSolutions}
        recommendations={demoRecommendations}
      />

      <EmptyState
        className="mt-8"
        title="Sin diagnósticos persistidos"
        description="La lista real y el guardado se conectarán cuando exista backend. El bloque superior es solo DEMO."
      />
    </DashboardPage>
  );
};

export default CrmDiagnostics;
