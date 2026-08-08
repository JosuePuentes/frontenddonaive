import { Link, useParams } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { EmptyState } from "@/components/page/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DASHBOARD_ROUTES,
  crmDiagnosticoNuevoPath,
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

const CrmDiagnosisDetail = () => {
  const { id = "" } = useParams();
  const isDemo = id === DEMO_DIAGNOSIS_ID;

  return (
    <DashboardPage
      title="Detalle de diagnóstico"
      description="Vista preparada para explorar el diagnóstico completo por secciones."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={DASHBOARD_ROUTES.crmDiagnosticos}>Volver</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={crmDiagnosticoNuevoPath()}>Nuevo</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline">ID: {id || "—"}</Badge>
        {isDemo ? <Badge variant="muted">DEMO</Badge> : null}
        <Badge variant="outline">Sin persistencia</Badge>
      </div>

      {isDemo ? (
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
      ) : (
        <EmptyState
          title="Diagnóstico no disponible"
          description="No hay datos persistidos. Use el DEMO o cree un diagnóstico (shell visual)."
        />
      )}
    </DashboardPage>
  );
};

export default CrmDiagnosisDetail;
